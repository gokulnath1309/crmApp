import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    read: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return [];

    const limit = args.limit ?? 50;

    if (args.read !== undefined) {
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", args.read as boolean))
        .order("desc")
        .collect();
      return notifications.slice(0, limit);
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return notifications.slice(0, limit);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return 0;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    return notifications.length;
  },
});

export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUserReadOnly(ctx);
    if (!user) return [];

    const limit = args.limit ?? 10;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return notifications.slice(0, limit);
  },
});

export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { read: true });
    return args.id;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return unread.length;
  },
});

export const dismiss = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Notification not found");
    if (existing.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
