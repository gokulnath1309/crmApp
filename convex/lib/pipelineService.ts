import { isValidForwardTransition, isTerminalStage } from "../pipeline";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

type Ctx = { db: any; scheduler: any };

export function validateDealStageTransition(fromStage: string, toStage: string): void {
  if (fromStage === toStage) {
    throw new Error("Deal is already in this stage");
  }
  if (isTerminalStage(fromStage)) {
    throw new Error("This deal has reached a terminal stage and cannot be moved. Only a Workspace Owner or Administrator can reopen it.");
  }
  if (!isValidForwardTransition(fromStage, toStage)) {
    throw new Error(`This deal has already progressed beyond this stage and cannot be moved backwards.`);
  }
}

export function validateLeadStatusTransition(fromStatus: string, toStatus: string): void {
  if (fromStatus === toStatus) {
    throw new Error("Lead is already in this status");
  }

  const LEAD_FLOW: Record<string, string[]> = {
    New: ["Contacted", "Unqualified", "Lost", "Spam", "Duplicate"],
    Contacted: ["Qualified", "Unqualified", "Lost", "Spam", "Duplicate"],
    Qualified: ["Converted", "Unqualified", "Lost", "Spam", "Duplicate"],
    Converted: [],
    Lost: ["Contacted"],
    Unqualified: ["Contacted"],
    Spam: ["Contacted"],
    Duplicate: ["Contacted"],
  };

  const allowed = LEAD_FLOW[fromStatus || "New"];
  if (!allowed || !allowed.includes(toStatus)) {
    throw new Error(`Invalid status transition from ${fromStatus} to ${toStatus}`);
  }
}

export async function archiveEntity(
  ctx: Ctx,
  table: "leads" | "deals",
  id: Id<"leads"> | Id<"deals">,
  userId: Id<"users">,
  userName: string,
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(id, {
    isArchived: true,
    archivedAt: now,
    archivedBy: userId,
  } as any);

  const entity = await ctx.db.get(id);
  const workspaceId = entity?.workspaceId;

  await ctx.scheduler.runAfter(0, internal.activities.log, {
    type: `${table}_archived`,
    description: `archived ${table === "leads" ? "lead" : "deal"}`,
    userId,
    userName,
    entityType: table === "leads" ? "lead" : "deal",
    entityId: id,
    workspaceId,
  });
}

export async function restoreEntity(
  ctx: Ctx,
  table: "leads" | "deals",
  id: Id<"leads"> | Id<"deals">,
  userId: Id<"users">,
  userName: string,
): Promise<void> {
  const now = Date.now();
  const patchData: any = {
    isArchived: false,
    archivedAt: undefined,
    archivedBy: undefined,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    restoredAt: now,
    restoredBy: userId,
  };
  await ctx.db.patch(id, patchData);

  const entity = await ctx.db.get(id);
  const workspaceId = entity?.workspaceId;

  await ctx.scheduler.runAfter(0, internal.activities.log, {
    type: `${table}_restored`,
    description: `restored ${table === "leads" ? "lead" : "deal"}`,
    userId,
    userName,
    entityType: table === "leads" ? "lead" : "deal",
    entityId: id,
    workspaceId,
  });
}

export async function softDeleteEntity(
  ctx: Ctx,
  table: "leads" | "deals",
  id: Id<"leads"> | Id<"deals">,
  userId: Id<"users">,
  userName: string,
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(id, {
    isDeleted: true,
    deletedAt: now,
    deletedBy: userId,
  } as any);

  const entity = await ctx.db.get(id);
  const workspaceId = entity?.workspaceId;

  await ctx.scheduler.runAfter(0, internal.activities.log, {
    type: `${table}_deleted`,
    description: `moved ${table === "leads" ? "lead" : "deal"} to trash`,
    userId,
    userName,
    entityType: table === "leads" ? "lead" : "deal",
    entityId: id,
    workspaceId,
  });
}

export async function permanentDeleteEntity(
  ctx: Ctx,
  table: "leads" | "deals",
  id: Id<"leads"> | Id<"deals">,
): Promise<void> {
  const entity = await ctx.db.get(id);
  const workspaceId = entity?.workspaceId;
  const entityType = table === "leads" ? "lead" : "deal";

  await ctx.db.delete(id);

  await ctx.scheduler.runAfter(0, internal.activities.log, {
    type: `${table}_permanently_deleted`,
    description: `permanently deleted ${entityType}`,
    entityType,
    entityId: id,
    workspaceId,
  });
}

export async function recordDealStageHistory(
  ctx: Ctx,
  dealId: Id<"deals">,
  fromStage: string,
  toStage: string,
  userId: Id<"users">,
  userName: string,
  workspaceId: Id<"workspaces">,
): Promise<void> {
  await ctx.db.insert("dealStageHistory", {
    dealId,
    fromStage,
    toStage,
    userId,
    userName,
    transitionedAt: Date.now(),
    workspaceId,
  });
}

export function getEffectiveDealStatus(stage: string): string {
  if (stage === "Closed Won") return "Won";
  if (stage === "Closed Lost") return "Lost";
  return "Pipeline";
}
