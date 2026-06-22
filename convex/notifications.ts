import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: {
    read: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const notifications = args.read !== undefined
      ? await ctx.db
          .query("notifications")
          .withIndex("by_user", (idx) => idx.eq("userId", userId).eq("read", args.read as boolean))
          .collect()
      : await ctx.db
          .query("notifications")
          .withIndex("by_user", (idx) => idx.eq("userId", userId))
          .collect();
    return notifications;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");

    await ctx.db.patch(args.id, {
      read: true,
    });
    return args.id;
  },
});
