import { v } from "convex/values";
import { mutation } from "./_generated/server";

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password, name } = args;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      throw new Error("A user with this email already exists");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const authToken = generateToken();
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      email,
      name,
      passwordHash,
      salt,
      authToken,
      role: "member",
      createdAt: now,
      updatedAt: now,
    });

    return {
      userId,
      token: authToken,
      user: {
        _id: userId,
        email,
        name,
        role: "member",
      },
    };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordHash = await hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    const authToken = generateToken();
    await ctx.db.patch(user._id, { authToken, updatedAt: Date.now() });

    return {
      userId: user._id,
      token: authToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },
});

export const signOut = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authToken", (q) => q.eq("authToken", args.token))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { authToken: undefined, updatedAt: Date.now() });
    }
  },
});
