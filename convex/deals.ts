import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessDeal, hasPermission, canAssignDeal } from "./rbac";
import { notifyUser, notifyAdmins } from "./lib/notifications";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const userId = currentUser?._id;
    if (!currentUser || currentUser.isActive === false) {
      return [];
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return [];
    }

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Scope deals by permission
    const permissions = {
      canViewAllData: hasPermission(currentUser, "canViewAllData"),
      canViewAssignedDeals: hasPermission(currentUser, "canViewAssignedDeals"),
    };

    if (!permissions.canViewAllData) {
      if (permissions.canViewAssignedDeals) {
        return deals
          .filter((d) => d.assignedTo === userId || d.createdBy === userId || d.ownerId === userId)
          .sort((a, b) => b.createdAt - a.createdAt);
      } else {
        return [];
      }
    }

    return deals.sort((a, b) => b.createdAt - a.createdAt);
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

    const stageProbabilities: Record<string, number> = {
      Prospecting: 10,
      Qualification: 25,
      Proposal: 50,
      Negotiation: 75,
      "Verbal Commit": 90,
      "Closed Won": 100,
      "Closed Lost": 0,
    };

    const probability = stageProbabilities[args.stage] ?? 10;

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

    // Create activity log
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
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    // No hardcoded marketing/support reject block, handled by canAccessDeal check below

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

    // If stage is changing, validate transition and auto-update probability
    if (args.stage !== existing.stage) {
      const allowedTransitions: Record<string, string[]> = {
        Prospecting: ["Qualification", "Closed Lost"],
        Qualification: ["Proposal", "Closed Lost"],
        Proposal: ["Negotiation", "Closed Lost"],
        Negotiation: ["Verbal Commit", "Closed Lost"],
        "Verbal Commit": ["Closed Won", "Closed Lost"],
        "Closed Won": [],
        "Closed Lost": ["Prospecting"],
      };

      const allowed = allowedTransitions[existing.stage || "Prospecting"];
      if (!allowed || !allowed.includes(args.stage)) {
        throw new Error(`Invalid stage transition from ${existing.stage || "Prospecting"} to ${args.stage}`);
      }

      const stageProbabilities: Record<string, number> = {
        Prospecting: 10,
        Qualification: 25,
        Proposal: 50,
        Negotiation: 75,
        "Verbal Commit": 90,
        "Closed Won": 100,
        "Closed Lost": 0,
      };

      patchData.probability = stageProbabilities[args.stage] ?? 10;
      patchData.stageChangedAt = now;
      patchData.stageChangedBy = userName;

      // Handle Closed Won / Closed Lost transitions
      if (args.stage === "Closed Won") {
        patchData.status = "Won";

        // 1. Create onboarding task
        await ctx.db.insert("tasks", {
          title: `Onboarding: ${args.company || args.title}`,
          dueDate: now + 7 * 24 * 60 * 60 * 1000, // 7 days
          status: "Pending",
          priority: "Medium",
          createdBy: userId as Id<"users">,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        // 2. Create implementation task
        await ctx.db.insert("tasks", {
          title: `Implementation Setup: ${args.company || args.title}`,
          dueDate: now + 14 * 24 * 60 * 60 * 1000, // 14 days
          status: "Pending",
          priority: "Medium",
          createdBy: userId as Id<"users">,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        // 3. Create invoice placeholder task
        await ctx.db.insert("tasks", {
          title: `Invoice Generation: ${args.company || args.title}`,
          dueDate: now + 3 * 24 * 60 * 60 * 1000, // 3 days
          status: "Pending",
          priority: "High",
          createdBy: userId as Id<"users">,
          assignedTo: args.assignedTo,
          createdAt: now,
          updatedAt: now,
        });

        // 4. Mark company as Customer
        const targetCompanyId = existing.companyId;
        if (targetCompanyId) {
          await ctx.db.patch(targetCompanyId, {
            status: "Customer",
            updatedAt: now,
          });
        }

        // Log Won activities
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
        // Log standard stage transition
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
      // Log simple update
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
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admins can delete deals");
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deal not found");

    if (existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Cannot delete deal belonging to another company");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
