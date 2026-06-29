import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { resolveUserReadOnly } from "./lib/getCurrentUser";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      return [];
    }

    const limit = args.limit ?? 50;
    let activities = await ctx.db
      .query("activities")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    if (args.entityType && args.entityId) {
      activities = activities.filter(
        (a) => a.entityType === args.entityType && a.entityId === args.entityId
      );
    }
    return activities
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

export const log = internalMutation({
  args: {
    type: v.string(),
    description: v.string(),
    userId: v.optional(v.id("users")),
    userName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    let workspaceId = args.workspaceId;
    if (!workspaceId && args.userId) {
      const user = await ctx.db.get(args.userId);
      workspaceId = user?.activeWorkspaceId;
    }

    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      description: args.description,
      userId: args.userId,
      userName: args.userName,
      entityType: args.entityType,
      entityId: args.entityId,
      workspaceId,
      createdAt: Date.now(),
    });
    return activityId;
  },
});
