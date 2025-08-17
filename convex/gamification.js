import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// --- Achievement Definitions ---
// We store these here and insert them into the 'achievements' table if they don't exist.
const ACHIEVEMENT_DEFS = {
  FIRST_EXPENSE: {
    name: "First Expense!",
    description: "You added your first expense.",
    icon: "🎉",
  },
  STREAK_STARTER: {
    name: "Streak Starter",
    description: "You've maintained a 3-day spending streak.",
    icon: "🔥",
  },
  STREAK_MASTER: {
    name: "Streak Master",
    description: "You've maintained a 7-day spending streak!",
    icon: "🏆",
  },
  BIG_SPENDER: {
    name: "Big Spender",
    description: "You added an expense over ₹1000.",
    icon: "💰",
  },
};

// Helper to get or create an achievement definition
const getOrCreateAchievement = async (ctx, achievementKey) => {
  const definition = ACHIEVEMENT_DEFS[achievementKey];
  if (!definition) return null;

  let achievement = await ctx.db
    .query("achievements")
    .withIndex("by_name", (q) => q.eq("name", definition.name))
    .first();

  if (!achievement) {
    const achievementId = await ctx.db.insert("achievements", definition);
    achievement = { ...definition, _id: achievementId };
  }

  return achievement;
};

// Helper to award an achievement if not already earned
const awardAchievement = async (ctx, { userId, achievementKey, groupId }) => {
  const achievement = await getOrCreateAchievement(ctx, achievementKey);
  if (!achievement) return;

  const existing = await ctx.db
    .query("userAchievements")
    .withIndex("by_user_and_achievement", (q) =>
      q.eq("userId", userId).eq("achievementId", achievement._id)
    )
    .first();

  if (existing) return; // Already awarded

  await ctx.db.insert("userAchievements", {
    userId,
    achievementId: achievement._id,
    achievedAt: Date.now(),
  });

  // Create a notification for the achievement
  await ctx.db.insert("notifications", {
    userId,
    title: "Achievement Unlocked! 🎉",
    description: `You unlocked: ${achievement.name}`,
    type: "achievement_unlocked",
    read: false,
    link: "/profile", // Link to a page where they can see their achievements
    createdAt: Date.now(),
  });

  // Create a feed activity for the achievement
  if (groupId) {
    const user = await ctx.db.get(userId);
    await ctx.db.insert("feedActivities", {
        groupId,
        userId,
        activityType: "achievement_unlocked",
        title: `${user.name} unlocked an achievement!`,
        description: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
        relatedAchievementId: achievement._id,
        createdAt: Date.now(),
    });
  }
};

export const checkAndAwardAchievements = internalMutation({
  args: {
    userId: v.id("users"),
    expenseAmount: v.number(),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, { userId, expenseAmount, groupId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const allUserExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_creator", q => q.eq("createdBy", userId))
      .collect();

    // 1. First Expense Achievement
    if (allUserExpenses.length === 1) {
      await awardAchievement(ctx, { userId, achievementKey: "FIRST_EXPENSE", groupId });
    }

    // 2. Streak Achievements
    if (user.currentStreak >= 3) {
      await awardAchievement(ctx, { userId, achievementKey: "STREAK_STARTER", groupId });
    }
    if (user.currentStreak >= 7) {
      await awardAchievement(ctx, { userId, achievementKey: "STREAK_MASTER", groupId });
    }

    // 3. Big Spender Achievement
    if (expenseAmount >= 1000) {
      await awardAchievement(ctx, { userId, achievementKey: "BIG_SPENDER", groupId });
    }
  },
});

export const getMyAchievements = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return [];
    }

    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const achievements = await Promise.all(
      userAchievements.map(async (ua) => {
        const achievement = await ctx.db.get(ua.achievementId);
        return {
          ...achievement,
          achievedAt: ua.achievedAt,
        };
      })
    );

    return achievements.sort((a, b) => b.achievedAt - a.achievedAt);
  },
});

export const getLeaderboard = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const leaderboard = users
      .sort((a, b) => (b.longestStreak || 0) - (a.longestStreak || 0))
      .slice(0, 10); // Top 10 users

    return leaderboard.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      imageUrl: user.imageUrl,
      longestStreak: user.longestStreak || 0,
    }));
  },
});

export const createGroupChallenge = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    description: v.string(),
    goalAmount: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db.query("users").withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const member = group.members.find(m => m.userId === user._id);
    if (!member || member.role !== 'admin') throw new Error("Only admins can create challenges");

    if (group.activeChallengeId) {
        const activeChallenge = await ctx.db.get(group.activeChallengeId);
        if (activeChallenge && activeChallenge.status === 'active') {
            throw new Error("An active challenge already exists for this group.");
        }
    }

    const challengeId = await ctx.db.insert("groupChallenges", {
      ...args,
      currentAmount: 0,
      startDate: Date.now(),
      status: "active",
      createdBy: user._id,
    });

    await ctx.db.patch(group._id, { activeChallengeId: challengeId });

    return challengeId;
  },
});

export const getActiveChallengeForGroup = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        const group = await ctx.db.get(groupId);
        if (!group || !group.activeChallengeId) return null;

        const challenge = await ctx.db.get(group.activeChallengeId);
        if (challenge && challenge.status === 'active') {
            return challenge;
        }
        return null;
    },
});

export const getChallengeHistoryForGroup = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        return await ctx.db
            .query("groupChallenges")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .filter((q) => q.neq(q.field("status"), "active"))
            .order("desc")
            .collect();
    },
});

export const updateChallengeProgress = internalMutation({
    args: { groupId: v.id("groups"), expenseAmount: v.number() },
    handler: async (ctx, { groupId, expenseAmount }) => {
        const group = await ctx.db.get(groupId);
        if (!group || !group.activeChallengeId) return;

        const challenge = await ctx.db.get(group.activeChallengeId);
        if (!challenge || challenge.status !== 'active') return;

        const newAmount = challenge.currentAmount + expenseAmount;
        let newStatus = challenge.status;

        if (newAmount >= challenge.goalAmount) {
            newStatus = 'completed';
            // Optionally, clear the active challenge from the group
            await ctx.db.patch(group._id, { activeChallengeId: undefined });

            // Notify all group members about the completed challenge
            for (const member of group.members) {
                await ctx.db.insert("notifications", {
                    userId: member.userId,
                    title: "Challenge Completed! 🏆",
                    description: `Your group '${group.name}' completed the challenge: ${challenge.name}`,
                    type: "challenge_completed",
                    read: false,
                    link: `/groups/${group._id}`,
                    createdAt: Date.now(),
                });
            }
        }

        await ctx.db.patch(challenge._id, { 
            currentAmount: newAmount,
            status: newStatus,
        });
    }
});
