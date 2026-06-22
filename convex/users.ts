declare const process: { env: Record<string, string | undefined> };

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { auth } from "./auth";

export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("[getCurrentUser]", {
      identity: identity?.email ?? null,
      hasArgsToken: !!args.token,
    });

    if (identity?.email) {
      const userId = await auth.getUserId(ctx);
      console.log("[getCurrentUser] auth.getUserId:", userId);

      if (userId) {
        const user = await ctx.db.get(userId);
        if (user) {
          console.log("[getCurrentUser] Found user by ID:", user._id);
          return {
            _id: user._id,
            email: user.email ?? "",
            name: user.name ?? "Google User",
            role: user.role ?? "member",
            avatarUrl: user.image ?? user.avatarUrl,
            emailVerified: user.emailVerified ?? false,
            createdAt: user.createdAt ?? user._creationTime,
            updatedAt: user.updatedAt ?? user._creationTime,
          };
        }
        console.warn("[getCurrentUser] User doc not found by ID, falling back to email lookup");
      }

      const userByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email))
        .unique();

      if (userByEmail) {
        console.log("[getCurrentUser] Found user by email:", userByEmail._id);
        return {
          _id: userByEmail._id,
          email: userByEmail.email ?? "",
          name: userByEmail.name ?? "Google User",
          role: userByEmail.role ?? "member",
          avatarUrl: userByEmail.image ?? userByEmail.avatarUrl,
          emailVerified: userByEmail.emailVerified ?? false,
          createdAt: userByEmail.createdAt ?? userByEmail._creationTime,
          updatedAt: userByEmail.updatedAt ?? userByEmail._creationTime,
        };
      }

      console.warn("[getCurrentUser] Identity present but no user found in DB");
      return null;
    }

    if (args.token) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
        .unique();

      if (user) {
        console.log("[getCurrentUser] Found user by legacy token:", user._id);
        return {
          _id: user._id,
          email: user.email ?? "",
          name: user.name ?? "",
          role: user.role ?? "member",
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified ?? false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    }

    console.log("[getCurrentUser] No user found, returning null");
    return null;
  },
});

export const debugEnv = action({
  args: {},
  handler: async () => {
    const convexSiteUrl = typeof process !== "undefined" ? process.env.CONVEX_SITE_URL : "process not defined";
    const siteUrl = typeof process !== "undefined" ? process.env.SITE_URL : "process not defined";
    return {
      CONVEX_SITE_URL: convexSiteUrl,
      SITE_URL: siteUrl,
      nodeEnv: typeof process !== "undefined" ? process.env.NODE_ENV : "N/A",
    };
  },
});

export const updateProfile = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = null;

    const userId = await auth.getUserId(ctx);
    if (userId) {
      user = await ctx.db.get(userId);
    }

    if (!user && args.token) {
      user = await ctx.db
        .query("users")
        .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
        .unique();
    }

    if (!user) {
      throw new Error("Not authenticated");
    }

    const patch: Record<string, string | number | undefined> = {
      updatedAt: Date.now(),
    };
    if (args.name !== undefined) patch.name = args.name;
    if (args.avatarUrl !== undefined) {
      patch.avatarUrl = args.avatarUrl;
      patch.image = args.avatarUrl;
    }

    await ctx.db.patch(user._id, patch);

    return {
      _id: user._id,
      email: user.email ?? "",
      name: args.name ?? user.name ?? "",
      role: user.role ?? "member",
      avatarUrl: args.avatarUrl ?? user.image ?? user.avatarUrl,
      createdAt: user.createdAt ?? user._creationTime,
      updatedAt: patch.updatedAt as number,
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      _id: u._id,
      name: u.name || "Unknown User",
      email: u.email || "",
      avatarUrl: u.image || u.avatarUrl,
    }));
  },
});
