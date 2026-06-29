import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return [];
    }

    let companies = await ctx.db
      .query("companies")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    if (args.search) {
      const q = args.search.toLowerCase().trim();
      companies = companies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.domain && c.domain.toLowerCase().includes(q)) ||
          (c.industry && c.industry.toLowerCase().includes(q))
      );
    }

    if (args.status && args.status !== "all") {
      companies = companies.filter((c) => c.status === args.status);
    }

    return companies.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return null;
    }

    const company = await ctx.db.get(args.id);
    if (!company) return null;

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (company.workspaceId !== workspaceId) {
      return null; // Tenant Isolation check
    }

    return company;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      throw new Error("No active workspace found");
    }

    const userName = currentUser.name || "System";
    const now = Date.now();

    const companyId = await ctx.db.insert("companies", {
      name: args.name.trim(),
      domain: args.domain?.trim(),
      industry: args.industry?.trim(),
      phone: args.phone?.trim(),
      website: args.website?.trim(),
      status: args.status,
      workspaceId,
      createdBy: currentUser._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "company_created",
      description: `created customer company "${args.name.trim()}"`,
      userId: currentUser._id,
      userName,
      entityType: "company",
      entityId: companyId,
      workspaceId,
    });

    return companyId;
  },
});

export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.string(),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Company not found or invalid workspace");
    }

    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      name: args.name.trim(),
      domain: args.domain?.trim(),
      industry: args.industry?.trim(),
      phone: args.phone?.trim(),
      website: args.website?.trim(),
      updatedAt: Date.now(),
    });

    const userName = currentUser.name || "System";
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "company_updated",
      description: `updated customer company "${args.name.trim()}"`,
      userId: currentUser._id,
      userName,
      entityType: "company",
      entityId: id,
      workspaceId,
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Company not found or invalid workspace");
    }

    await ctx.db.delete(args.id);

    const userName = currentUser.name || "System";
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "company_deleted",
      description: `deleted customer company "${existing.name}"`,
      userId: currentUser._id,
      userName,
      entityType: "company",
      entityId: args.id,
      workspaceId,
    });

    return args.id;
  },
});
