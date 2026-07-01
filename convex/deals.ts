import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessDeal, hasPermission, canAssignDeal, canArchiveEntity, canRestoreEntity, canPermanentDelete, canReopenTerminalDeal } from "./rbac";
import { notifyUser, notifyAdmins } from "./lib/notifications";
import { getProbability, isTerminalStage } from "./pipeline";
import {
  validateDealStageTransition,
  archiveEntity,
  restoreEntity,
  softDeleteEntity,
  permanentDeleteEntity,
  recordDealStageHistory,
  getEffectiveDealStatus,
} from "./lib/pipelineService";

export const list = query({
  args: {
    filter: v.optional(v.string()),
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

    const allDeals = await ctx.db
      .query("deals")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const permissions = {
      canViewAllData: hasPermission(currentUser, "canViewAllData"),
      canViewAssignedDeals: hasPermission(currentUser, "canViewAssignedDeals"),
    };

    let scoped = allDeals;
    if (!permissions.canViewAllData) {
      if (permissions.canViewAssignedDeals) {
        scoped = allDeals.filter(
          (d) => d.assignedTo === userId || d.createdBy === userId || d.ownerId === userId
        );
      } else {
        return [];
      }
    }

    const filter = args.filter || "active";
    if (filter === "active") {
      scoped = scoped.filter((d) => !d.isArchived && !d.isDeleted);
    } else if (filter === "archived") {
      scoped = scoped.filter((d) => d.isArchived && !d.isDeleted);
    } else if (filter === "trash") {
      scoped = scoped.filter((d) => d.isDeleted);
    }

    return scoped.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    value: v.number(),
    status: v.string(),
    stage: v.string(),
    company: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    leadId: v.optional(v.id("leads")),
    workspaceId: v.optional(v.id("workspaces")),
    contactId: v.optional(v.id("contacts")),
    currency: v.optional(v.string()),

    dealType: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    priority: v.optional(v.string()),

    contractStartDate: v.optional(v.number()),
    contractEndDate: v.optional(v.number()),
    renewalDate: v.optional(v.number()),
    billingFrequency: v.optional(v.string()),
    poNumber: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userName = currentUser.name || "System";
    const currentUserId = currentUser._id;
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    if (!hasPermission(currentUser, "canCreateDeals")) {
      throw new Error("You do not have permission to perform this action.");
    }

    if (args.assignedTo) {
      const allowed = await canAssignDeal(ctx, currentUserId, args.assignedTo);
      if (!allowed) {
        throw new Error("Unauthorized: You do not have permission to assign deals to this user");
      }
    }

    const now = Date.now();

    const probability = getProbability(args.stage);

    let finalCompanyId = args.workspaceId;
    if (!finalCompanyId && args.company) {
      const companyName = args.company.trim();
      const existingCompanies = await ctx.db
        .query("workspaces")
        .withIndex("by_name", (q) => q.eq("name", companyName))
        .collect();
      if (existingCompanies.length === 0) {
        finalCompanyId = await ctx.db.insert("workspaces", {
          name: companyName,
          status: "Prospect",
          createdBy: currentUserId,
          createdAt: now,
        });
      } else {
        finalCompanyId = existingCompanies[0]._id;
      }
    }

    const isEmployee = currentUser.role !== "super_admin" && currentUser.role !== "admin";
    const effectiveAssignedTo = isEmployee && !args.assignedTo ? currentUserId : args.assignedTo;
    const { workspaceId: _workspaceId, ...dealArgs } = args;
    const dealId = await ctx.db.insert("deals", {
      ...dealArgs,
      assignedTo: effectiveAssignedTo,
      createdBy: currentUserId,
      ownerId: currentUserId,
      workspaceId,
      probability,
      currency: args.currency || "INR",
      stageChangedAt: now,
      stageChangedBy: userName,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "deal_created",
      description: `created a new deal "${args.title}" (${args.currency || "INR"} ${args.value.toLocaleString()})`,
      userId: userId ?? undefined,
      userName,
      entityType: "deal",
      entityId: dealId,
    });

    if (args.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "deal_assigned",
        description: `assigned deal "${args.title}" to ${args.assignedTo === userId ? "themselves" : "user"}`,
        userId: userId ?? undefined,
        userName,
        entityType: "deal",
        entityId: dealId,
      });

      if (args.assignedTo !== currentUserId) {
        await notifyUser(ctx, args.assignedTo, "deal_assigned", {
          entityName: args.title,
          entityType: "deal",
          entityId: dealId,
          createdBy: currentUserId,
        });
      }
    }

    return dealId;
  },
});

