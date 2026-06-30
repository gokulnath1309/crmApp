export interface User {
  _id: string;
  clerkId?: string;
  email: string;
  name: string;
  role: string;
  managerId?: string;
  department?: string;
  jobFunction?: string;
  permissions?: string[];
  isActive?: boolean;
  lastLogin?: number;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
  emailVerified?: boolean;
  coverImage?: string;
  company?: string;
  workspaceName?: string;
  location?: string;
  timezone?: string;
  bio?: string;
  jobTitle?: string;
  phone?: string;
  workspaceId?: string;
  activeWorkspaceId?: string;
  membershipId?: string;
  isOwner?: boolean;
}

export interface WorkspaceMember {
  _id: string;
  userId: string;
  workspaceId: string;
  role: string;
  permissions?: string[];
  department?: string;
  jobTitle?: string;
  managerId?: string;
  status: string;
  joinedAt: number;
  createdAt: number;
}

export interface WorkspaceInfo {
  membershipId: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  isActive: boolean;
  clerkOrgId?: string;
}

export type PlanId = "basic" | "professional" | "enterprise";
export type BillingCycle = "monthly" | "annual";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export interface PlanLimits {
  maxUsers: number;
  maxWorkspaces: number;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavingsPercent: number;
  limits: PlanLimits;
}

export interface WorkspaceSubscription {
  plan: PlanId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  maxUsers: number;
  maxWorkspaces: number;
  currentUsers: number;
  assignedAt: number;
  updatedAt: number;
  futureBillingProvider?: string;
  futureSubscriptionId?: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatarUrl?: string;
  isActive: boolean;
  joinedAt: number;
}

export interface TeamLead {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Team {
  _id: string;
  workspaceId?: string;
  organizationId?: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  department: string;
  teamLeadId?: string;
  teamLead?: TeamLead | null;
  createdBy?: string;
  owner?: { _id: string; name: string; email: string } | null;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  memberCount: number;
  members?: TeamMember[];
}

export interface TeamMetrics {
  totalLeads: number;
  openLeads: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  totalRevenue: number;
  totalTasks: number;
  pendingTasks: number;
  memberCount: number;
}

export interface TeamDashboardMetrics {
  totalTeams: number;
  largestTeam: { _id: string; name: string; memberCount: number } | null;
  recentlyActiveTeam: { _id: string; name: string; updatedAt: number } | null;
  averageMembers: number;
  totalRevenueByTeam: { teamId: string; name: string; color: string; revenue: number }[];
  pipelineValueByTeam: { teamId: string; name: string; color: string; pipelineValue: number }[];
  teams: {
    _id: string;
    name: string;
    color: string;
    memberCount: number;
    openLeads: number;
    openDeals: number;
    revenue: number;
    pipelineValue: number;
    updatedAt: number;
  }[];
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatarUrl?: string;
  isActive: boolean;
  jobTitle?: string;
}

export interface AuthResponse {
  userId: string;
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ─── Task Types ───────────────────────────────────────────────────────────────

export interface Task {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  dueDate: number;
  status: "Pending" | "In Progress" | "Blocked" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  createdBy?: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedTeamId?: string;
  workspaceId?: string;
  organizationId?: string;
  leadId?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  projectId?: string;
  teamId?: string;
  departmentId?: string;
  tags?: string[];
  updatedBy?: string;
  completedBy?: string;
  deletedBy?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  deletedAt?: number;
  assignedAt?: number;
}

export interface TaskHistory {
  _id: string;
  _creationTime: number;
  taskId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  userName?: string;
  timestamp: number;
  workspaceId?: string;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  statuses?: string[];
  priority?: string;
  priorities?: string[];
  assignedTo?: string;
  createdBy?: string;
  assignedBy?: string;
  completedBy?: string;
  updatedBy?: string;
  leadId?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  teamId?: string;
  departmentId?: string;
  tags?: string[];
  dateField?: "dueDate" | "createdAt" | "completedAt" | "updatedAt";
  datePreset?: string;
  dateStart?: number;
  dateEnd?: number;
  overdue?: boolean;
  unassigned?: boolean;
  viewCompleted?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TaskListResult {
  tasks: Task[];
  nextCursor: string | null;
  totalCount: number;
}

export interface TaskDashboardMetrics {
  totalTasks: number;
  pending: number;
  inProgress: number;
  blocked: number;
  completed: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  avgCompletionTime: number;
  employeeWorkload: { userId: string; count: number }[];
  tasksPerTeam: { teamId: string; count: number }[];
  trend: { created: number; completed: number };
}

export interface EmployeeWorkload {
  employeeId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  avgCompletionTime: number;
  currentWorkload: number;
}

export interface ExportTask {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  assignedToEmail: string;
  createdBy: string;
  completedBy: string;
  createdAt: number;
  dueDate: number;
  completedAt: number;
  tags: string;
  workspaceId: string;
}
