import type { Id, Doc } from "./_generated/dataModel";

type Ctx = { db: any };

// ─── Role Hierarchy ─────────────────────────────────────────────────────────
export const ROLE_HIERARCHY: Record<string, number> = {
  employee: 0,
  support: 0,
  marketing: 0,
  sales_rep: 0,
  admin: 1,
  super_admin: 2,
};

export function roleAtLeast(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

// ─── Job Function Helpers ──────────────────────────────────────────────────
export function getJobFunction(user: { jobFunction?: string | null }): string {
  return user.jobFunction || "sales";
}

export function isMarketing(user: { role?: string; jobFunction?: string | null }): boolean {
  return user.role === "marketing" || getJobFunction(user) === "marketing";
}

export function isSupport(user: { role?: string; jobFunction?: string | null }): boolean {
  return user.role === "support" || getJobFunction(user) === "support";
}

// ─── Permission Check ───────────────────────────────────────────────────────
export function hasPermission(
  user: { role?: string; permissions?: string[]; isActive?: boolean } | null,
  permission: string
): boolean {
  if (!user || user.isActive === false) return false;
  const role = user.role || "employee";

  if (role === "super_admin") return true;

  if (user.permissions?.includes(permission)) return true;

  const rolePermissions: Record<string, string[]> = {
    admin: [
      "canInviteUsers",
      "canManageEmployees",
      "canManageTeams",
      "canAssignLeads",
      "canAssignDeals",
      "canAssignTasks",
      "canCreateLeads",
      "canCreateDeals",
      "canCreateContacts",
      "canViewAllData",
      "canManageSettings",
    ],
    sales_rep: [
      "canCreateLeads",
      "canCreateContacts",
      "canCreateDeals",
      "canViewAssignedLeads",
      "canViewAssignedDeals",
      "canViewAssignedTasks",
      "canUpdateOwnStatuses",
    ],
    marketing: [
      "canCreateLeads",
      "canViewAllData",
      "canAssignLeads",
    ],
    support: [
      "canViewAllData",
    ],
    employee: [
      "canViewAssignedTasks",
      "canUpdateOwnStatuses",
    ],
  };

  return rolePermissions[role]?.includes(permission) || false;
}

// ─── User Helper ────────────────────────────────────────────────────────────
async function getEffectiveUser(ctx: Ctx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || user.isActive === false) return null;
  return user;
}

// ─── Subordinate Helper ─────────────────────────────────────────────────────
export async function getSubordinateIds(ctx: Ctx, userId: Id<"users">): Promise<Set<Id<"users">>> {
  const subs = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("managerId"), userId))
    .collect();
  return new Set(subs.map((s: any) => s._id));
}

// ─── DATA ACCESS HELPERS ────────────────────────────────────────────────────

// ─── DATA ACCESS HELPERS ────────────────────────────────────────────────────

export async function canAccessLead(
  ctx: Ctx,
  userId: Id<"users">,
  leadIdOrLead: Id<"leads"> | Doc<"leads">
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  const workspaceId = user?.activeWorkspaceId;
  if (!user || !workspaceId) return false;

  const lead = typeof leadIdOrLead === "string" ? await ctx.db.get(leadIdOrLead) : leadIdOrLead;
  if (!lead) return false;

  if (lead.workspaceId !== workspaceId) return false;

  if (hasPermission(user, "canViewAllData")) return true;

  if (lead.assignedTo === userId || lead.createdBy === userId || lead.ownerId === userId) return true;

  return false;
}

export async function canAccessContact(
  ctx: Ctx,
  userId: Id<"users">,
  contactIdOrContact: Id<"contacts"> | Doc<"contacts">
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  const workspaceId = user?.activeWorkspaceId;
  if (!user || !workspaceId) return false;

  const contact = typeof contactIdOrContact === "string" ? await ctx.db.get(contactIdOrContact) : contactIdOrContact;
  if (!contact) return false;

  if (contact.workspaceId !== workspaceId) return false;

  if (hasPermission(user, "canViewAllData")) return true;

  if (contact.assignedTo === userId || contact.createdBy === userId || contact.ownerId === userId) return true;

  return false;
}

export async function canAccessDeal(
  ctx: Ctx,
  userId: Id<"users">,
  dealIdOrDeal: Id<"deals"> | Doc<"deals">
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  const workspaceId = user?.activeWorkspaceId;
  if (!user || !workspaceId) return false;

  const deal = typeof dealIdOrDeal === "string" ? await ctx.db.get(dealIdOrDeal) : dealIdOrDeal;
  if (!deal) return false;

  if (deal.workspaceId !== workspaceId) return false;

  if (hasPermission(user, "canViewAllData")) return true;

  if (deal.assignedTo === userId || deal.createdBy === userId || deal.ownerId === userId) return true;

  return false;
}

