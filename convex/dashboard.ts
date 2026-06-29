import { query } from "./_generated/server";
import { resolveUserReadOnly } from "./lib/getCurrentUser";

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const userId = currentUser?._id;
    const workspaceId = currentUser?.activeWorkspaceId || currentUser?.workspaceId;
    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      return {
        totalLeads: 0,
        totalContacts: 0,
        activeDealsValue: 0,
        pendingTasks: 0,
        recentLeads: [],
        todaysTasks: [],
        activities: [],
        leadRevenue: {},
        openLeadsCount: 0,
        wonRevenue: {},
        revenueForecast: {},
        winRate: 0,
        lostRate: 0,
        dealsByStage: {
          Prospecting: 0,
          Qualification: 0,
          Proposal: 0,
          Negotiation: 0,
          "Verbal Commit": 0,
          "Closed Won": 0,
          "Closed Lost": 0,
        },
        totalPipelineValue: {},
        weightedPipelineValue: {},
        closedRevenue: {},
        leadMetrics: {
          leadsByStatus: {
            New: 0,
            Contacted: 0,
            Qualified: 0,
            Converted: 0,
            Unqualified: 0,
            Lost: 0,
            Spam: 0,
            Duplicate: 0,
          },
          unqualifiedReasons: {},
          lostReasons: {},
          qualificationRate: 0,
          conversionRate: 0,
          avgResponseTimeMin: 0,
          spamPercentage: 0,
          duplicatePercentage: 0,
          leadAging: {
            "0-7 Days": 0,
            "8-30 Days": 0,
            "30+ Days": 0,
          },
          employeeConversionRate: [],
        },
      };
    }

    // 1. Fetch and scope leads, contacts, deals, tasks, activities
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    let contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    let deals = await ctx.db
      .query("deals")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    let rawActivities = await ctx.db
      .query("activities")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    rawActivities.sort((a, b) => b.createdAt - a.createdAt);

    const isSuperAdmin = currentUser.role === "super_admin";
    const isAdmin = currentUser.role === "admin";
    const isMarketingUser = currentUser.role === "marketing";
    const isSupportUser = currentUser.role === "support";

    // Set subordinate IDs for Admin checks
    let subordinateIds = new Set<string>();
    if (isAdmin) {
      const members = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .collect();
      
      const subordinates = await Promise.all(
        members.map(async m => {
          const u = await ctx.db.get(m.userId);
          return u?.managerId === userId ? u : null;
        })
      );
      subordinateIds = new Set(subordinates.filter(Boolean).map((s) => s!._id));
    }

    // Enforce data scoping
    if (!isSuperAdmin) {
      if (isAdmin) {
        leads = leads.filter(
          (l) =>
            l.assignedTo === userId ||
            l.createdBy === userId ||
            l.ownerId === userId ||
            (l.assignedTo && subordinateIds.has(l.assignedTo)) ||
            !l.assignedTo
        );
        deals = deals.filter(
          (d) =>
            d.assignedTo === userId ||
            d.createdBy === userId ||
            d.ownerId === userId ||
            (d.assignedTo && subordinateIds.has(d.assignedTo)) ||
            !d.assignedTo
        );
        tasks = tasks.filter(
          (t) =>
            t.assignedTo === userId ||
            t.createdBy === userId ||
            (t.assignedTo && subordinateIds.has(t.assignedTo)) ||
            !t.assignedTo
        );
      } else if (isMarketingUser) {
        // Marketing sees all leads but no deals
        deals = [];
        tasks = tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
      } else if (isSupportUser) {
        // Support sees no leads and no deals
        leads = [];
        deals = [];
        tasks = tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
      } else {
        // sales_rep, employee
        leads = leads.filter((l) => l.assignedTo === userId || l.createdBy === userId || l.ownerId === userId);
        deals = deals.filter((d) => d.assignedTo === userId || d.createdBy === userId || d.ownerId === userId);
        tasks = tasks.filter((t) => t.assignedTo === userId || t.createdBy === userId);
      }

      // Contacts linked to leads/deals
      const scopedContactIds = new Set([
        ...leads.map(l => l._id),
        ...deals.map(d => d.contactId).filter(Boolean),
      ]);
      const activeCompanies = new Set(deals.map(d => d.company).filter(Boolean));
      const activeLeadCompanies = new Set(leads.map(l => l.company).filter(Boolean));
      contacts = contacts.filter(c =>
        scopedContactIds.has(c._id) ||
        activeCompanies.has(c.company) ||
        activeLeadCompanies.has(c.company) ||
        (c.assignedTo === userId) ||
        (c.createdBy === userId) ||
        (c.ownerId === userId) ||
        isSupportUser
      );

      // Activities
      const scopedLeadIds = new Set(leads.map((l) => l._id));
      const scopedDealIds = new Set(deals.map((d) => d._id));
      const scopedTaskIds = new Set(tasks.map((t) => t._id));
      rawActivities = rawActivities.filter(
        (a) =>
          a.userId === userId ||
          (isAdmin && a.userId && subordinateIds.has(a.userId)) ||
          (a.entityType === "lead" && a.entityId && scopedLeadIds.has(a.entityId as any)) ||
          (a.entityType === "deal" && a.entityId && scopedDealIds.has(a.entityId as any)) ||
          (a.entityType === "task" && a.entityId && scopedTaskIds.has(a.entityId as any))
      );
    }

    const totalLeads = leads.length;
    const recentLeads = [...leads]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const totalContacts = contacts.length;

    const activeDealsValue = deals
      .filter((d) => d.status === "Pipeline" || d.stage !== "Closed Won" && d.stage !== "Closed Lost")
      .reduce((sum, d) => sum + d.value, 0);

    const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
    const todaysTasks = tasks
      .filter((t) => t.status === "Pending")
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 4);

    const activities = rawActivities.slice(0, 10);

    // 6. Calculate lead revenue grouped by currency
    const leadRevenue: Record<string, number> = {};
    for (const lead of leads) {
      if (lead.value !== undefined) {
        const cur = lead.currency || "INR";
        leadRevenue[cur] = (leadRevenue[cur] || 0) + lead.value;
      }
    }

    // 7. Calculate openLeadsCount (leads not in Won, Lost, Unqualified)
    const openLeadsCount = leads.filter(
      (l) => l.status !== "Won" && l.status !== "Lost" && l.status !== "Unqualified"
    ).length;

    // 8. Calculate wonRevenue grouped by currency (leads in Won)
    const wonRevenue: Record<string, number> = {};
    const wonLeads = leads.filter((l) => l.status === "Won");
    for (const lead of wonLeads) {
      if (lead.value !== undefined) {
        const cur = lead.currency || "INR";
        wonRevenue[cur] = (wonRevenue[cur] || 0) + lead.value;
      }
    }

    // 9. Calculate revenueForecast grouped by currency (leads in Proposal Sent or Negotiation)
    const revenueForecast: Record<string, number> = {};
    const forecastLeads = leads.filter(
      (l) => l.status === "Proposal Sent" || l.status === "Negotiation"
    );
    for (const lead of forecastLeads) {
      if (lead.value !== undefined) {
        const cur = lead.currency || "INR";
        revenueForecast[cur] = (revenueForecast[cur] || 0) + lead.value;
      }
    }

    // 10. Compute deal pipeline metrics
    const wonDealsCount = deals.filter((d) => d.stage === "Closed Won").length;
    const lostDealsCount = deals.filter((d) => d.stage === "Closed Lost").length;
    const totalClosed = wonDealsCount + lostDealsCount;
    const winRate = totalClosed > 0 ? (wonDealsCount / totalClosed) * 100 : 0;
    const lostRate = totalClosed > 0 ? (lostDealsCount / totalClosed) * 100 : 0;

    const dealsByStage: Record<string, number> = {
      Prospecting: 0,
      Qualification: 0,
      Proposal: 0,
      Negotiation: 0,
      "Verbal Commit": 0,
      "Closed Won": 0,
      "Closed Lost": 0,
    };
    for (const deal of deals) {
      if (deal.stage && dealsByStage[deal.stage] !== undefined) {
        dealsByStage[deal.stage]++;
      }
    }

    const totalPipelineValue: Record<string, number> = {};
    const weightedPipelineValue: Record<string, number> = {};
    const closedRevenue: Record<string, number> = {};

    const activeStages = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Verbal Commit"];

    for (const deal of deals) {
      const cur = deal.currency || "INR";
      const val = deal.value || 0;
      const prob = deal.probability !== undefined ? deal.probability : 10;

      if (activeStages.includes(deal.stage)) {
        totalPipelineValue[cur] = (totalPipelineValue[cur] || 0) + val;
        weightedPipelineValue[cur] = (weightedPipelineValue[cur] || 0) + (val * prob) / 100;
      } else if (deal.stage === "Closed Won") {
        closedRevenue[cur] = (closedRevenue[cur] || 0) + val;
      }
    }

    // Extended lead qualification metrics
    const leadsByStatus = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Unqualified: 0,
      Lost: 0,
      Spam: 0,
      Duplicate: 0,
    };
    const unqualifiedReasons: Record<string, number> = {};
    const lostReasons: Record<string, number> = {};

    for (const lead of leads) {
      let status = lead.status;
      if (status === "Won") status = "Converted"; // Normalize legacy
      if (leadsByStatus[status as keyof typeof leadsByStatus] !== undefined) {
        leadsByStatus[status as keyof typeof leadsByStatus]++;
      }
      if (status === "Unqualified" && lead.unqualifiedReason) {
        unqualifiedReasons[lead.unqualifiedReason] = (unqualifiedReasons[lead.unqualifiedReason] || 0) + 1;
      }
      if (status === "Lost" && lead.lostReason) {
        lostReasons[lead.lostReason] = (lostReasons[lead.lostReason] || 0) + 1;
      }
    }

    const totalLeadsCount = leads.length;
    const qualifiedCount = leads.filter((l) => l.status === "Qualified").length;
    const convertedCount = leads.filter((l) => l.status === "Converted" || l.status === "Won").length;
    const qualificationRate = totalLeadsCount > 0 ? ((qualifiedCount + convertedCount) / totalLeadsCount) * 100 : 0;
    const conversionRate = totalLeadsCount > 0 ? (convertedCount / totalLeadsCount) * 100 : 0;

    // Response time: average time from creation to contacted
    const transitions = await ctx.db
      .query("leadStageTransitions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const contactedTransitions = transitions.filter((t) => t.toStage === "Contacted");
    let totalResponseTimeMs = 0;
    let responseCount = 0;
    for (const t of contactedTransitions) {
      const matchingLead = leads.find((l) => l._id === t.leadId);
      if (matchingLead) {
        totalResponseTimeMs += (t.transitionedAt - matchingLead.createdAt);
        responseCount++;
      }
    }
    const avgResponseTimeMin = responseCount > 0 ? Math.round((totalResponseTimeMs / responseCount) / 60000) : 0;

    // Lead Aging
    const now = Date.now();
    const leadAging = {
      "0-7 Days": 0,
      "8-30 Days": 0,
      "30+ Days": 0,
    };
    const activeLeads = leads.filter((l) => l.status === "New" || l.status === "Contacted" || l.status === "Qualified");
    for (const l of activeLeads) {
      const ageDays = (now - l.createdAt) / (24 * 60 * 60 * 1000);
      if (ageDays <= 7) leadAging["0-7 Days"]++;
      else if (ageDays <= 30) leadAging["8-30 Days"]++;
      else leadAging["30+ Days"]++;
    }

    // Employee Conversion Rate
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const employees = [];
    for (const m of members) {
      const u = await ctx.db.get(m.userId);
      if (u) {
        employees.push(u);
      }
    }
    const employeeConversionRate = [];
    for (const emp of employees) {
      const empLeads = leads.filter((l) => l.assignedTo === emp._id);
      if (empLeads.length > 0) {
        const empConverted = empLeads.filter((l) => l.status === "Converted" || l.status === "Won").length;
        employeeConversionRate.push({
          name: emp.name || emp.email,
          conversionRate: Math.round((empConverted / empLeads.length) * 100),
          totalLeads: empLeads.length,
        });
      }
    }

    return {
      totalLeads,
      totalContacts,
      activeDealsValue,
      pendingTasks,
      recentLeads,
      todaysTasks,
      activities,
      leadRevenue,
      openLeadsCount,
      wonRevenue,
      revenueForecast,
      winRate,
      lostRate,
      dealsByStage,
      totalPipelineValue,
      weightedPipelineValue,
      closedRevenue,
      leadMetrics: {
        leadsByStatus,
        unqualifiedReasons,
        lostReasons,
        qualificationRate,
        conversionRate,
        avgResponseTimeMin,
        spamPercentage: totalLeadsCount > 0 ? (leadsByStatus.Spam / totalLeadsCount) * 100 : 0,
        duplicatePercentage: totalLeadsCount > 0 ? (leadsByStatus.Duplicate / totalLeadsCount) * 100 : 0,
        leadAging,
        employeeConversionRate,
      },
    };
  },
});
