import { type MutationCtx } from "../_generated/server";
import { type Id } from "../_generated/dataModel";

const NOTIFICATION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

function buildActionUrl(type: string, entityId: string): string {
  switch (type) {
    case "lead_assigned":
    case "lead_status_changed":
    case "lead_converted":
    case "lead_marked_lost":
    case "lead_marked_unqualified":
    case "lead_reopened":
    case "lead_merged":
      return `/leads/${entityId}`;
    case "deal_assigned":
    case "deal_stage_changed":
    case "deal_won":
    case "deal_lost":
      return `/deals/${entityId}`;
    case "task_assigned":
    case "task_completed":
    case "task_overdue":
      return `/tasks/${entityId}`;
    case "role_changed":
      return `/profile`;
    default:
      return `/notifications`;
  }
}

function getPriority(type: string): string {
  switch (type) {
    case "deal_won":
    case "deal_lost":
    case "task_overdue":
      return NOTIFICATION_PRIORITY.HIGH;
    case "deal_assigned":
    case "lead_converted":
    case "lead_marked_lost":
    case "lead_marked_unqualified":
    case "lead_reopened":
    case "lead_merged":
      return NOTIFICATION_PRIORITY.MEDIUM;
    default:
      return NOTIFICATION_PRIORITY.LOW;
  }
}

function getTitle(type: string, _entityName?: string): string {
  switch (type) {
    case "lead_assigned":
      return "Lead Assigned";
    case "lead_status_changed":
      return "Lead Status Updated";
    case "lead_converted":
      return "Lead Converted to Deal";
    case "lead_marked_lost":
      return "Lead Marked Lost";
    case "lead_marked_unqualified":
      return "Lead Marked Unqualified";
    case "lead_reopened":
      return "Lead Reopened";
    case "lead_merged":
      return "Duplicate Lead Merged";
    case "deal_assigned":
      return "Deal Assigned";
    case "deal_stage_changed":
      return "Deal Stage Changed";
    case "deal_won":
      return "Deal Won!";
    case "deal_lost":
      return "Deal Lost";
    case "task_assigned":
      return "Task Assigned";
    case "task_completed":
      return "Task Completed";
    case "task_overdue":
      return "Task Overdue!";
    case "user_invited":
      return "New Team Member";
    case "role_changed":
      return "Role Updated";
    case "contact_created":
      return "Contact Created";
    case "system":
      return "System Notification";
    default:
      return "Notification";
  }
}

function getMessage(type: string, details: {
  entityName?: string;
  userName?: string;
  role?: string;
  status?: string;
  stage?: string;
}): string {
  const name = details.entityName || "Item";
  const user = details.userName || "Someone";
  switch (type) {
    case "lead_assigned":
      return `Lead "${name}" has been assigned to you.`;
    case "lead_status_changed":
      return `Lead "${name}" status changed to ${details.status || "updated"}.`;
    case "lead_converted":
      return `Lead "${name}" has been converted to a deal.`;
    case "lead_marked_lost":
      return `Lead "${name}" was marked as Lost by ${user}.`;
    case "lead_marked_unqualified":
      return `Lead "${name}" was marked as Unqualified by ${user}.`;
    case "lead_reopened":
      return `Lead "${name}" has been reopened by ${user}.`;
    case "lead_merged":
      return `Duplicate lead "${name}" was merged by ${user}.`;
    case "deal_assigned":
      return `Deal "${name}" has been assigned to you.`;
    case "deal_stage_changed":
      return `Deal "${name}" moved to stage "${details.stage || name}".`;
    case "deal_won":
      return `Congratulations! Deal "${name}" has been closed as Won.`;
    case "deal_lost":
      return `Deal "${name}" has been closed as Lost.`;
    case "task_assigned":
      return `Task "${name}" has been assigned to you.`;
    case "task_completed":
      return `Task "${name}" has been completed.`;
    case "task_overdue":
      return `Task "${name}" is overdue. Please take action.`;
    case "user_invited":
      return `${user} has joined the team.`;
    case "role_changed":
      return `Your role has been changed to ${details.role || "updated"}.`;
    case "contact_created":
      return `Contact "${name}" has been created.`;
    default:
      return `Update: ${name}`;
  }
}

