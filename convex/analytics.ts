import { query } from "./_generated/server";
import { resolveUserReadOnly } from "./lib/getCurrentUser";
import { hasPermission } from "./rbac";
import { ACTIVE_PIPELINE_STAGES } from "./pipeline";

const FORECAST_STAGES = new Set(["Proposal", "Negotiation", "Verbal Commit"]);

const STAGE_KEYS = [
  "Prospecting",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Verbal Commit",
  "Closed Won",
  "Closed Lost",
];

function computeDealMetrics(deals: any[]) {
  const dealsByStage: Record<string, number> = {};
  for (const s of STAGE_KEYS) dealsByStage[s] = 0;

  for (const d of deals) {
    if (d.stage && dealsByStage[d.stage] !== undefined) {
      dealsByStage[d.stage]++;
    }
  }

  const totalPipelineValue: Record<string, number> = {};
  const weightedPipelineValue: Record<string, number> = {};
  const closedRevenue: Record<string, number> = {};
  const forecastRevenue: Record<string, number> = {};

  for (const d of deals) {
    const cur = d.currency || "INR";
    const val = d.value || 0;
    const prob = d.probability ?? 10;

    if (ACTIVE_PIPELINE_STAGES.has(d.stage)) {
      totalPipelineValue[cur] = (totalPipelineValue[cur] || 0) + val;
      weightedPipelineValue[cur] = (weightedPipelineValue[cur] || 0) + (val * prob) / 100;

      if (FORECAST_STAGES.has(d.stage)) {
        forecastRevenue[cur] = (forecastRevenue[cur] || 0) + val;
      }
    } else if (d.stage === "Closed Won") {
      closedRevenue[cur] = (closedRevenue[cur] || 0) + val;
    }
  }

  const wonCount = deals.filter((d) => d.stage === "Closed Won").length;
  const lostCount = deals.filter((d) => d.stage === "Closed Lost").length;
  const totalClosed = wonCount + lostCount;

  return {
    totalPipelineValue,
    weightedPipelineValue,
    closedRevenue,
    forecastRevenue,
    dealsByStage,
    winRate: totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0,
    lostRate: totalClosed > 0 ? (lostCount / totalClosed) * 100 : 0,
    wonCount,
    lostCount,
  };
}

export const getDealAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    const userId = currentUser?._id;
    const workspaceId = currentUser?.activeWorkspaceId || currentUser?.workspaceId;

    if (!currentUser || currentUser.isActive === false || !workspaceId) {
      return computeDealMetrics([]);
    }

    let allDeals = await ctx.db
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
          (d) =>
            d.assignedTo === userId ||
            d.createdBy === userId ||
            d.ownerId === userId
        );
      } else {
        scoped = [];
      }
    }

    const activeDeals = scoped.filter((d) => !d.isArchived && !d.isDeleted);
    return computeDealMetrics(activeDeals);
  },
});