export async function canAccessTask(
  ctx: Ctx,
  userId: Id<"users">,
  taskIdOrTask: Id<"tasks"> | Doc<"tasks">
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  const workspaceId = user?.activeWorkspaceId;
  if (!user || !workspaceId) return false;

  const task = typeof taskIdOrTask === "string" ? await ctx.db.get(taskIdOrTask) : taskIdOrTask;
  if (!task) return false;

  if (task.workspaceId !== workspaceId) return false;

  if (hasPermission(user, "canViewAllData")) return true;

  if (task.assignedTo === userId || task.createdBy === userId) return true;

  return false;
}

// ─── ASSIGNMENT PERMISSIONS ─────────────────────────────────────────────────

export async function canAssignTask(
  ctx: Ctx,
  userId: Id<"users">,
  assignToId: Id<"users"> | undefined
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  if (hasPermission(user, "canAssignTasks")) return true;
  if (!assignToId) return true;
  if (userId === assignToId) return true;
  return false;
}

export async function canAssignLead(
  ctx: Ctx,
  userId: Id<"users">,
  assignToId: Id<"users"> | undefined
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  if (hasPermission(user, "canAssignLeads")) return true;
  if (!assignToId) return true;
  if (userId === assignToId) return true;
  return false;
}

export async function canAssignDeal(
  ctx: Ctx,
  userId: Id<"users">,
  assignToId: Id<"users"> | undefined
): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  if (hasPermission(user, "canAssignDeals")) return true;
  if (!assignToId) return true;
  if (userId === assignToId) return true;
  return false;
}

// ─── VIEW/CREATE/EDIT/DELETE PERMISSION HELPERS ────────────────────────────

export async function canViewLead(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canViewAllData") || hasPermission(user, "canViewAssignedLeads");
}

export async function canCreateLead(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canCreateLeads");
}

export async function canEditLead(ctx: Ctx, userId: Id<"users">, lead: Doc<"leads">): Promise<boolean> {
  return canAccessLead(ctx, userId, lead);
}

export async function canDeleteLead(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return user.role === "super_admin";
}

export async function canViewContact(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return true;
}

export async function canCreateContact(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canCreateContacts");
}

export async function canEditContact(ctx: Ctx, userId: Id<"users">, contact: Doc<"contacts">): Promise<boolean> {
  return canAccessContact(ctx, userId, contact);
}

export async function canViewDeal(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canViewAllData") || hasPermission(user, "canViewAssignedDeals");
}

export async function canCreateDeal(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canCreateDeals");
}

export async function canEditDeal(ctx: Ctx, userId: Id<"users">, deal: Doc<"deals">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return canAccessDeal(ctx, userId, deal);
}

export async function canManageUsers(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canManageEmployees");
}

export async function canViewReports(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return hasPermission(user, "canViewAllData");
}

export async function canViewReport(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  return canViewReports(ctx, userId);
}

export async function canEditProfile(ctx: Ctx, userId: Id<"users">, targetUserId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user) return false;
  return userId === targetUserId || user.role === "super_admin";
}

export async function canInviteUsers(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user || user.isActive === false) return false;
  return hasPermission(user, "canInviteUsers");
}

export async function canManageRoles(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user || user.isActive === false) return false;
  return user.role === "super_admin";
}

export async function canAssignTasks(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user || user.isActive === false) return false;
  return hasPermission(user, "canAssignTasks");
}

export async function canAssignLeads(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user || user.isActive === false) return false;
  return hasPermission(user, "canAssignLeads");
}

export async function canManageEmployees(ctx: Ctx, userId: Id<"users">): Promise<boolean> {
  const user = await getEffectiveUser(ctx, userId);
  if (!user || user.isActive === false) return false;
  return hasPermission(user, "canManageEmployees");
}

export function canEditField(fieldName: string, currentUserRole: string): boolean {
  if (currentUserRole === "super_admin") return true;

  const employeeFields = [
    "name",
    "phone",
    "location",
    "timezone",
    "bio",
    "image",
    "coverImage",
    "avatarUrl",
    "company",
    "jobTitle",
  ];

  if (currentUserRole === "admin") {
    const adminFields = [
      ...employeeFields,
      "department",
      "jobTitle",
      "managerId",
      "isActive",
    ];
    return adminFields.includes(fieldName);
  }

  // sales_rep, marketing, support, employee
  return employeeFields.includes(fieldName);
}