export const update = mutation({
  args: {
    id: v.id("deals"),
    title: v.string(),
    value: v.number(),
    status: v.string(),
    stage: v.string(),
    company: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    leadId: v.optional(v.id("leads")),
    workspaceId: v.optional(v.id("workspaces")),
    contactId: v.optional(v.id("contacts")),
    probability: v.optional(v.number()),
    currency: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    lostNotes: v.optional(v.string()),

    dealType: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    priority: v.optional(v.string()),

    contractStartDate: v.optional(v.number()),
    contractEndDate: v.optional(v.number()),
    renewalDate: v.optional(v.number()),
    billingFrequency: v.optional(v.string()),
    poNumber: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Deal not found");

    const isAccessible = await canAccessDeal(ctx, userId, existing);
    if (!isAccessible) {
      throw new Error("Unauthorized: You do not have permission to modify this deal");
    }

    if (args.assignedTo !== existing.assignedTo) {
      const allowed = await canAssignDeal(ctx, userId, args.assignedTo);
      if (!allowed) {
        throw new Error("Unauthorized: You do not have permission to assign deals to this user");
      }
    }

    const now = Date.now();
    const patchData: any = {
      ...fields,
      updatedAt: now,
    };

    if (args.stage !== existing.stage) {
      const fromStage = existing.stage || "Prospecting";
      validateDealStageTransition(fromStage, args.stage);

      patchData.probability = getProbability(args.stage);
      patchData.stageChangedAt = now;
      patchData.stageChangedBy = userName;

      const workspaceId = existing.workspaceId!;

      // Record stage history
      await recordDealStageHistory(ctx, id, fromStage, args.stage, userId, userName, workspaceId);

      if (args.stage === "Closed Won") {
        patchData.status = "Won";

        await ctx.db.insert("tasks", {
          title: `Onboarding: ${args.company || args.title}`,
          dueDate: now + 7 * 24 * 60 * 60 * 1000,
          status: "Pending",
          priority: "Medium",
          createdBy: userId as Id<"users">,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.insert("tasks", {
          title: `Implementation Setup: ${args.company || args.title}`,
          dueDate: now + 14 * 24 * 60 * 60 * 1000,
          status: "Pending",
          priority: "Medium",
          createdBy: userId as Id<"users">,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.insert("tasks", {
          title: `Invoice Generation: ${args.company || args.title}`,
          dueDate: now + 3 * 24 * 60 * 60 * 1000,
          status: "Pending",
          priority: "High",
          createdBy: userId as Id<"users">,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        const targetCompanyId = existing.companyId;
        if (targetCompanyId) {
          await ctx.db.patch(targetCompanyId, {
            status: "Customer",
            updatedAt: now,
          });
        }

        await ctx.scheduler.runAfter(0, internal.activities.log, {
          type: "deal_won",
          description: `won the deal "${args.title}" (${args.currency || "INR"} ${args.value.toLocaleString()})`,
          userId: userId ?? undefined,
          userName,
          entityType: "deal",
          entityId: id,
        });

        const wonAssignee = args.assignedTo || existing.assignedTo;
        if (wonAssignee) {
          await notifyUser(ctx, wonAssignee, "deal_won", {
            entityName: args.title,
            entityType: "deal",
            entityId: id,
            createdBy: userId ?? undefined,
          });
        }
        await notifyAdmins(ctx, undefined, "deal_won", {
          entityName: args.title,
          entityType: "deal",
          entityId: id,
          createdBy: userId ?? undefined,
        });

        if (targetCompanyId) {
          await ctx.scheduler.runAfter(0, internal.activities.log, {
            type: "company_customer",
            description: `marked company "${args.company || existing.company}" as Customer`,
            userId: userId ?? undefined,
            userName,
            entityType: "company",
            entityId: targetCompanyId,
          });
        }

      } else if (args.stage === "Closed Lost") {
        patchData.status = "Lost";
        patchData.lostReason = args.lostReason;
        patchData.lostNotes = args.lostNotes;

        await ctx.scheduler.runAfter(0, internal.activities.log, {
          type: "deal_lost",
          description: `lost the deal "${args.title}" (Reason: ${args.lostReason})`,
          userId: userId ?? undefined,
          userName,
          entityType: "deal",
          entityId: id,
        });

        const lostAssignee = args.assignedTo || existing.assignedTo;
        if (lostAssignee) {
          await notifyUser(ctx, lostAssignee, "deal_lost", {
            entityName: args.title,
            entityType: "deal",
            entityId: id,
            createdBy: userId ?? undefined,
          });
        }
        await notifyAdmins(ctx, undefined, "deal_lost", {
          entityName: args.title,
          entityType: "deal",
          entityId: id,
          createdBy: userId ?? undefined,
        });
      } else {
        patchData.status = "Pipeline";
        await ctx.scheduler.runAfter(0, internal.activities.log, {
          type: "deal_stage_changed",
          description: `moved deal "${args.title}" to stage ${args.stage}`,
          userId: userId ?? undefined,
          userName,
          entityType: "deal",
          entityId: id,
        });

        const stageAssignee = args.assignedTo || existing.assignedTo;
        if (stageAssignee) {
          await notifyUser(ctx, stageAssignee, "deal_stage_changed", {
            entityName: args.title,
            stage: args.stage,
            entityType: "deal",
            entityId: id,
            createdBy: userId ?? undefined,
          });
        }
        await notifyAdmins(ctx, undefined, "deal_stage_changed", {
          entityName: args.title,
          stage: args.stage,
          entityType: "deal",
          entityId: id,
          createdBy: userId ?? undefined,
        });
      }
    } else {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "deal_updated",
        description: `updated deal "${args.title}"`,
        userId: userId ?? undefined,
        userName,
        entityType: "deal",
        entityId: id,
      });
    }

    if (args.assignedTo !== existing.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "deal_assigned",
        description: `assigned deal "${existing.title}" to user`,
        userId: userId ?? undefined,
        userName,
        entityType: "deal",
        entityId: id,
      });

      if (args.assignedTo && args.assignedTo !== (userId as any)) {
        await notifyUser(ctx, args.assignedTo, "deal_assigned", {
          entityName: args.title,
          entityType: "deal",
          entityId: id,
          createdBy: userId ?? undefined,
        });
      }
    }

    await ctx.db.patch(id, patchData);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");

    if (existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Cannot delete deal belonging to another company");
    }

    const userId = currentUser._id;

    const allowed = await canPermanentDelete(ctx, userId);
    if (!allowed) {
      throw new Error("Unauthorized: Only Administrators and Workspace Owners can permanently delete deals");
    }

    await permanentDeleteEntity(ctx, "deals", args.id);
    return args.id;
  },
});

export const archive = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");
    if (existing.isArchived) throw new Error("Deal is already archived");

    const allowed = await canArchiveEntity(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: You do not have permission to archive deals");

    await archiveEntity(ctx, "deals", args.id, userId, currentUser.name || "System");
    return args.id;
  },
});

