import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { canAccessLead, hasPermission, canAssignLead, canArchiveEntity, canRestoreEntity, canPermanentDelete } from "./rbac";
import { notifyUser, notifyAdmins } from "./lib/notifications";
import { archiveEntity, restoreEntity, softDeleteEntity, permanentDeleteEntity } from "./lib/pipelineService";

async function handleLeadConversion(
  ctx: any,
  lead: any,
  currentUser: any,
  options?: {
    dealValue?: number;
    dealCurrency?: string;
    dealName?: string;
    dealType?: string;
    initialStage?: string;
    expectedCloseDate?: number;
    priority?: string;
    contractStartDate?: number;
    contractEndDate?: number;
    renewalDate?: number;
    billingFrequency?: string;
    poNumber?: string;
    referenceNumber?: string;
    notes?: string;
  },
) {
  const now = Date.now();
  const userName = currentUser.name || "System";
  const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

  // Resolve target workspace (lead's or user's active)
  const targetWorkspaceId = lead.workspaceId || workspaceId!;

  // Re‑conversion: fix existing deal in‑place instead of blocking
  if (lead.dealId) {
    const existingDeal = await ctx.db.get(lead.dealId);
    if (existingDeal) {
      const needsWorkspaceFix = existingDeal.workspaceId !== targetWorkspaceId;
      const needsStageFix = existingDeal.stage !== "Prospecting" || existingDeal.status !== "Pipeline";
      if (needsWorkspaceFix || needsStageFix) {
        await ctx.db.patch(lead.dealId, {
          workspaceId: targetWorkspaceId,
          stage: "Prospecting",
          status: "Pipeline",
          probability: 10,
          updatedAt: now,
          dealType: options?.dealType ?? existingDeal.dealType,
          expectedCloseDate: options?.expectedCloseDate ?? existingDeal.expectedCloseDate,
          priority: options?.priority ?? existingDeal.priority,
          contractStartDate: options?.contractStartDate ?? existingDeal.contractStartDate,
          contractEndDate: options?.contractEndDate ?? existingDeal.contractEndDate,
          renewalDate: options?.renewalDate ?? existingDeal.renewalDate,
          billingFrequency: options?.billingFrequency ?? existingDeal.billingFrequency,
          poNumber: options?.poNumber ?? existingDeal.poNumber,
          referenceNumber: options?.referenceNumber ?? existingDeal.referenceNumber,
        });
      }
      return { leadId: lead._id, dealId: lead.dealId, alreadyConverted: true };
    }
  }

  // Create contact if not exists by email (in the same workspace)
  let contactId: Id<"contacts"> | undefined;
  if (lead.email) {
    const existingContacts = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q: any) => q.eq("email", lead.email.toLowerCase()))
      .collect();
    if (existingContacts.length === 0) {
      contactId = await ctx.db.insert("contacts", {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.jobTitle,
        status: "Active",
        tags: ["Converted from Lead"],
        createdBy: currentUser._id,
        ownerId: currentUser._id,
        assignedTo: lead.assignedTo,
        workspaceId: targetWorkspaceId,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      contactId = existingContacts[0]._id;
    }
  }

  // Create deal with proper pipeline stage/status
  const dealValue = options?.dealValue ?? lead.value ?? 0;
  const dealCurrency = options?.dealCurrency ?? lead.currency ?? "INR";
  const dealTitle = options?.dealName || `${lead.company} - ${lead.firstName} ${lead.lastName}`;
  const initialStage = options?.initialStage || "Prospecting";
  const initialProbability = initialStage === "Prospecting" ? 10 : initialStage === "Qualification" ? 25 : initialStage === "Proposal" ? 50 : initialStage === "Negotiation" ? 75 : initialStage === "Verbal Commit" ? 90 : 10;

  const dealId = await ctx.db.insert("deals", {
    title: dealTitle,
    value: dealValue,
    currency: dealCurrency,
    status: "Pipeline",
    stage: initialStage,
    probability: initialProbability,
    company: lead.company,
    createdBy: currentUser._id,
    ownerId: currentUser._id,
    assignedTo: lead.assignedTo,
    leadId: lead._id,
    workspaceId: targetWorkspaceId,
    contactId,
    stageChangedAt: now,
    stageChangedBy: userName,
    createdAt: now,
    updatedAt: now,

    // New metadata
    dealType: options?.dealType,
    expectedCloseDate: options?.expectedCloseDate,
    priority: options?.priority,
    contractStartDate: options?.contractStartDate,
    contractEndDate: options?.contractEndDate,
    renewalDate: options?.renewalDate,
    billingFrequency: options?.billingFrequency,
    poNumber: options?.poNumber,
    referenceNumber: options?.referenceNumber,
  });

  // Update lead to Converted with conversion tracking
  await ctx.db.patch(lead._id, {
    status: "Converted",
    statusChangedAt: now,
    statusChangedBy: userName,
    convertedAt: now,
    convertedBy: currentUser._id,
    dealId,
    updatedAt: now,
  });

  // Insert stage transition record
  await ctx.db.insert("leadStageTransitions", {
    leadId: lead._id,
    fromStage: lead.status,
    toStage: "Converted",
    userId: currentUser._id,
    userName,
    transitionedAt: now,
    data: { dealId, dealValue },
    workspaceId: targetWorkspaceId,
  });

  // Log conversion activity
  await ctx.scheduler.runAfter(0, internal.activities.log, {
    type: "lead_converted",
    description: `converted lead "${lead.company}" to deal`,
    userId: currentUser._id,
    userName,
    entityType: "lead",
    entityId: lead._id,
  });

  // Notify assigned user
  if (lead.assignedTo && lead.assignedTo !== currentUser._id) {
    await notifyUser(ctx, lead.assignedTo, "lead_converted", {
      entityName: lead.company,
      entityType: "lead",
      entityId: lead._id,
      createdBy: currentUser._id,
    });
  }

  // Notify admins
  await notifyAdmins(ctx, undefined, "lead_converted", {
    entityName: lead.company,
    entityType: "lead",
    entityId: lead._id,
    createdBy: currentUser._id,
  });

  return { leadId: lead._id, dealId, alreadyConverted: false };
}

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
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Lifecycle filter
    const lifecycleFilter = args.filter || "active";
    if (lifecycleFilter === "active") {
      leads = leads.filter((l) => !l.isArchived && !l.isDeleted);
    } else if (lifecycleFilter === "archived") {
      leads = leads.filter((l) => l.isArchived && !l.isDeleted);
    } else if (lifecycleFilter === "trash") {
      leads = leads.filter((l) => l.isDeleted);
    }

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
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    source: v.string(),
    website: v.optional(v.string()),
    initialNotes: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
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
    const hasEmail = !!args.email?.trim();
    const hasPhone = !!args.phone?.trim();
    if (!hasEmail && !hasPhone) {
      throw new Error("Email or Phone is required");
    }

    const leadId = await ctx.db.insert("leads", {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: (args.email || "").trim(),
      phone: args.phone?.trim(),
      company: args.company.trim(),
      jobTitle: args.jobTitle?.trim(),
      status: args.status || "New",
      source: args.source,
      createdBy: currentUserId,
      ownerId: currentUserId,
      assignedTo: effectiveAssignedTo,
      workspaceId,
      website: args.website?.trim(),
      initialNotes: args.initialNotes?.trim(),
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
      statusChangedBy: userName,
    });

    await ctx.db.insert("leadStageTransitions", {
      leadId,
      fromStage: "None",
      toStage: args.status || "New",
      userId: currentUserId,
      userName,
      transitionedAt: now,
      data: { company: args.company, source: args.source, notes: args.initialNotes },
      workspaceId,
    });

    await ctx.db.insert("leadActivities", {
      leadId,
      activityType: "Note",
      userId: currentUserId,
      userName,
      date: new Date(now).toISOString().split("T")[0],
      time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
      duration: "0",
      summary: "Lead created and initialized",
      notes: args.initialNotes || "Lead created in system.",
      stageAtTime: "New",
      workspaceId,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_created",
      description: `created a new lead "${args.company}" (${args.firstName} ${args.lastName})`,
      userId,
      userName,
      entityType: "lead",
      entityId: leadId,
    });

    if (effectiveAssignedTo && effectiveAssignedTo !== currentUserId) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_assigned",
        description: `assigned lead "${args.company}" to user`,
        userId,
        userName,
        entityType: "lead",
        entityId: leadId,
      });
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
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    source: v.string(),
    assignedTo: v.optional(v.id("users")),
    website: v.optional(v.string()),

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

    const existing = await ctx.db.get(args.id);
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
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email?.trim() || existing.email,
      phone: args.phone?.trim(),
      company: args.company.trim(),
      jobTitle: args.jobTitle?.trim(),
      source: args.source,
      website: args.website?.trim(),
      assignedTo: args.assignedTo,
      updatedAt: now,
    };

    if (args.status !== existing.status) {
      const allowedTransitions: Record<string, string[]> = {
        New: ["Contacted", "Unqualified"],
        Contacted: ["Qualified", "Unqualified", "Lost"],
        Qualified: ["Converted", "Unqualified", "Lost"],
        Converted: [],
        Lost: ["New"],
        Unqualified: ["New"],
      };

      const allowed = allowedTransitions[existing.status || "New"];
      if (!allowed || !allowed.includes(args.status)) {
        throw new Error(`Invalid status transition from ${existing.status || "New"} to ${args.status}`);
      }

      // INTERCEPT: Converted → automatically create deal
      if (args.status === "Converted") {
        return await handleLeadConversion(ctx, existing, currentUser);
      }

      patchData.status = args.status;
      patchData.statusChangedAt = now;
      patchData.statusChangedBy = userName;

      let activityType = "lead_status_changed";
      let activityDescription = `changed status of lead "${args.company}" to ${args.status}`;

      if (args.status === "Lost") {
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
        userId,
        userName,
        entityType: "lead",
        entityId: args.id,
      });

      const targetUserId = args.assignedTo || existing.assignedTo;
      if (targetUserId && targetUserId !== currentUserId) {
        await notifyUser(ctx, targetUserId, "lead_status_changed", {
          entityName: args.company,
          status: args.status,
          entityType: "lead",
          entityId: args.id,
          createdBy: currentUserId,
        });
      }
    } else {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_updated",
        description: `updated lead "${args.company}"`,
        userId,
        userName,
        entityType: "lead",
        entityId: args.id,
      });
    }

    if (args.assignedTo && args.assignedTo !== existing.assignedTo) {
      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_assigned",
        description: `assigned lead "${args.company}" to user`,
        userId,
        userName,
        entityType: "lead",
        entityId: args.id,
      });
      if (args.assignedTo !== currentUserId) {
        await notifyUser(ctx, args.assignedTo, "lead_assigned", {
          entityName: args.company,
          entityType: "lead",
          entityId: args.id,
          createdBy: currentUserId,
        });
      }
    }

    await ctx.db.patch(args.id, patchData);
    return args.id;
  },
});

