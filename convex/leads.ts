import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessLead, hasPermission, canAssignLead } from "./rbac";
import { notifyUser } from "./lib/notifications";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    datePreset: v.optional(v.string()),
    customStart: v.optional(v.number()),
    customEnd: v.optional(v.number()),
    currency: v.optional(v.string()),
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
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Scope leads by permission
    const permissions = {
      canViewAllData: hasPermission(currentUser, "canViewAllData"),
      canViewAssignedLeads: hasPermission(currentUser, "canViewAssignedLeads"),
    };

    if (!permissions.canViewAllData) {
      if (permissions.canViewAssignedLeads) {
        leads = leads.filter(
          (l) => l.assignedTo === userId || l.createdBy === userId || l.ownerId === userId
        );
      } else {
        return [];
      }
    }

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

    // 6. Filter by Currency
    if (args.currency && args.currency !== "all") {
      leads = leads.filter(l => (l.currency || "INR") === args.currency);
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
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const currentUserId = userId;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    if (!hasPermission(currentUser, "canCreateLeads")) {
      throw new Error("You do not have permission to perform this action.");
    }

    if (args.assignedTo) {
      const allowed = await canAssignLead(ctx, currentUserId, args.assignedTo);
      if (!allowed) {
        throw new Error("Unauthorized: You do not have permission to assign leads to this user");
      }
    }

    const now = Date.now();
    const isEmployee = currentUser.role !== "super_admin" && currentUser.role !== "admin";
    const effectiveAssignedTo = isEmployee ? currentUserId : (args.assignedTo ?? currentUserId);
    const leadId = await ctx.db.insert("leads", {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email.trim(),
      phone: args.phone?.trim(),
      company: args.company.trim(),
      jobTitle: args.jobTitle?.trim(),
      status: args.status,
      source: args.source,
      createdBy: currentUserId,
      ownerId: currentUserId,
      assignedTo: effectiveAssignedTo,
      workspaceId: workspaceId,
      value: args.value,
      currency: args.currency || "INR",
      score: args.score ?? Math.floor(Math.random() * 40) + 60, // random quality score 60-100 if none provided
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
      statusChangedBy: userName,
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

    if (effectiveAssignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_assigned",
        description: `assigned lead "${args.company}" to ${effectiveAssignedTo === userId ? "themselves" : "user"}`,
        userId: userId ?? undefined,
        userName,
        entityType: "lead",
        entityId: leadId,
      });
    }

    if (effectiveAssignedTo && effectiveAssignedTo !== currentUserId) {
      await notifyUser(ctx, effectiveAssignedTo, "lead_assigned", {
        entityName: args.company,
        entityType: "lead",
        entityId: leadId,
        createdBy: currentUserId,
      });
    }

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
    currency: v.optional(v.string()),

    // Status workflow fields
    unqualifiedReason: v.optional(v.string()),
    unqualifiedNotes: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    lostNotes: v.optional(v.string()),
    requalificationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const currentUserId = userId;

    const { id, ...updateFields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead not found");

    const isAccessible = await canAccessLead(ctx, currentUserId, existing);
    if (!isAccessible) {
      throw new Error("Unauthorized: You do not have permission to modify this lead");
    }

    if (args.assignedTo !== existing.assignedTo) {
      const allowed = await canAssignLead(ctx, currentUserId, args.assignedTo);
      if (!allowed) {
        throw new Error("Unauthorized: You do not have permission to assign leads to this user");
      }
    }

    const now = Date.now();
    const patchData: any = {
      ...updateFields,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email.trim(),
      phone: args.phone?.trim(),
      company: args.company.trim(),
      jobTitle: args.jobTitle?.trim(),
      currency: args.currency || "INR",
      updatedAt: now,
    };

    if (args.status !== existing.status) {
      const allowedTransitions: Record<string, string[]> = {
        New: ["Contacted", "Unqualified"],
        Contacted: ["Qualified", "Unqualified", "Lost"],
        Qualified: ["Proposal Sent", "Unqualified", "Lost"],
        "Proposal Sent": ["Negotiation", "Lost"],
        Negotiation: ["Won", "Lost"],
        Won: [],
        Lost: ["New"],
        Unqualified: ["New"],
      };

      const allowed = allowedTransitions[existing.status || "New"];
      if (!allowed || !allowed.includes(args.status)) {
        throw new Error(`Invalid status transition from ${existing.status || "New"} to ${args.status}`);
      }

      patchData.statusChangedAt = now;
      patchData.statusChangedBy = userName;

      let activityType = "lead_status_changed";
      let activityDescription = `changed status of lead "${args.company}" to ${args.status}`;

      if (args.status === "Won") {
        // 1. Create company if not exists
        let workspaceId;
        const existingCompanies = await ctx.db
          .query("companies")
          .withIndex("by_name", (q) => q.eq("name", args.company.trim()))
          .collect();
        if (existingCompanies.length === 0) {
          workspaceId = await ctx.db.insert("companies", {
            name: args.company.trim(),
            status: "Prospect",
            createdAt: now,
            updatedAt: now,
          });
        } else {
          workspaceId = existingCompanies[0]._id;
        }

        // 2. Create contact if not exists
        let contactId;
        const existingContacts = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
          .collect();
        if (existingContacts.length === 0) {
          contactId = await ctx.db.insert("contacts", {
            firstName: args.firstName.trim(),
            lastName: args.lastName.trim(),
            email: args.email.trim().toLowerCase(),
            phone: args.phone?.trim(),
            company: args.company.trim(),
            jobTitle: args.jobTitle?.trim(),
            status: "Active",
            tags: ["Converted"],
            createdBy: currentUserId,
            ownerId: currentUserId,
            assignedTo: args.assignedTo,
            workspaceId: workspaceId,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          contactId = existingContacts[0]._id;
        }

        // 3. Create deal record
        await ctx.db.insert("deals", {
          title: `${args.company.trim()} - Deal`,
          value: args.value !== undefined ? args.value : 0,
          currency: args.currency || "INR",
          status: "Pipeline",
          stage: "Prospecting",
          probability: 10,
          company: args.company.trim(),
          createdBy: currentUserId,
          ownerId: currentUserId,
          assignedTo: args.assignedTo,
          leadId: id,
          workspaceId: workspaceId,
          contactId: contactId,
          stageChangedAt: now,
          stageChangedBy: userName,
          createdAt: now,
          updatedAt: now,
        });

        // 4. Create onboarding task
        await ctx.db.insert("tasks", {
          title: `Onboarding Setup: ${args.company.trim()}`,
          dueDate: now + 7 * 24 * 60 * 60 * 1000,
          status: "Pending",
          priority: "Medium",
          createdBy: currentUserId,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        activityType = "lead_converted";
        activityDescription = "Lead converted to customer and deal created";

      } else if (args.status === "Lost") {
        patchData.lostAt = now;
        patchData.lostReason = args.lostReason;
        patchData.lostNotes = args.lostNotes;

        activityType = "lead_lost";
        activityDescription = "Lead marked as Lost";

      } else if (args.status === "Unqualified") {
        patchData.unqualifiedAt = now;
        patchData.unqualifiedReason = args.unqualifiedReason;
        patchData.unqualifiedNotes = args.unqualifiedNotes;

        activityType = "lead_unqualified";
        activityDescription = "Lead marked as Unqualified";

      } else if ((existing.status === "Unqualified" || existing.status === "Lost") && args.status === "New") {
        patchData.requalifiedAt = now;
        patchData.requalifiedBy = userName;
        patchData.requalificationReason = args.requalificationReason;

        activityType = "lead_requalified";
        activityDescription = "Lead requalified";
      }

      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: activityType,
        description: activityDescription,
        userId: userId ?? undefined,
        userName,
        entityType: "lead",
        entityId: id,
      });
    } else {
      // Normal update log if status didn't change
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_updated",
        description: `updated lead "${args.company}"`,
        userId: userId ?? undefined,
        userName,
        entityType: "lead",
        entityId: id,
      });
    }

    if (args.assignedTo !== existing.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_assigned",
        description: `assigned lead "${args.company}" to user`,
        userId: userId ?? undefined,
        userName,
        entityType: "lead",
        entityId: id,
      });

      if (args.assignedTo && args.assignedTo !== currentUserId) {
        await notifyUser(ctx, args.assignedTo, "lead_assigned", {
          entityName: args.company,
          entityType: "lead",
          entityId: id,
          createdBy: currentUserId,
        });
      }
    }

    if (args.status !== existing.status && args.status !== "Won") {
      const targetUserId = args.assignedTo || existing.assignedTo;
      if (targetUserId && targetUserId !== currentUserId) {
        await notifyUser(ctx, targetUserId, "lead_status_changed", {
          entityName: args.company,
          status: args.status,
          entityType: "lead",
          entityId: id,
          createdBy: currentUserId,
        });
      }
    }

    if (args.status === "Won" && existing.status !== "Won") {
      const targetUserId = args.assignedTo || existing.assignedTo;
      if (targetUserId) {
        await notifyUser(ctx, targetUserId, "lead_converted", {
          entityName: args.company,
          entityType: "lead",
          entityId: id,
          createdBy: currentUserId,
        });
      }
    }

    await ctx.db.patch(id, patchData);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admins can delete leads");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");

    if (existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Cannot delete lead belonging to another company");
    }

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

export const migrateLeadsCurrency = mutation({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect();
    let count = 0;
    for (const lead of leads) {
      if (lead.currency === undefined) {
        await ctx.db.patch(lead._id, { currency: "INR" });
        count++;
      }
    }
    return { migrated: count };
  },
});
