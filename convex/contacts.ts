import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    tags: v.array(v.string()),
    workPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    department: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const now = Date.now();
    const contactId = await ctx.db.insert("contacts", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "contact_created",
      description: `created contact ${args.firstName} ${args.lastName} (${args.company})`,
      userId: userId ?? undefined,
      userName,
      entityType: "contact",
      entityId: contactId,
    });

    return contactId;
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    tags: v.array(v.string()),
    workPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    department: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Contact not found");

    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Contact not found");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