export const archive = mutation({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");
    if (existing.isArchived) throw new Error("Lead is already archived");

    const allowed = await canArchiveEntity(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: You do not have permission to archive leads");

    await archiveEntity(ctx, "leads", args.id, userId, currentUser.name || "System");
    return args.id;
  },
});

export const restore = mutation({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const allowed = await canRestoreEntity(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: You do not have permission to restore leads");

    await restoreEntity(ctx, "leads", args.id, userId, currentUser.name || "System");
    return args.id;
  },
});

export const softDelete = mutation({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");
    if (existing.workspaceId !== workspaceId) throw new Error("Unauthorized");

    const allowed = await canArchiveEntity(ctx, userId);
    if (!allowed) throw new Error("Unauthorized: You do not have permission to delete leads");

    await softDeleteEntity(ctx, "leads", args.id, userId, currentUser.name || "System");
    return args.id;
  },
});

export const permanentDelete = mutation({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");

    if (existing.workspaceId !== workspaceId) {
      throw new Error("Unauthorized: Cannot delete lead belonging to another company");
    }

    const allowed = await canPermanentDelete(ctx, currentUser._id);
    if (!allowed) {
      throw new Error("Unauthorized: Only Administrators and Workspace Owners can permanently delete leads");
    }

    await permanentDeleteEntity(ctx, "leads", args.id);
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

export const transitionStage = mutation({
  args: {
    leadId: v.id("leads"),
    toStage: v.string(),
    transitionData: v.any(),
    activityDetails: v.object({
      activityType: v.string(),
      summary: v.string(),
      notes: v.optional(v.string()),
      duration: v.optional(v.string()),
      outcome: v.optional(v.string()),
      date: v.string(),
      time: v.optional(v.string()),
      nextAction: v.optional(v.string()),
    }),
    reminderDetails: v.optional(v.object({
      title: v.string(),
      dueDate: v.number(),
    })),
    attachments: v.optional(v.array(v.object({
      fileName: v.string(),
      fileType: v.string(),
      fileUrl: v.optional(v.string()),
      category: v.string(),
      duration: v.optional(v.number()),
      mimeType: v.string(),
      stage: v.string(),
      storageId: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) {
      throw new Error("Unauthorized");
    }
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace found");

    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const fromStage = lead.status;
    if (fromStage === args.toStage) {
      throw new Error("Lead is already in this stage");
    }

    const allowedTransitions: Record<string, string[]> = {
      New: ["Contacted", "Unqualified"],
      Contacted: ["Qualified", "Unqualified", "Lost"],
      Qualified: ["Converted", "Unqualified", "Lost"],
      Converted: [],
      Lost: ["New"],
      Unqualified: ["New"],
    };

    const allowed = allowedTransitions[fromStage || "New"];
    if (!allowed || !allowed.includes(args.toStage)) {
      throw new Error(`Invalid status transition from ${fromStage} to ${args.toStage}`);
    }

    // INTERCEPT: Converted → automatically create deal
    if (args.toStage === "Converted") {
      return await handleLeadConversion(ctx, lead, currentUser);
    }

    const now = Date.now();

    await ctx.db.insert("leadStageTransitions", {
      leadId: args.leadId,
      fromStage,
      toStage: args.toStage,
      userId,
      userName,
      transitionedAt: now,
      data: args.transitionData,
      workspaceId,
    });

    const attachmentUrls: string[] = [];
    if (args.attachments && args.attachments.length > 0) {
      for (const att of args.attachments) {
        await ctx.db.insert("leadAttachments", {
          leadId: args.leadId,
          stage: att.stage,
          fileName: att.fileName,
          fileType: att.fileType,
          fileUrl: att.fileUrl,
          category: att.category,
          duration: att.duration,
          mimeType: att.mimeType,
          storageId: att.storageId,
          size: att.size,
          uploadedBy: userId,
          workspaceId,
          createdAt: now,
          uploadedAt: now,
        });
        attachmentUrls.push(att.fileName);
      }
    }

    await ctx.db.insert("leadActivities", {
      leadId: args.leadId,
      activityType: args.activityDetails.activityType,
      userId,
      userName,
      date: args.activityDetails.date,
      time: args.activityDetails.time,
      duration: args.activityDetails.duration,
      summary: args.activityDetails.summary,
      notes: args.activityDetails.notes,
      outcome: args.activityDetails.outcome,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      followUpDate: args.activityDetails.nextAction && args.reminderDetails?.dueDate ? new Date(args.reminderDetails.dueDate).toLocaleDateString() : undefined,
      reminder: !!args.reminderDetails,
      nextAction: args.activityDetails.nextAction,
      stageAtTime: fromStage,
      workspaceId,
      createdAt: now,
    });

    if (args.reminderDetails) {
      await ctx.db.insert("leadReminders", {
        leadId: args.leadId,
        userId,
        userName,
        title: args.reminderDetails.title,
        dueDate: args.reminderDetails.dueDate,
        isCompleted: false,
        workspaceId,
        createdAt: now,
      });
    }

    const leadPatch: any = {
      status: args.toStage,
      updatedAt: now,
      statusChangedAt: now,
      statusChangedBy: userName,
    };

    const tData = args.transitionData;
    if (tData) {
      if (tData.expectedBudget) leadPatch.value = Number(tData.expectedBudget);
      if (tData.industry) leadPatch.industry = tData.industry;
      if (tData.website) leadPatch.website = tData.website;
      if (tData.companySize) leadPatch.companySize = Number(tData.companySize);
      if (tData.annualRevenue) leadPatch.annualRevenue = Number(tData.annualRevenue);
      if (tData.priority) leadPatch.priority = tData.priority;
      if (tData.address) leadPatch.address = tData.address;
      if (tData.city) leadPatch.city = tData.city;
      if (tData.country) leadPatch.country = tData.country;
      if (tData.businessType) leadPatch.businessType = tData.businessType;
      if (tData.buyingAuthority) leadPatch.buyingAuthority = tData.buyingAuthority;
      if (tData.currentSituation) leadPatch.currentSituation = tData.currentSituation;
      if (tData.businessChallenges) leadPatch.businessChallenges = tData.businessChallenges;
      if (tData.goalsObjectives) leadPatch.goalsObjectives = tData.goalsObjectives;
      if (tData.currentProcess) leadPatch.currentProcess = tData.currentProcess;
      if (tData.painPoints) leadPatch.painPoints = tData.painPoints;
      if (tData.requirementsSummary) leadPatch.requirementsSummary = tData.requirementsSummary;
      if (tData.expectedOutcome) leadPatch.expectedOutcome = tData.expectedOutcome;
      if (tData.competitors) leadPatch.competitors = tData.competitors;
      if (tData.urgency) leadPatch.urgency = tData.urgency;
      if (tData.budgetStatus) leadPatch.budgetStatus = tData.budgetStatus;
      if (tData.timeline) leadPatch.timeline = tData.timeline;
      if (tData.decisionMaker !== undefined) leadPatch.decisionMaker = tData.decisionMaker;
      if (tData.decisionMakerName) leadPatch.decisionMakerName = tData.decisionMakerName;
      if (tData.decisionMakerRole) leadPatch.decisionMakerRole = tData.decisionMakerRole;
      if (tData.preferredCommunication) leadPatch.preferredCommunication = tData.preferredCommunication;
      if (tData.preferredContactTime) leadPatch.preferredContactTime = tData.preferredContactTime;
      if (tData.preferredFollowUpMethod) leadPatch.preferredFollowUpMethod = tData.preferredFollowUpMethod;
      if (tData.conversationSummary) leadPatch.customFields = { ...(lead.customFields || {}), conversationSummary: tData.conversationSummary };
      if (tData.nextFollowUpDate) leadPatch.customFields = { ...(leadPatch.customFields || lead.customFields || {}), nextFollowUpDate: tData.nextFollowUpDate };
      if (tData.meetingScheduled !== undefined) leadPatch.customFields = { ...(leadPatch.customFields || lead.customFields || {}), meetingScheduled: tData.meetingScheduled };

      const mergedCustomFields = { ...(lead.customFields || {}) };
      if (tData.customFields) {
        Object.assign(mergedCustomFields, tData.customFields);
      }
      if (Object.keys(mergedCustomFields).length > 0) {
        leadPatch.customFields = mergedCustomFields;
      }
    }

    await ctx.db.patch(args.leadId, leadPatch);

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_status_changed",
      description: `changed status of lead "${lead.company}" to ${args.toStage}`,
      userId: userId ?? undefined,
      userName,
      entityType: "lead",
      entityId: args.leadId,
      workspaceId,
    });

    return args.leadId;
  },
});

export const changeStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.string(),
    unqualifiedReason: v.optional(v.string()),
    unqualifiedNotes: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    lostNotes: v.optional(v.string()),
    lostDate: v.optional(v.number()),
    spamReason: v.optional(v.string()),
    spamNotes: v.optional(v.string()),
    mergedIntoLeadId: v.optional(v.id("leads")),
    requalificationReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const userId = currentUser._id;
    const userName = currentUser.name || "System";
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace found");

    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    const isAccessible = await canAccessLead(ctx, userId, lead);
    if (!isAccessible) throw new Error("Unauthorized");

    const fromStage = lead.status;
    if (fromStage === args.status) throw new Error("Lead is already in this stage");

    const allowedTransitions: Record<string, string[]> = {
      New: ["Contacted", "Unqualified", "Lost", "Spam", "Duplicate"],
      Contacted: ["Qualified", "Unqualified", "Lost", "Spam", "Duplicate"],
      Qualified: ["Converted", "Unqualified", "Lost", "Spam", "Duplicate"],
      Converted: [],
      Lost: ["Contacted"],
      Unqualified: ["Contacted"],
      Spam: ["Contacted"],
      Duplicate: ["Contacted"],
    };

    const allowed = allowedTransitions[fromStage || "New"];
    if (!allowed || !allowed.includes(args.status)) {
      throw new Error(`Invalid status transition from ${fromStage} to ${args.status}`);
    }

    // INTERCEPT: Converted → automatically create deal
    if (args.status === "Converted") {
      return await handleLeadConversion(ctx, lead, currentUser);
    }

    const role = currentUser.role || "employee";
    const isAdminOrManager = role === "admin" || role === "super_admin";
    const isReopening = ["Lost", "Unqualified", "Spam", "Duplicate"].includes(fromStage) && args.status === "Contacted";

    if (isReopening && !isAdminOrManager) {
      throw new Error("Only Managers and Admins can reopen leads");
    }
    if ((args.status === "Duplicate" || args.status === "Spam") && !isAdminOrManager) {
      throw new Error(`Only Managers and Admins can mark leads as ${args.status}`);
    }

    const now = Date.now();
    const patchData: any = {
      status: args.status,
      updatedAt: now,
      statusChangedAt: now,
      statusChangedBy: userName,
    };

    if (args.status === "Lost") {
      patchData.lostAt = now;
      patchData.lostReason = args.lostReason || "Other";
      patchData.lostNotes = args.lostNotes || "";

      patchData.statusReason = args.lostReason || "Other";
      patchData.statusNotes = args.lostNotes || "";
      patchData.closedAt = args.lostDate || now;
      patchData.closedBy = userId;
      patchData.isClosed = true;
    } else if (args.status === "Unqualified") {
      patchData.unqualifiedAt = now;
      patchData.unqualifiedReason = args.unqualifiedReason || "Other";
      patchData.unqualifiedNotes = args.unqualifiedNotes || "";

      patchData.statusReason = args.unqualifiedReason || "Other";
      patchData.statusNotes = args.unqualifiedNotes || "";
      patchData.closedAt = now;
      patchData.closedBy = userId;
      patchData.isClosed = true;
    } else if (args.status === "Spam") {
      patchData.statusReason = args.spamReason || "Spam";
      patchData.statusNotes = args.spamNotes || "";
      patchData.closedAt = now;
      patchData.closedBy = userId;
      patchData.isClosed = true;
      patchData.spamFlag = true;
    } else if (args.status === "Duplicate") {
      patchData.statusReason = "Merged Duplicate";
      patchData.statusNotes = args.unqualifiedNotes || args.lostNotes || "";
      patchData.closedAt = now;
      patchData.closedBy = userId;
      patchData.isClosed = true;
      patchData.mergedIntoLeadId = args.mergedIntoLeadId;
    } else if (isReopening) {
      patchData.reopenedAt = now;
      patchData.reopenedBy = userId;
      patchData.isClosed = false;
      patchData.spamFlag = false;
      patchData.mergedIntoLeadId = undefined;
      patchData.statusReason = undefined;
      patchData.statusNotes = undefined;
      patchData.closedAt = undefined;
      patchData.closedBy = undefined;
      patchData.requalifiedAt = now;
      patchData.requalifiedBy = userName;
      patchData.requalificationReason = args.requalificationReason;
    } else {
      patchData.isClosed = false;
    }

    await ctx.db.patch(args.leadId, patchData);

    await ctx.db.insert("leadStageTransitions", {
      leadId: args.leadId,
      fromStage,
      toStage: args.status,
      userId,
      userName,
      transitionedAt: now,
      data: {
        lostReason: args.lostReason,
        lostNotes: args.lostNotes,
        unqualifiedReason: args.unqualifiedReason,
        unqualifiedNotes: args.unqualifiedNotes,
        spamReason: args.spamReason,
        spamNotes: args.spamNotes,
        requalificationReason: args.requalificationReason,
        mergedIntoLeadId: args.mergedIntoLeadId,
      },
      workspaceId,
    });

    const activityType =
      args.status === "Lost" ? "lead_lost" :
      args.status === "Unqualified" ? "lead_unqualified" :
      isReopening ? "lead_requalified" :
      "lead_status_changed";

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: activityType,
      description: `changed status of lead "${lead.company}" to ${args.status}`,
      userId,
      userName,
      entityType: "lead",
      entityId: args.leadId,
      workspaceId,
    });

    if (args.status === "Lost") {
      await notifyAdmins(ctx, undefined, "lead_marked_lost", {
        entityName: lead.company,
        entityType: "lead",
        entityId: args.leadId,
        userName,
        createdBy: userId,
      });
    } else if (args.status === "Unqualified") {
      await notifyAdmins(ctx, undefined, "lead_marked_unqualified", {
        entityName: lead.company,
        entityType: "lead",
        entityId: args.leadId,
        userName,
        createdBy: userId,
      });
    } else if (isReopening) {
      await notifyAdmins(ctx, undefined, "lead_reopened", {
        entityName: lead.company,
        entityType: "lead",
        entityId: args.leadId,
        userName,
        createdBy: userId,
      });
    }

    return args.leadId;
  },
});