export const restore = mutation({
  args: {
    id: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const allowed = await canRestoreEntity(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: You do not have permission to restore deals");

    await restoreEntity(ctx, "deals", args.id, userId, currentUser.name || "System");
    return args.id;
  },
});

export const softDelete = mutation({
  args: {
    id: v.id("deals"),
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const allowed = await canArchiveEntity(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: You do not have permission to move deals to trash");

    await softDeleteEntity(ctx, "deals", args.id, userId, currentUser.name || "System");
    return args.id;
  },
});

export const reopen = mutation({
  args: {
    id: v.id("deals"),
    targetStage: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const isAccessible = await canAccessDeal(ctx, userId, existing);
    if (!isAccessible) throw new Error("Unauthorized");

    const allowed = await canReopenTerminalDeal(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: Only Workspace Owner or Administrator can reopen this deal");

    if (!isTerminalStage(existing.stage || "")) {
      throw new Error("Deal is not in a terminal stage");
    }

    const now = Date.now();

    await recordDealStageHistory(ctx, args.id, existing.stage!, args.targetStage, userId, userName, workspaceId);

    await ctx.db.patch(args.id, {
      stage: args.targetStage,
      status: getEffectiveDealStatus(args.targetStage),
      probability: getProbability(args.targetStage),
      stageChangedAt: now,
      stageChangedBy: userName,
      lostReason: undefined,
      lostNotes: undefined,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "deal_reopened",
      description: `reopened deal "${existing.title}" to stage ${args.targetStage}`,
      userId,
      userName,
      entityType: "deal",
      entityId: args.id,
    });

    return args.id;
  },
});

export const listStageHistory = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    return await ctx.db
      .query("dealStageHistory")
      .withIndex("by_dealId", (q) => q.eq("dealId", args.dealId))
      .collect();
  },
});

export const clearTrash = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const allowed = await canPermanentDelete(ctx, userId);
    if (!allowed) {
      throw new Error("Unauthorized: Only Administrators and Workspace Owners can permanently delete deals");
    }

    const allDeals = await ctx.db
      .query("deals")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId!))
      .collect();

    const trashedDeals = allDeals.filter((d) => d.isDeleted === true);

    let count = 0;
    for (const deal of trashedDeals) {
      await permanentDeleteEntity(ctx, "deals", deal._id);
      count++;
    }

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "deals_trash_cleared",
      description: `permanently deleted ${count} deal(s) from trash`,
      userId,
      userName: currentUser.name || "System",
      entityType: "deal",
    });

    return { deleted: count };
  },
});
