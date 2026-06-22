import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    datePreset: v.optional(v.string()),
    customStart: v.optional(v.number()),
    customEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db.query("leads").collect();

    // 1. Filter by Search Query (Case Insensitive: company, contact name, email, phone)
    if (args.search) {
      const q = args.search.toLowerCase().trim();
      leads = leads.filter(l => {
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        return (
          l.company.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.phone && l.phone.toLowerCase().includes(q))
        );
      });
    }

    // 2. Filter by Status
    if (args.status && args.status !== "all") {
      leads = leads.filter(l => l.status === args.status);
    }

    // 3. Filter by Source
    if (args.source && args.source !== "all") {
      leads = leads.filter(l => l.source === args.source);
    }

    // 4. Filter by Assigned User
    if (args.assignedTo && args.assignedTo !== "all") {
      leads = leads.filter(l => l.assignedTo === args.assignedTo);
    }

    // 5. Filter by Date Created Range
    if (args.datePreset && args.datePreset !== "all") {
      const now = Date.now();
      let minDate = 0;

      switch (args.datePreset) {
        case "7days":
          minDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "15days":
          minDate = now - 15 * 24 * 60 * 60 * 1000;
          break;
        case "30days":
          minDate = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case "90days":
          minDate = now - 90 * 24 * 60 * 60 * 1000;
          break;
        case "6months":
          minDate = now - 180 * 24 * 60 * 60 * 1000;
          break;
        case "12months":
          minDate = now - 365 * 24 * 60 * 60 * 1000;
          break;
        case "custom":
          if (args.customStart) {
            leads = leads.filter(l => l.createdAt >= (args.customStart as number));
          }
          if (args.customEnd) {
            leads = leads.filter(l => l.createdAt <= (args.customEnd as number));
          }
          break;
      }

      if (args.datePreset !== "custom" && minDate > 0) {
        leads = leads.filter(l => l.createdAt >= minDate);
      }
    }

    // Sort by createdAt desc
    return leads.sort((a, b) => b.createdAt - a.createdAt);
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
    source: v.string(),
    assignedTo: v.optional(v.id("users")),
    value: v.optional(v.number()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const now = Date.now();
    const leadId = await ctx.db.insert("leads", {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email.trim(),
      phone: args.phone?.trim(),
      company: args.company.trim(),
      jobTitle: args.jobTitle?.trim(),
      status: args.status,
      source: args.source,
      assignedTo: args.assignedTo,
      value: args.value,
      score: args.score ?? Math.floor(Math.random() * 40) + 60, // random quality score 60-100 if none provided
      createdAt: now,
      updatedAt: now,
    });

    // Create activity log
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_created",
      description: `created a new lead "${args.company}" (${args.firstName} ${args.lastName})`,
      userId: userId ?? undefined,
      userName,
      entityType: "lead",
      entityId: leadId,
    });

    return leadId;
  },
});

export const update = mutation({
  args: {
    id: v.id("leads"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    source: v.string(),
    assignedTo: v.optional(v.id("users")),
    value: v.optional(v.number()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const { id, ...updateFields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead not found");

    await ctx.db.patch(id, {
      ...updateFields,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email.trim(),
      phone: args.phone?.trim(),
      company: args.company.trim(),
      jobTitle: args.jobTitle?.trim(),
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_updated",
      description: `updated lead "${args.company}"`,
      userId: userId ?? undefined,
      userName,
      entityType: "lead",
      entityId: id,
    });

    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const currentUser = userId ? await ctx.db.get(userId) : null;
    const userName = currentUser?.name || "System";

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");

    await ctx.db.delete(args.id);

    // Create activity log
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_deleted",
      description: `deleted lead "${existing.company}"`,
      userId: userId ?? undefined,
      userName,
      entityType: "lead",
      entityId: args.id,
    });

    return args.id;
  },
});