export const listTransitions = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    
    return await ctx.db
      .query("leadStageTransitions")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
  },
});

export const listLeadActivities = query({
  args: {
    leadId: v.id("leads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    
    const limit = args.limit ?? 50;
    const activities = await ctx.db
      .query("leadActivities")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
      
    return activities
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      })
      .slice(0, limit);
  },
});

export const listLeadReminders = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    
    return await ctx.db
      .query("leadReminders")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
  },
});

export const createReminder = mutation({
  args: {
    leadId: v.id("leads"),
    title: v.string(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    return await ctx.db.insert("leadReminders", {
      leadId: args.leadId,
      userId: currentUser._id,
      userName: currentUser.name || "System",
      title: args.title,
      dueDate: args.dueDate,
      isCompleted: false,
      workspaceId,
      createdAt: Date.now(),
    });
  },
});

export const completeReminder = mutation({
  args: {
    reminderId: v.id("leadReminders"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) throw new Error("Reminder not found");
    
    await ctx.db.patch(args.reminderId, { isCompleted: true });
    return args.reminderId;
  },
});

export const pinActivity = mutation({
  args: {
    activityId: v.id("leadActivities"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    
    await ctx.db.patch(args.activityId, {
      isPinned: !activity.isPinned,
    });
    return args.activityId;
  },
});

export const updateActivity = mutation({
  args: {
    activityId: v.id("leadActivities"),
    notes: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    
    const isOwner = activity.userId === currentUser._id;
    const isManagerOrAdmin = currentUser.role === "admin" || currentUser.role === "super_admin" || currentUser.role === "manager";
    if (!isOwner && !isManagerOrAdmin) {
      throw new Error("Unauthorized: You do not have permission to edit this activity");
    }
    
    const patch: any = {
      notes: args.notes,
      updatedAt: Date.now(),
    };
    if (args.summary) {
      patch.summary = args.summary;
    }
    
    await ctx.db.patch(args.activityId, patch);
    return args.activityId;
  },
});

export const deleteActivity = mutation({
  args: {
    activityId: v.id("leadActivities"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");
    
    const isOwner = activity.userId === currentUser._id;
    const isManagerOrAdmin = currentUser.role === "admin" || currentUser.role === "super_admin" || currentUser.role === "manager";
    if (!isOwner && !isManagerOrAdmin) {
      throw new Error("Unauthorized: You do not have permission to delete this activity");
    }
    
    await ctx.db.delete(args.activityId);
    return args.activityId;
  },
});

export const updateReminder = mutation({
  args: {
    reminderId: v.id("leadReminders"),
    title: v.string(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) throw new Error("Reminder not found");
    
    await ctx.db.patch(args.reminderId, {
      title: args.title,
      dueDate: args.dueDate,
    });
    return args.reminderId;
  },
});

export const patchLead = mutation({
  args: {
    id: v.id("leads"),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead not found");
    
    const patchData = { ...args.patch, updatedAt: Date.now() };
    await ctx.db.patch(args.id, patchData);
    
    // Log in activities if significant fields change
    const userName = currentUser.name || "System";
    const changeDesc = Object.keys(args.patch)
      .map(k => `"${k}" to "${args.patch[k]}"`)
      .join(", ");
    
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_updated",
      description: `updated lead "${existing.company}": changed ${changeDesc}`,
      userId: currentUser._id,
      userName,
      entityType: "lead",
      entityId: args.id,
      workspaceId: existing.workspaceId,
    });
    
    return args.id;
  },
});

export const listLeadAttachments = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];
    
    const attachments = await ctx.db
      .query("leadAttachments")
      .withIndex("by_leadId", (q) => q.eq("leadId", args.leadId))
      .collect();
      
    const attachmentsWithUser = [];
    for (const att of attachments) {
      const u = await ctx.db.get(att.uploadedBy);
      let resolvedUrl: string | undefined = att.fileUrl;
      if (!resolvedUrl && att.storageId) {
        const url = await ctx.storage.getUrl(att.storageId);
        if (url) resolvedUrl = url;
      }
      attachmentsWithUser.push({
        ...att,
        fileUrl: resolvedUrl || att.fileUrl,
        uploaderName: u?.name || "System",
      });
    }
    
    return attachmentsWithUser.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const uploadAttachment = mutation({
  args: {
    leadId: v.id("leads"),
    stage: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    fileUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    duration: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    storageId: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const now = Date.now();
    const attId = await ctx.db.insert("leadAttachments", {
      leadId: args.leadId,
      stage: args.stage || "Contacted",
      fileName: args.fileName,
      fileType: args.fileType,
      fileUrl: args.fileUrl,
      category: args.category,
      duration: args.duration,
      mimeType: args.mimeType || args.fileType,
      storageId: args.storageId,
      size: args.size,
      uploadedBy: currentUser._id,
      workspaceId,
      createdAt: now,
      uploadedAt: now,
    });

    const lead = await ctx.db.get(args.leadId);
    const stageAtTime = lead?.status || "New";

    await ctx.db.insert("leadActivities", {
      leadId: args.leadId,
      activityType: "File Upload",
      userId: currentUser._id,
      userName: currentUser.name || "System",
      date: new Date(now).toLocaleDateString(),
      time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
      summary: `File Uploaded: ${args.fileName}`,
      notes: `Uploaded file type: ${args.fileType}`,
      stageAtTime,
      workspaceId,
      createdAt: now,
    });

    return attId;
  },
});

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("leadAttachments"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    
    const att = await ctx.db.get(args.attachmentId);
    if (!att) throw new Error("Attachment not found");
    
    const isOwner = att.uploadedBy === currentUser._id;
    const isAdminOrManager = currentUser.role === "super_admin" || currentUser.role === "admin" || currentUser.role === "manager";
    if (!isOwner && !isAdminOrManager) {
      throw new Error("Unauthorized: You do not have permission to delete this file");
    }
    
    await ctx.db.delete(args.attachmentId);
    return args.attachmentId;
  },
});

