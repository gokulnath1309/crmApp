import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { hasPermission } from "./rbac";

function toCamelCase(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9 ]/g, "");
  const words = cleaned.split(" ").filter((w) => w.length > 0);
  if (words.length === 0) return "customField_" + Math.floor(Math.random() * 1000);
  return words
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return [];
    }

    return await ctx.db
      .query("customFields")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
  },
});

export const create = mutation({
  args: {
    label: v.string(),
    type: v.string(), // Dropdown, Checkbox, Date, Currency, Number, Text, Textarea, Multi-select, File Upload
    options: v.optional(v.array(v.string())),
    required: v.boolean(),
    stage: v.string(), // New, Contacted, Qualified, Proposal Sent, Negotiation, Won, All
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

    // Role verification: only Admin and Super Admin can manage custom fields
    const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";
    if (!isAdmin) {
      throw new Error("You do not have permission to manage custom fields");
    }

    const fieldName = toCamelCase(args.label);

    // Check for duplicate names in the same workspace
    const existing = await ctx.db
      .query("customFields")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const isDuplicate = existing.some((f) => f.name === fieldName);
    if (isDuplicate) {
      throw new Error("A custom field with a similar label already exists.");
    }

    const fieldId = await ctx.db.insert("customFields", {
      label: args.label.trim(),
      name: fieldName,
      type: args.type,
      options: args.options,
      required: args.required,
      stage: args.stage,
      workspaceId,
      createdAt: Date.now(),
    });

    return fieldId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("customFields"),
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

    const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin";
    if (!isAdmin) {
      throw new Error("You do not have permission to manage custom fields");
    }

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Custom field not found");
    }

    if (existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Custom field belongs to another workspace");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
