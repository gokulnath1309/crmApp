export interface User {
  role?: string;
  permissions?: string[];
  isActive?: boolean;
  isOwner?: boolean;
  workspaceId?: string;
}

export interface PermissionSet {
  canInviteUsers: boolean;
  canManageEmployees: boolean;
  canManageTeams: boolean;
  canCreateTeam: boolean;
  canDeleteTeam: boolean;
  canArchiveTeam: boolean;
  canAssignLeads: boolean;
  canAssignDeals: boolean;
  canAssignTasks: boolean;
  canCreateLeads: boolean;
  canCreateDeals: boolean;
  canCreateContacts: boolean;
  canViewAllData: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
}

export function getPermissions(user: User | null | undefined): PermissionSet {
  const fallback: PermissionSet = {
    canInviteUsers: false,
    canManageEmployees: false,
    canManageTeams: false,
    canCreateTeam: false,
    canDeleteTeam: false,
    canArchiveTeam: false,
    canAssignLeads: false,
    canAssignDeals: false,
    canAssignTasks: false,
    canCreateLeads: false,
    canCreateDeals: false,
    canCreateContacts: false,
    canViewAllData: false,
    canManageSettings: false,
    canManageBilling: false,
  };

  if (!user || user.isActive === false) return fallback;

  const role = user.role || "employee";
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const isSalesRep = role === "sales_rep" || role === "employee";
  const isMarketing = role === "marketing";

  // Check explicit permission overrides
  const hasOverride = (perm: string) => user.permissions?.includes(perm) || false;

  return {
    canInviteUsers: isSuperAdmin || isAdmin || hasOverride("canInviteUsers"),
    canManageEmployees: isSuperAdmin || isAdmin || hasOverride("canManageEmployees"),
    canManageTeams: isSuperAdmin || isAdmin || hasOverride("canManageTeams"),
    canCreateTeam: isSuperAdmin || isAdmin || hasOverride("canCreateTeam"),
    canDeleteTeam: isSuperAdmin || hasOverride("canDeleteTeam"),
    canArchiveTeam: isSuperAdmin || isAdmin || hasOverride("canArchiveTeam"),
    canAssignLeads: isSuperAdmin || isAdmin || isMarketing || hasOverride("canAssignLeads"),
    canAssignDeals: isSuperAdmin || isAdmin || hasOverride("canAssignDeals"),
    canAssignTasks: isSuperAdmin || isAdmin || hasOverride("canAssignTasks"),
    canCreateLeads: isSuperAdmin || isAdmin || isSalesRep || isMarketing || hasOverride("canCreateLeads"),
    canCreateDeals: isSuperAdmin || isAdmin || isSalesRep || hasOverride("canCreateDeals"),
    canCreateContacts: isSuperAdmin || isAdmin || isSalesRep || hasOverride("canCreateContacts"),
    canViewAllData: isSuperAdmin || isAdmin || isMarketing || hasOverride("canViewAllData"),
    canManageSettings: isSuperAdmin || isAdmin || hasOverride("canManageSettings"),
    canManageBilling: isSuperAdmin && !!user.isOwner,
  };
}