export const get = query({
  args: {
    id: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;
    
    return await ctx.db.get(args.id);
  },
});

export const contactInteraction = mutation({
  args: {
    leadId: v.id("leads"),
    businessType: v.optional(v.string()),
    buyingAuthority: v.optional(v.string()),
    currentSituation: v.optional(v.string()),
    businessChallenges: v.optional(v.string()),
    goalsObjectives: v.optional(v.string()),
    currentProcess: v.optional(v.string()),
    painPoints: v.optional(v.string()),
    requirementsSummary: v.optional(v.string()),
    expectedOutcome: v.optional(v.string()),
    competitors: v.optional(v.string()),
    urgency: v.optional(v.string()),
    budgetStatus: v.optional(v.string()),
    timeline: v.optional(v.string()),
    decisionMaker: v.optional(v.boolean()),
    decisionMakerName: v.optional(v.string()),
    decisionMakerRole: v.optional(v.string()),
    preferredCommunication: v.optional(v.string()),
    preferredContactTime: v.optional(v.string()),
    preferredFollowUpMethod: v.optional(v.string()),
    conversationSummary: v.optional(v.string()),
    nextFollowUpDate: v.optional(v.number()),
    meetingScheduled: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    status: v.string(), // Must be "Contacted"
    attachments: v.optional(v.array(v.object({
      fileName: v.string(),
      fileType: v.string(),
      fileUrl: v.optional(v.string()),
      category: v.optional(v.string()),
      duration: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      storageId: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const now = Date.now();
    const userName = currentUser.name || "System";
    const { leadId, status, attachments, conversationSummary, notes: extraNotes, nextFollowUpDate, meetingScheduled, ...interactionData } = args;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");

    const isAccessible = await canAccessLead(ctx, currentUser._id, lead);
    if (!isAccessible) throw new Error("Unauthorized");

    if (lead.status !== "New") throw new Error("Lead must be in New status");

    const patchData: any = {
      status: "Contacted",
      statusChangedAt: now,
      statusChangedBy: userName,
      updatedAt: now,
      ...interactionData,
    };

    await ctx.db.patch(leadId, patchData);

    // Save attachments
    const attachmentNames: string[] = [];
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        await ctx.db.insert("leadAttachments", {
          leadId,
          stage: "Contacted",
          fileName: att.fileName,
          fileType: att.fileType,
          fileUrl: att.fileUrl,
          category: att.category,
          duration: att.duration,
          mimeType: att.mimeType,
          storageId: att.storageId,
          size: att.size,
          uploadedBy: currentUser._id,
          workspaceId,
          createdAt: now,
          uploadedAt: now,
        });
        attachmentNames.push(att.fileName);
      }
    }

    await ctx.db.insert("leadStageTransitions", {
      leadId,
      fromStage: "New",
      toStage: "Contacted",
      userId: currentUser._id,
      userName,
      transitionedAt: now,
      data: { ...interactionData, conversationSummary, notes: extraNotes, nextFollowUpDate, meetingScheduled },
      workspaceId,
    });

    await ctx.db.insert("leadActivities", {
      leadId,
      activityType: "Note",
      userId: currentUser._id,
      userName,
      date: new Date(now).toISOString().split("T")[0],
      time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
      duration: "0",
      summary: attachmentNames.length > 0
        ? `Contacted with ${attachmentNames.length} attachment(s)`
        : "Contacted - Initial interaction recorded",
      notes: conversationSummary || "Contacted stage initiated",
      stageAtTime: "Contacted",
      workspaceId,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_contacted",
      description: `initiated contact with lead "${lead.company}"`,
      userId: currentUser._id,
      userName,
      entityType: "lead",
      entityId: leadId,
    });

    return leadId;
  },
});

export const setContactedData = mutation({
  args: {
    leadId: v.id("leads"),
    businessType: v.optional(v.string()),
    buyingAuthority: v.optional(v.string()),
    currentSituation: v.optional(v.string()),
    businessChallenges: v.optional(v.string()),
    goalsObjectives: v.optional(v.string()),
    currentProcess: v.optional(v.string()),
    painPoints: v.optional(v.string()),
    requirementsSummary: v.optional(v.string()),
    expectedOutcome: v.optional(v.string()),
    competitors: v.optional(v.string()),
    urgency: v.optional(v.string()),
    budgetStatus: v.optional(v.string()),
    timeline: v.optional(v.string()),
    decisionMaker: v.optional(v.boolean()),
    decisionMakerName: v.optional(v.string()),
    decisionMakerRole: v.optional(v.string()),
    preferredCommunication: v.optional(v.string()),
    preferredContactTime: v.optional(v.string()),
    preferredFollowUpMethod: v.optional(v.string()),
    conversationSummary: v.optional(v.string()),
    nextFollowUpDate: v.optional(v.number()),
    meetingScheduled: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    isQualified: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.object({
      fileName: v.string(),
      fileType: v.string(),
      fileUrl: v.optional(v.string()),
      category: v.optional(v.string()),
      duration: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      storageId: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const now = Date.now();
    const userName = currentUser.name || "System";
    const { leadId, attachments, conversationSummary, notes, nextFollowUpDate, meetingScheduled, isQualified, ...data } = args;
    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found");

    const isAccessible = await canAccessLead(ctx, currentUser._id, lead);
    if (!isAccessible) throw new Error("Unauthorized");

    const patchData: any = { ...data, updatedAt: now };

    if (isQualified) {
      patchData.status = "Qualified";
      patchData.statusChangedAt = now;
      patchData.statusChangedBy = userName;
    }

    await ctx.db.patch(leadId, patchData);

    // Save attachments
    const attachmentNames: string[] = [];
    if (attachments && attachments.length > 0) {
      const targetStage = isQualified ? "Qualified" : "Contacted";
      for (const att of attachments) {
        await ctx.db.insert("leadAttachments", {
          leadId,
          stage: targetStage,
          fileName: att.fileName,
          fileType: att.fileType,
          fileUrl: att.fileUrl,
          category: att.category,
          duration: att.duration,
          mimeType: att.mimeType,
          storageId: att.storageId,
          size: att.size,
          uploadedBy: currentUser._id,
          workspaceId,
          createdAt: now,
          uploadedAt: now,
        });
        attachmentNames.push(att.fileName);
      }
    }

    if (isQualified) {
      await ctx.db.insert("leadStageTransitions", {
        leadId,
        fromStage: "Contacted",
        toStage: "Qualified",
        userId: currentUser._id,
        userName,
        transitionedAt: now,
        data: { ...data, conversationSummary, notes, nextFollowUpDate, meetingScheduled, isQualified },
        workspaceId,
      });

      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "lead_qualified",
        description: `qualified lead "${lead.company}"`,
        userId: currentUser._id,
        userName,
        entityType: "lead",
        entityId: leadId,
      });
    }

    return leadId;
  },
});

export const convertToDeal = mutation({
  args: {
    leadId: v.id("leads"),
    dealValue: v.optional(v.number()),
    dealCurrency: v.optional(v.string()),
    dealName: v.optional(v.string()),
    dealType: v.optional(v.string()),
    initialStage: v.optional(v.string()),
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
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");

    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");

    // Allow conversion from any convertible status, including already Converted (re‑run)
    const convertibleStatuses = ["Qualified", "Contacted", "Converted"];
    if (!convertibleStatuses.includes(lead.status)) {
      throw new Error(`Lead must be in Qualified, Contacted, or Converted status to convert`);
    }

    const isAccessible = await canAccessLead(ctx, currentUser._id, lead);
    if (!isAccessible) throw new Error("Unauthorized");

    return await handleLeadConversion(ctx, lead, currentUser, {
      dealValue: args.dealValue,
      dealCurrency: args.dealCurrency,
      dealName: args.dealName,
      dealType: args.dealType,
      initialStage: args.initialStage,
      expectedCloseDate: args.expectedCloseDate,
      priority: args.priority,
      contractStartDate: args.contractStartDate,
      contractEndDate: args.contractEndDate,
      renewalDate: args.renewalDate,
      billingFrequency: args.billingFrequency,
      poNumber: args.poNumber,
      referenceNumber: args.referenceNumber,
      notes: args.notes,
    });
  },
});

export const validateQualification = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;

    const lead = await ctx.db.get(args.leadId);
    if (!lead) return null;

    const l = lead as any;
    return {
      hasInteraction: l.status === "Contacted" || l.status === "Qualified",
      hasConversationSummary: !!(l.conversationSummary || l.customFields?.conversationSummary),
      decisionMakerKnown: l.decisionMaker !== undefined,
      interestLevelSet: !!(l.urgency || l.customFields?.urgency),
      followUpComplete: !!(l.nextFollowUpDate || l.meetingScheduled || l.customFields?.nextFollowUpDate || l.customFields?.meetingScheduled),
      budgetKnown: !!l.budgetStatus,
      timelineKnown: !!(l.timeline || l.customFields?.timeline),
    };
  },
});

