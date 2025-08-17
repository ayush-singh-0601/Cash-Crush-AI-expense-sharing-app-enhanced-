import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
export const createSettlement = mutation({
  args: {
    amount: v.number(), 
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")), 
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(internal.users.getCurrentUser);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.paidByUserId === args.receivedByUserId) {
      throw new Error("Payer and receiver cannot be the same user");
    }
    if (
      caller._id !== args.paidByUserId &&
      caller._id !== args.receivedByUserId
    ) {
      throw new Error("You must be either the payer or the receiver");
    }
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");

      const isMember = (uid) => group.members.some((m) => m.userId === uid);
      if (!isMember(args.paidByUserId) || !isMember(args.paidByUserId)) {
        throw new Error("Both parties must be members of the group");
      }
    }
    const settlementId = await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(), 
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      relatedExpenseIds: args.relatedExpenseIds,
      method: "manual",
      createdBy: caller._id,
    });

    // Create feed activity for group settlements
    if (args.groupId) {
      const payer = await ctx.db.get(args.paidByUserId);
      const receiver = await ctx.db.get(args.receivedByUserId);
      
      await ctx.db.insert("feedActivities", {
        groupId: args.groupId,
        userId: caller._id,
        activityType: "settlement_made",
        title: `${payer.name} settled up with ${receiver.name}`,
        description: `Settlement of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(args.amount)}`,
        relatedSettlementId: settlementId,
        metadata: {
          amount: args.amount,
        },
        createdAt: Date.now(),
      });

      // Send system message to group chat
      await ctx.db.insert("groupMessages", {
        groupId: args.groupId,
        userId: caller._id,
        message: `${payer.name} settled ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(args.amount)} with ${receiver.name}`,
        messageType: "settlement_made",
        relatedSettlementId: settlementId,
        createdAt: Date.now(),
      });
    }

    return settlementId;
  },
});

// TEMP: one-time migration to clean legacy settlements documents
// - Ensure method exists (set to "manual" if missing)
// - Move notes -> note
// - Remove legacy fields: notes, paymentMethod
export const migrateLegacySettlements = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("settlements").collect();
    let updated = 0;

    for (const doc of all) {
      const patch = {};

      if (doc.method === undefined) {
        patch.method = "manual";
      }

      if (doc.note === undefined && doc.notes !== undefined) {
        patch.note = doc.notes;
      }

      if (doc.notes !== undefined) {
        // remove temporary field after copying
        patch.notes = undefined;
      }

      if (doc.paymentMethod !== undefined) {
        // drop legacy field from old payment integration
        patch.paymentMethod = undefined;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(doc._id, patch);
        updated++;
      }
    }

    return { updated };
  },
});
export const getSettlementData = query({
  args: {
    entityType: v.string(), 
    entityId: v.string(), 
  },
  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);

    if (args.entityType === "user") {
      const other = await ctx.db.get(args.entityId);
      if (!other) throw new Error("User not found");
      const myExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined)
        )
        .collect();

      const otherUserExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined)
        )
        .collect();

      const expenses = [...myExpenses, ...otherUserExpenses];

      let owed = 0; 
      let owing = 0; 

      for (const exp of expenses) {
        const involvesMe =
          exp.paidByUserId === me._id ||
          exp.splits.some((s) => s.userId === me._id);
        const involvesThem =
          exp.paidByUserId === other._id ||
          exp.splits.some((s) => s.userId === other._id);
        if (!involvesMe || !involvesThem) continue;
        if (exp.paidByUserId === me._id) {
          const split = exp.splits.find(
            (s) => s.userId === other._id && !s.paid
          );
          if (split) owed += split.amount;
        }
        if (exp.paidByUserId === other._id) {
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) owing += split.amount;
        }
      }

      const mySettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined)
        )
        .collect();

      const otherUserSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined)
        )
        .collect();

      const settlements = [...mySettlements, ...otherUserSettlements];

      for (const st of settlements) {
        if (st.paidByUserId === me._id) {
          owing = Math.max(0, owing - st.amount);
        } else {
          owed = Math.max(0, owed - st.amount);
        }
      }

      return {
        type: "user",
        counterpart: {
          userId: other._id,
          name: other.name,
          email: other.email,
          imageUrl: other.imageUrl,
        },
        youAreOwed: owed,
        youOwe: owing,
        netBalance: owed - owing, 
      };
    } else if (args.entityType === "group") {
      const group = await ctx.db.get(args.entityId);
      if (!group) throw new Error("Group not found");

      const isMember = group.members.some((m) => m.userId === me._id);
      if (!isMember) throw new Error("You are not a member of this group");
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();
      const balances = {};
      group.members.forEach((m) => {
        if (m.userId !== me._id) balances[m.userId] = { owed: 0, owing: 0 };
      });

      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {

          exp.splits.forEach((split) => {
            if (split.userId !== me._id && !split.paid) {
              balances[split.userId].owed += split.amount;
            }
          });
        } else if (balances[exp.paidByUserId]) {

          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) balances[exp.paidByUserId].owing += split.amount;
        }
      }
      const settlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for (const st of settlements) {
        if (st.paidByUserId === me._id && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(
            0,
            balances[st.receivedByUserId].owing - st.amount
          );
        }
        if (st.receivedByUserId === me._id && balances[st.paidByUserId]) {
          balances[st.paidByUserId].owed = Math.max(
            0,
            balances[st.paidByUserId].owed - st.amount
          );
        }
      }

      const members = await Promise.all(
        Object.keys(balances).map((id) => ctx.db.get(id))
      );

      const list = Object.keys(balances).map((uid) => {
        const m = members.find((u) => u && u._id === uid);
        const { owed, owing } = balances[uid];
        return {
          userId: uid,
          name: m?.name || "Unknown",
          imageUrl: m?.imageUrl,
          youAreOwed: owed,
          youOwe: owing,
          netBalance: owed - owing,
        };
      });

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        balances: list,
      };
    }
    throw new Error("Invalid entityType; expected 'user' or 'group'");
  },
});