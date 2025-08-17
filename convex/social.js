import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE REACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const addReaction = mutation({
  args: {
    expenseId: v.id("expenses"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already reacted to this expense
    const existingReaction = await ctx.db
      .query("expenseReactions")
      .withIndex("by_expense_user", (q) => 
        q.eq("expenseId", args.expenseId).eq("userId", user._id)
      )
      .first();

    if (existingReaction) {
      // Update existing reaction
      await ctx.db.patch(existingReaction._id, {
        emoji: args.emoji,
        createdAt: Date.now(),
      });
      return existingReaction._id;
    } else {
      // Create new reaction
      const reactionId = await ctx.db.insert("expenseReactions", {
        expenseId: args.expenseId,
        userId: user._id,
        emoji: args.emoji,
        createdAt: Date.now(),
      });

      // Create feed activity
      const expense = await ctx.db.get(args.expenseId);
      if (expense) {
        await ctx.db.insert("feedActivities", {
          groupId: expense.groupId,
          userId: user._id,
          activityType: "reaction_added",
          title: `${user.name} reacted to "${expense.description}"`,
          description: `Reacted with ${args.emoji}`,
          relatedExpenseId: args.expenseId,
          metadata: {
            emoji: args.emoji,
            amount: expense.amount,
          },
          createdAt: Date.now(),
        });
      }

      return reactionId;
    }
  },
});

export const removeReaction = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const reaction = await ctx.db
      .query("expenseReactions")
      .withIndex("by_expense_user", (q) => 
        q.eq("expenseId", args.expenseId).eq("userId", user._id)
      )
      .first();

    if (reaction) {
      await ctx.db.delete(reaction._id);
    }
  },
});

export const getExpenseReactions = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("expenseReactions")
      .withIndex("by_expense", (q) => q.eq("expenseId", args.expenseId))
      .collect();

    // Group reactions by emoji and include user info
    const reactionGroups = {};
    for (const reaction of reactions) {
      const user = await ctx.db.get(reaction.userId);
      if (!reactionGroups[reaction.emoji]) {
        reactionGroups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      reactionGroups[reaction.emoji].count++;
      reactionGroups[reaction.emoji].users.push({
        id: user._id,
        name: user.name,
        imageUrl: user.imageUrl,
      });
    }

    return Object.values(reactionGroups);
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE COMMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const addComment = mutation({
  args: {
    expenseId: v.id("expenses"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const commentId = await ctx.db.insert("expenseComments", {
      expenseId: args.expenseId,
      userId: user._id,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Create feed activity
    const expense = await ctx.db.get(args.expenseId);
    if (expense) {
      await ctx.db.insert("feedActivities", {
        groupId: expense.groupId,
        userId: user._id,
        activityType: "comment_added",
        title: `${user.name} commented on "${expense.description}"`,
        description: args.comment.length > 50 ? args.comment.substring(0, 50) + "..." : args.comment,
        relatedExpenseId: args.expenseId,
        relatedCommentId: commentId,
        metadata: {
          amount: expense.amount,
        },
        createdAt: Date.now(),
      });
    }

    return commentId;
  },
});

export const getExpenseComments = query({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("expenseComments")
      .withIndex("by_expense", (q) => q.eq("expenseId", args.expenseId))
      .order("desc")
      .collect();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            id: user._id,
            name: user.name,
            imageUrl: user.imageUrl,
          },
        };
      })
    );

    return commentsWithUsers;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("expenseComments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only allow the comment author to delete their comment
    if (comment.userId !== user._id) {
      throw new Error("Not authorized to delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP CHAT
// ═══════════════════════════════════════════════════════════════════════════════

export const sendMessage = mutation({
  args: {
    groupId: v.id("groups"),
    message: v.string(),
    messageType: v.optional(v.string()),
    relatedExpenseId: v.optional(v.id("expenses")),
    relatedSettlementId: v.optional(v.id("settlements")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is member of the group
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const isMember = group.members.some(member => member.userId === user._id);
    if (!isMember) {
      throw new Error("Not a member of this group");
    }

    const messageId = await ctx.db.insert("groupMessages", {
      groupId: args.groupId,
      userId: user._id,
      message: args.message,
      messageType: args.messageType || "text",
      relatedExpenseId: args.relatedExpenseId,
      relatedSettlementId: args.relatedSettlementId,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const getGroupMessages = query({
  args: {
    groupId: v.id("groups"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is member of the group
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const isMember = group.members.some(member => member.userId === user._id);
    if (!isMember) {
      throw new Error("Not a member of this group");
    }

    const messages = await ctx.db
      .query("groupMessages")
      .withIndex("by_group_date", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .take(args.limit || 50);

    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const messageUser = await ctx.db.get(message.userId);
        let relatedExpense = null;
        let relatedSettlement = null;

        if (message.relatedExpenseId) {
          relatedExpense = await ctx.db.get(message.relatedExpenseId);
        }
        if (message.relatedSettlementId) {
          relatedSettlement = await ctx.db.get(message.relatedSettlementId);
        }

        return {
          ...message,
          user: {
            id: messageUser._id,
            name: messageUser.name,
            imageUrl: messageUser.imageUrl,
          },
          relatedExpense,
          relatedSettlement,
        };
      })
    );

    return messagesWithUsers.reverse(); // Return in chronological order
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════════════════

export const getGroupFeed = query({
  args: {
    groupId: v.id("groups"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is member of the group
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const isMember = group.members.some(member => member.userId === user._id);
    if (!isMember) {
      throw new Error("Not a member of this group");
    }

    const activities = await ctx.db
      .query("feedActivities")
      .withIndex("by_group_date", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .take(args.limit || 20);

    const activitiesWithDetails = await Promise.all(
      activities.map(async (activity) => {
        const activityUser = await ctx.db.get(activity.userId);
        let relatedExpense = null;
        let relatedSettlement = null;
        let relatedComment = null;

        if (activity.relatedExpenseId) {
          relatedExpense = await ctx.db.get(activity.relatedExpenseId);
        }
        if (activity.relatedSettlementId) {
          relatedSettlement = await ctx.db.get(activity.relatedSettlementId);
        }
        if (activity.relatedCommentId) {
          relatedComment = await ctx.db.get(activity.relatedCommentId);
        }

        return {
          ...activity,
          user: {
            id: activityUser._id,
            name: activityUser.name,
            imageUrl: activityUser.imageUrl,
          },
          relatedExpense,
          relatedSettlement,
          relatedComment,
        };
      })
    );

    return activitiesWithDetails;
  },
});

export const createFeedActivity = mutation({
  args: {
    groupId: v.id("groups"),
    activityType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    relatedExpenseId: v.optional(v.id("expenses")),
    relatedSettlementId: v.optional(v.id("settlements")),
    metadata: v.optional(v.object({
      amount: v.optional(v.number()),
      emoji: v.optional(v.string()),
      category: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const activityId = await ctx.db.insert("feedActivities", {
      groupId: args.groupId,
      userId: user._id,
      activityType: args.activityType,
      title: args.title,
      description: args.description,
      relatedExpenseId: args.relatedExpenseId,
      relatedSettlementId: args.relatedSettlementId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return activityId;
  },
});