export const mergeLeads = mutation({
  args: {
    duplicateLeadId: v.id("leads"),
    targetLeadId: v.id("leads"),
    mergeNotes: v.boolean(),
    mergeActivities: v.boolean(),
    mergeFiles: v.boolean(),
    mergeTimeline: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUser(ctx);
    if (!currentUser || currentUser.isActive === false) throw new Error("Unauthorized");
    const role = currentUser.role || "employee";
    if (role !== "admin" && role !== "super_admin") throw new Error("Only Managers and Admins can merge duplicates");

    const duplicateLead = await ctx.db.get(args.duplicateLeadId);
    const targetLead = await ctx.db.get(args.targetLeadId);
    if (!duplicateLead || !targetLead) throw new Error("Lead not found");

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const now = Date.now();
    const userId = currentUser._id;
    const userName = currentUser.name || "System";

    // 1. Merge Notes
    if (args.mergeNotes) {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_entity", (q) =>
          q.eq("entityType", "lead").eq("entityId", args.duplicateLeadId)
        )
        .collect();
      for (const note of notes) {
        await ctx.db.patch(note._id, { entityId: args.targetLeadId });
      }
    }

    // 2. Merge Activities
    if (args.mergeActivities) {
      const activities = await ctx.db
        .query("leadActivities")
        .withIndex("by_leadId", (q) => q.eq("leadId", args.duplicateLeadId))
        .collect();
      for (const act of activities) {
        await ctx.db.patch(act._id, { leadId: args.targetLeadId });
      }

      // Also merge reminders if activities are merged
      const reminders = await ctx.db
        .query("leadReminders")
        .withIndex("by_leadId", (q) => q.eq("leadId", args.duplicateLeadId))
        .collect();
      for (const rem of reminders) {
        await ctx.db.patch(rem._id, { leadId: args.targetLeadId });
      }
    }

    // 3. Merge Files (Attachments)
    if (args.mergeFiles) {
      const files = await ctx.db
        .query("leadAttachments")
        .withIndex("by_leadId", (q) => q.eq("leadId", args.duplicateLeadId))
        .collect();
      for (const file of files) {
        await ctx.db.patch(file._id, { leadId: args.targetLeadId });
      }
    }

    // 4. Merge Stage Transitions (Timeline)
    if (args.mergeTimeline) {
      const transitions = await ctx.db
        .query("leadStageTransitions")
        .withIndex("by_leadId", (q) => q.eq("leadId", args.duplicateLeadId))
        .collect();
      for (const trans of transitions) {
        await ctx.db.patch(trans._id, { leadId: args.targetLeadId });
      }
    }

    // 5. Update Duplicate Lead
    const fromStage = duplicateLead.status;
    await ctx.db.patch(args.duplicateLeadId, {
      status: "Duplicate",
      isClosed: true,
      closedAt: now,
      closedBy: userId,
      statusReason: "Merged Duplicate",
      statusNotes: args.notes || "",
      mergedIntoLeadId: args.targetLeadId,
      updatedAt: now,
    });

    // 6. Record stage transition on duplicate lead
    await ctx.db.insert("leadStageTransitions", {
      leadId: args.duplicateLeadId,
      fromStage,
      toStage: "Duplicate",
      userId,
      userName,
      transitionedAt: now,
      data: {
        mergedIntoLeadId: args.targetLeadId,
        notes: args.notes,
      },
      workspaceId,
    });

    // 7. Log activity on target lead
    await ctx.db.insert("leadActivities", {
      leadId: args.targetLeadId,
      activityType: "Note",
      userId,
      userName,
      date: new Date(now).toLocaleDateString(),
      time: new Date(now).toLocaleTimeString(),
      summary: `System: Merged duplicate lead "${duplicateLead.firstName} ${duplicateLead.lastName}" from ${duplicateLead.company}.`,
      notes: args.notes || "No details provided.",
      stageAtTime: targetLead.status,
      workspaceId,
      createdAt: now,
    });

    // 8. Log global activity
    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "lead_merged",
      description: `merged duplicate lead "${duplicateLead.company}" into "${targetLead.company}"`,
      userId,
      userName,
      entityType: "lead",
      entityId: args.targetLeadId,
      workspaceId,
    });

    // 9. Notify Managers
    await notifyAdmins(ctx, undefined, "lead_merged", {
      entityName: duplicateLead.company,
      entityType: "lead",
      entityId: args.targetLeadId,
      userName,
      createdBy: userId,
    });

    return { duplicateLeadId: args.duplicateLeadId, targetLeadId: args.targetLeadId };
  },
});
