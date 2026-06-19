import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
      .unique();

    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
      .unique();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const patch: Record<string, string | number | undefined> = {
      updatedAt: Date.now(),
    };
    if (args.name !== undefined) patch.name = args.name;
    if (args.avatarUrl !== undefined) patch.avatarUrl = args.avatarUrl;

    await ctx.db.patch(user._id, patch);

    return {
      _id: user._id,
      email: user.email,
      name: args.name ?? user.name,
      role: user.role,
      avatarUrl: args.avatarUrl ?? user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: patch.updatedAt as number,
    };
  },
});
