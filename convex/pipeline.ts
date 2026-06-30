export const DEAL_STAGES = [
  { order: 1, stage: "Prospecting", probability: 10, label: "Prospecting", emoji: "🔍", color: "neutral" as const },
  { order: 2, stage: "Qualification", probability: 25, label: "Qualification", emoji: "📋", color: "blue" as const },
  { order: 3, stage: "Proposal", probability: 50, label: "Proposal", emoji: "📄", color: "purple" as const },
  { order: 4, stage: "Negotiation", probability: 75, label: "Negotiation", emoji: "🤝", color: "orange" as const },
  { order: 5, stage: "Verbal Commit", probability: 90, label: "Verbal Commit", emoji: "🗣️", color: "blue" as const },
  { order: 6, stage: "Closed Won", probability: 100, label: "Closed Won", emoji: "🎉", color: "green" as const },
  { order: 7, stage: "Closed Lost", probability: 0, label: "Closed Lost", emoji: "❌", color: "red" as const },
] as const;

export const DEAL_STAGE_ORDER: Record<string, number> = Object.fromEntries(
  DEAL_STAGES.map(s => [s.stage, s.order])
);

export const DEAL_STAGE_PROBABILITY: Record<string, number> = Object.fromEntries(
  DEAL_STAGES.map(s => [s.stage, s.probability])
);

export const TERMINAL_STAGES = new Set(["Closed Won", "Closed Lost"]);

export const ACTIVE_PIPELINE_STAGES = new Set(
  DEAL_STAGES.filter(s => !TERMINAL_STAGES.has(s.stage)).map(s => s.stage)
);

export const LEAD_STATUSES = [
  { order: 1, status: "New", label: "New" },
  { order: 2, status: "Contacted", label: "Contacted" },
  { order: 3, status: "Qualified", label: "Qualified" },
  { order: 4, status: "Converted", label: "Converted" },
] as const;

export const LEAD_CLOSED_STATUSES = new Set(["Lost", "Unqualified", "Spam", "Duplicate"]);
export const LEAD_REOPENABLE_STATUSES = new Set(["Lost", "Unqualified", "Spam", "Duplicate"]);

export const LEAD_STATUS_ORDER: Record<string, number> = Object.fromEntries(
  LEAD_STATUSES.map(s => [s.status, s.order])
);

export function getDealStageOrder(stage: string): number {
  return DEAL_STAGE_ORDER[stage] ?? 0;
}

export function isValidForwardTransition(fromStage: string, toStage: string): boolean {
  if (fromStage === toStage) return false;
  const fromOrder = getDealStageOrder(fromStage);
  const toOrder = getDealStageOrder(toStage);
  if (fromOrder === 0 || toOrder === 0) return false;
  return toOrder > fromOrder;
}

export function isTerminalStage(stage: string): boolean {
  return TERMINAL_STAGES.has(stage);
}

export function isActivePipelineStage(stage: string): boolean {
  return ACTIVE_PIPELINE_STAGES.has(stage);
}

export function getProbability(stage: string): number {
  return DEAL_STAGE_PROBABILITY[stage] ?? 10;
}
