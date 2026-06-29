import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessContact } from "./rbac";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const userId = currentUser?._id;
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return [];
    }
    let contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Scope contacts by role
    if (currentUser.role !== "super_admin") {
      if (currentUser.role === "admin") {
        const subordinates = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("managerId"), userId))
          .collect();
        const subordinateIds = new Set(subordinates.map((s) => s._id));
        contacts = contacts.filter(
          (c) =>
            c.assignedTo === userId ||
            c.createdBy === userId ||
            c.ownerId === userId ||
            (c.assignedTo && subordinateIds.has(c.assignedTo)) ||
            !c.assignedTo
        );
      } else {
        contacts = contacts.filter(
          (c) => c.assignedTo === userId || c.createdBy === userId || c.ownerId === userId
        );
      }
    }

    // Filter by search
    if (args.search) {
      const q = args.search.toLowerCase().trim();
      contacts = contacts.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q))
        );
      });
    }

    // Filter by status
    if (args.status && args.status !== "all") {
      contacts = contacts.filter((c) => c.status === args.status);
    }

    // Filter by assignedTo
    if (args.assignedTo && args.assignedTo !== "all") {
      contacts = contacts.filter((c) => c.assignedTo === args.assignedTo);
    }

    return contacts.sort((a, b) => b.createdAt - a.createdAt);
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
    assignedTo: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
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
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userName = currentUser.name || "System";
    const isEmployee = currentUser.role !== "super_admin" && currentUser.role !== "admin";
    const currentUserId = currentUser._id;
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    // Employee can only assign contacts to themselves
    if (isEmployee) {
      if (args.assignedTo && args.assignedTo !== currentUserId) {
        throw new Error("Unauthorized: Employees can only assign contacts to themselves");
      }
    }

    const now = Date.now();
    const effectiveAssignedTo = isEmployee ? currentUserId : (args.assignedTo ?? currentUserId);
    const { assignedTo, workspaceId: _workspaceId, ...rest } = args;
    const contactId = await ctx.db.insert("contacts", {
      ...rest,
      createdBy: currentUserId,
      ownerId: currentUserId,
      assignedTo: effectiveAssignedTo,
      workspaceId,
      createdAt: now,
      updatedAt: now,
    });

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
    assignedTo: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
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
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const { id, workspaceId: _workspaceId, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Contact not found");

    const isAccessible = await canAccessContact(ctx, userId, existing);
    if (!isAccessible) {
      throw new Error("You do not have permission to perform this action.");
    }

    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      if (args.assignedTo && args.assignedTo !== existing.assignedTo) {
        throw new Error("Unauthorized: Employees cannot reassign contacts");
      }
    }

    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "contact_updated",
      description: `updated contact ${args.firstName} ${args.lastName}`,
      userId: userId ?? undefined,
      userName,
      entityType: "contact",
      entityId: id,
    });

    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Contact not found");

    const isAccessible = await canAccessContact(ctx, userId, existing);
    if (!isAccessible) {
      throw new Error("You do not have permission to perform this action.");
    }

    if (currentUser.role !== "super_admin") {
      throw new Error("You do not have permission to perform this action.");
    }

    await ctx.db.delete(args.id);

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "contact_deleted",
      description: `deleted contact ${existing.firstName} ${existing.lastName}`,
      userId: userId ?? undefined,
      userName,
      entityType: "contact",
      entityId: args.id,
    });

    return args.id;
  },
});
