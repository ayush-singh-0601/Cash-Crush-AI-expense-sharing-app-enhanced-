import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const isMember = group.members.some(
        (member) => member.userId === user._id
      );
      if (!isMember) {
        throw new Error("You are not a member of this group");
      }
    }
    const totalSplitAmount = args.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const tolerance = 0.01;
    if (Math.abs(totalSplitAmount - args.amount) > tolerance) {
      throw new Error("Split amounts must add up to the total expense amount");
    }
    const involvedUserIds = Array.from(
      new Set([args.paidByUserId, ...args.splits.map((s) => s.userId)])
    );
    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: user._id,
    });

    // --- Gamification: Update Streaks for all involved users ---
    const uniqueInvolvedUserIds = Array.from(new Set(involvedUserIds));

    for (const userId of uniqueInvolvedUserIds) {
      const userToUpdate = await ctx.db.get(userId);
      if (!userToUpdate) continue;

      const lastExpenseDate = userToUpdate.lastExpenseDate || 0;
      let currentStreak = userToUpdate.currentStreak || 0;
      let longestStreak = userToUpdate.longestStreak || 0;

      const newExpenseDate = new Date(args.date);
      const lastDate = new Date(lastExpenseDate);

      // Normalize dates to the start of the day
      newExpenseDate.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);

      const diffTime = newExpenseDate.getTime() - lastDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        // Expense on consecutive day, increment streak
        currentStreak++;
      } else if (diffDays > 1) {
        // Gap in expenses, reset streak
        currentStreak = 1;
      } else if (diffDays < 0) {
        // Historical expense, do not penalize streak
      } else {
        // Same day expense, streak doesn't change unless it's the first one
        if (currentStreak === 0) {
          currentStreak = 1;
        }
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      await ctx.db.patch(userId, {
        currentStreak,
        longestStreak,
        lastExpenseDate: args.date,
      });
    }
    // --- End Gamification ---

    // Schedule achievement checks for all involved users
    for (const userId of uniqueInvolvedUserIds) {
        await ctx.scheduler.runAfter(0, internal.gamification.checkAndAwardAchievements, {
            userId: userId,
            expenseAmount: args.amount,
            groupId: args.groupId,
        });
    }

    // If part of a group, update challenge progress
    if (args.groupId) {
        await ctx.scheduler.runAfter(0, internal.gamification.updateChallengeProgress, {
            groupId: args.groupId,
            expenseAmount: args.amount,
        });
    }

    // Create feed activity for group expenses
    if (args.groupId) {
      await ctx.db.insert("feedActivities", {
        groupId: args.groupId,
        userId: user._id,
        activityType: "expense_added",
        title: `${user.name} added a new expense`,
        description: `Added "${args.description}" for ${new Intl.NumberFormat(
          "en-IN",
          { style: "currency", currency: "INR" }
        ).format(args.amount)}`,
        relatedExpenseId: expenseId,
        metadata: {
          amount: args.amount,
          category: args.category || "Other",
        },
        createdAt: Date.now(),
      });

      // Send system message to group chat
      await ctx.db.insert("groupMessages", {
        groupId: args.groupId,
        userId: user._id,
        message: `Added expense: ${args.description}`,
        messageType: "expense_added",
        relatedExpenseId: expenseId,
        createdAt: Date.now(),
      });
    }

    return expenseId;
  },
});

export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (me._id === userId) throw new Error("Cannot query yourself");

    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", me._id).eq("groupId", undefined)
      )
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId).eq("groupId", undefined)
      )
      .collect();
    const candidateExpenses = [...myPaid, ...theirPaid];
    const expenses = candidateExpenses.filter((e) => {
      const meInSplits = e.splits.some((s) => s.userId === me._id);
      const themInSplits = e.splits.some((s) => s.userId === userId);

      const meInvolved = e.paidByUserId === me._id || meInSplits;
      const themInvolved = e.paidByUserId === userId || themInSplits;

      return meInvolved && themInvolved;
    });

    expenses.sort((a, b) => b.date - a.date);

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.eq(q.field("groupId"), undefined),
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), me._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
              q.eq(q.field("receivedByUserId"), me._id)
            )
          )
        )
      )
      .collect();

    settlements.sort((a, b) => b.date - a.date);

    let balance = 0;

    for (const e of expenses) {
      if (e.paidByUserId === me._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount; 
      } else {
        const split = e.splits.find((s) => s.userId === me._id && !s.paid);
        if (split) balance -= split.amount; 
      }
    }

    for (const s of settlements) {
      if (s.paidByUserId === me._id)
        balance += s.amount; 
      else balance -= s.amount; 
    }
    const other = await ctx.db.get(userId);
    if (!other) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});
export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

 
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.createdBy !== user._id && expense.paidByUserId !== user._id) {
      throw new Error("You don't have permission to delete this expense");
    }
    const allSettlements = await ctx.db.query("settlements").collect();

    const relatedSettlements = allSettlements.filter(
      (settlement) =>
        settlement.relatedExpenseIds !== undefined &&
        settlement.relatedExpenseIds.includes(args.expenseId)
    );

    for (const settlement of relatedSettlements) {
      const updatedRelatedExpenseIds = settlement.relatedExpenseIds.filter(
        (id) => id !== args.expenseId
      );

      if (updatedRelatedExpenseIds.length === 0) {

        await ctx.db.delete(settlement._id);
      } else {

        await ctx.db.patch(settlement._id, {
          relatedExpenseIds: updatedRelatedExpenseIds,
        });
      }
    }

 
    await ctx.db.delete(args.expenseId);

    return { success: true };
  },
});

// Migration: Backfill involvedUserIds for all expenses missing it
export const backfillInvolvedUserIds = mutation({
  handler: async (ctx) => {
    const allExpenses = await ctx.db.query("expenses").collect();
    let updated = 0;
    for (const exp of allExpenses) {
      if (!exp.involvedUserIds) {
        const involvedUserIds = Array.from(new Set([
          exp.paidByUserId,
          ...exp.splits.map((s) => s.userId),
        ]));
        await ctx.db.patch(exp._id, { involvedUserIds });
        updated++;
      }
    }
    return { updated };
  },
});
