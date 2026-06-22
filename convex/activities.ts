import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
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
  },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      type: args.type,
      description: args.description,
      userId: args.userId,
      userName: args.userName,
      entityType: args.entityType,
      entityId: args.entityId,
      createdAt: Date.now(),
    });
    return activityId;
  },
});
