import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
    // TEMP: accept legacy UPI id during migration; remove later
    upiId: v.optional(v.string()),
    // Gamification fields
    currentStreak: v.optional(v.number()),
    longestStreak: v.optional(v.number()),
    lastExpenseDate: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" }),

  expenses: defineTable({
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
    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_date", ["date"]),
    // Settlements between users or within groups
  settlements: defineTable({
    amount: v.number(),
    date: v.number(),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    createdBy: v.id("users"),
    note: v.optional(v.string()),
    notes: v.optional(v.string()), // Temporary field for migration
    method: v.optional(v.string()), // e.g., 'cash', 'other'
    paymentMethod: v.optional(v.string()), // TEMP: accept legacy field for migration
    groupId: v.optional(v.id("groups")),
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_receiver_and_group", ["receivedByUserId", "groupId"])
    .index("by_date", ["date"]),


  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdBy: v.id("users"),
    members: v.array(
      v.object({
        userId: v.id("users"), 
        role: v.string(), 
        joinedAt: v.number(),
      })
    ),
    activeChallengeId: v.optional(v.id("groupChallenges")),
  })
    .index("by_user", ["members"]),

  // Social Features Tables
  expenseReactions: defineTable({
    expenseId: v.id("expenses"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_expense", ["expenseId"])
    .index("by_user", ["userId"])
    .index("by_expense_user", ["expenseId", "userId"]),

  expenseComments: defineTable({
    expenseId: v.id("expenses"),
    userId: v.id("users"),
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_expense", ["expenseId"])
    .index("by_user", ["userId"])
    .index("by_date", ["createdAt"]),

  groupMessages: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    message: v.string(),
    messageType: v.string(), // "text", "expense_added", "settlement_made", "system"
    relatedExpenseId: v.optional(v.id("expenses")),
    relatedSettlementId: v.optional(v.id("settlements")),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_date", ["groupId", "createdAt"]),

  feedActivities: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    activityType: v.string(), // "expense_added", "expense_updated", "settlement_made", "comment_added", "reaction_added"
    title: v.string(),
    description: v.optional(v.string()),
    relatedExpenseId: v.optional(v.id("expenses")),
    relatedSettlementId: v.optional(v.id("settlements")),
    relatedCommentId: v.optional(v.id("expenseComments")),
    metadata: v.optional(v.object({
      amount: v.optional(v.number()),
      emoji: v.optional(v.string()),
      category: v.optional(v.string()),
    })),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_date", ["groupId", "createdAt"])
    .index("by_activity_type", ["activityType"]),

  // Gamification Tables
  achievements: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
  })
    .index("by_name", ["name"]),

  userAchievements: defineTable({
    userId: v.id("users"),
    achievementId: v.id("achievements"),
    achievedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_achievement", ["userId", "achievementId"]),

  // Gamification: Group Challenges
  groupChallenges: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    description: v.string(),
    goalAmount: v.number(),
    currentAmount: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.string(), // e.g., 'achievement_unlocked', 'challenge_completed'
    read: v.boolean(),
    link: v.optional(v.string()), // e.g., '/gamification'
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