function getIconAndColor(type: string): { icon: string; color: string } {
  switch (type) {
    case "deal_won":
      return { icon: "Award", color: "green" };
    case "deal_lost":
      return { icon: "Briefcase", color: "red" };
    case "deal_created":
    case "deal_assigned":
    case "deal_stage_changed":
      return { icon: "TrendingUp", color: "purple" };
    case "lead_assigned":
    case "lead_converted":
    case "lead_qualified":
      return { icon: "Target", color: "purple" };
    case "lead_lost":
    case "lead_marked_lost":
    case "lead_marked_unqualified":
      return { icon: "UserMinus", color: "red" };
    case "task_assigned":
    case "task_completed":
    case "task_overdue":
      return { icon: "CheckSquare", color: "blue" };
    case "user_invited":
    case "employee_invited":
    case "employee_joined":
      return { icon: "UserPlus", color: "blue" };
    case "role_changed":
      return { icon: "ShieldAlert", color: "orange" };
    case "security_alert":
      return { icon: "AlertTriangle", color: "red" };
    case "system":
    case "system_maintenance":
      return { icon: "Settings", color: "orange" };
    default:
      return { icon: "Bell", color: "blue" };
  }
}

export async function createNotification(
  ctx: MutationCtx,
  params: {
    userId: string;
    type: string;
    entityName?: string;
    userName?: string;
    role?: string;
    status?: string;
    stage?: string;
    entityType?: string;
    entityId?: string;
    createdBy?: string;
  },
) {
  const entityId = params.entityId || "";
  const title = getTitle(params.type, params.entityName);
  const message = getMessage(params.type, {
    entityName: params.entityName,
    userName: params.userName,
    role: params.role,
    status: params.status,
    stage: params.stage,
  });
  const priority = getPriority(params.type);
  const actionUrl = buildActionUrl(params.type, entityId);

  const user = await ctx.db.get(params.userId as Id<"users">);
  const workspaceId = user?.activeWorkspaceId;

  const { icon, color } = getIconAndColor(params.type);

  return await ctx.db.insert("notifications", {
    userId: params.userId as any,
    title,
    message,
    type: params.type,
    entityType: params.entityType || undefined,
    entityId: entityId || undefined,
    priority,
    read: false,
    actionUrl,
    createdBy: (params.createdBy || undefined) as any,
    workspaceId,
    createdAt: Date.now(),
    icon,
    color,
    pinned: false,
    archived: false,
  });
}

export async function notifyUser(
  ctx: MutationCtx,
  userId: string,
  type: string,
  opts?: {
    entityName?: string;
    userName?: string;
    role?: string;
    status?: string;
    stage?: string;
    entityType?: string;
    entityId?: string;
    createdBy?: string;
  },
) {
  return createNotification(ctx, { userId, type, ...opts });
}

export async function notifyAdmins(
  ctx: MutationCtx,
  allUsers: any[] | undefined,
  type: string,
  opts?: {
    entityName?: string;
    userName?: string;
    role?: string;
    status?: string;
    stage?: string;
    entityType?: string;
    entityId?: string;
    createdBy?: string;
  },
) {
  let users = allUsers;
  if (!users) {
    let workspaceId: any = undefined;
    if (opts?.createdBy) {
      const creator = await ctx.db.get(opts.createdBy as Id<"users">);
      workspaceId = creator?.activeWorkspaceId;
    }
    if (workspaceId) {
      const members = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspaceId", (q: any) => q.eq("workspaceId", workspaceId))
        .collect();
      const fetchedUsers = await Promise.all(members.map(m => ctx.db.get(m.userId as Id<"users">)));
      users = fetchedUsers.filter(Boolean);
    } else {
      users = await ctx.db.query("users").collect();
    }
  }
  const admins = users.filter((u: any) => u.role === "admin" || u.role === "super_admin");
  for (const admin of admins) {
    await createNotification(ctx, { userId: admin._id, type, ...opts });
  }
}

export async function notifySuperAdmins(
  ctx: MutationCtx,
  allUsers: any[] | undefined,
  type: string,
  opts?: {
    entityName?: string;
    userName?: string;
    role?: string;
    status?: string;
    stage?: string;
    entityType?: string;
    entityId?: string;
    createdBy?: string;
  },
) {
  let users = allUsers;
  if (!users) {
    let workspaceId: any = undefined;
    if (opts?.createdBy) {
      const creator = await ctx.db.get(opts.createdBy as Id<"users">);
      workspaceId = creator?.activeWorkspaceId;
    }
    if (workspaceId) {
      const members = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspaceId", (q: any) => q.eq("workspaceId", workspaceId))
        .collect();
      const fetchedUsers = await Promise.all(members.map(m => ctx.db.get(m.userId as Id<"users">)));
      users = fetchedUsers.filter(Boolean);
    } else {
      users = await ctx.db.query("users").collect();
    }
  }
  const superAdmins = users.filter((u: any) => u.role === "super_admin");
  for (const sa of superAdmins) {
    await createNotification(ctx, { userId: sa._id, type, ...opts });
  }
}
