import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),

    // Custom / Legacy password auth fields (made optional for OAuth users)
    passwordHash: v.optional(v.string()),
    salt: v.optional(v.string()),
    authToken: v.optional(v.string()),
    role: v.optional(v.string()), // Legacy: kept for backward compat
    managerId: v.optional(v.id("users")),
    department: v.optional(v.string()),
    jobFunction: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    lastLogin: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    authProvider: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    otpRequestTimestamps: v.optional(v.array(v.number())),
    coverImage: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    timezone: v.optional(v.string()),
    bio: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    isOwner: v.optional(v.boolean()),
    // Multi-tenant workspace fields
    activeWorkspaceId: v.optional(v.id("workspaces")),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_authToken", ["authToken"]),

  emailOtps: defineTable({
    email: v.string(),
    otp: v.string(),
    expiresAt: v.number(),
    verified: v.boolean(),
    createdAt: v.number(),
    pendingName: v.optional(v.string()),
    pendingPasswordHash: v.optional(v.string()),
    pendingSalt: v.optional(v.string()),
  }).index("email", ["email"]),

  passwordResetTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),

  leads: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    source: v.string(),
    createdBy: v.optional(v.id("users")),
    ownerId: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    score: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Status workflow tracking fields
    statusChangedAt: v.optional(v.number()),
    statusChangedBy: v.optional(v.string()),
    unqualifiedReason: v.optional(v.string()),
    unqualifiedNotes: v.optional(v.string()),
    unqualifiedAt: v.optional(v.number()),
    lostReason: v.optional(v.string()),
    lostNotes: v.optional(v.string()),
    lostAt: v.optional(v.number()),
    requalifiedAt: v.optional(v.number()),
    requalifiedBy: v.optional(v.string()),
    requalificationReason: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_source", ["source"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_createdBy", ["createdBy"])
    .index("by_ownerId", ["ownerId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_unqualified", ["unqualifiedAt"])
    .index("by_lost", ["lostAt"])
    .index("by_workspaceId", ["workspaceId"]),

  contacts: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    tags: v.array(v.string()),
    createdBy: v.optional(v.id("users")),
    ownerId: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
    createdAt: v.number(),
    updatedAt: v.number(),
    workPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    department: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_createdBy", ["createdBy"])
    .index("by_ownerId", ["ownerId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId", ["workspaceId"]),

  deals: defineTable({
    title: v.string(),
    value: v.number(),
    status: v.string(), // "Pipeline", "Won", "Lost"
    stage: v.string(), // "Prospecting", "Qualification", "Proposal", "Negotiation", "Verbal Commit", "Closed Won", "Closed Lost"
    company: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    ownerId: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Linked entities
    leadId: v.optional(v.id("leads")),
    workspaceId: v.optional(v.id("workspaces")),
    contactId: v.optional(v.id("contacts")),

    // Pipeline tracking
    probability: v.optional(v.number()),
    currency: v.optional(v.string()),
    stageChangedAt: v.optional(v.number()),
    stageChangedBy: v.optional(v.string()),
    lostReason: v.optional(v.string()),
    lostNotes: v.optional(v.string()),
  })
    .index("by_assignedTo", ["assignedTo"])
    .index("by_createdBy", ["createdBy"])
    .index("by_ownerId", ["ownerId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId", ["workspaceId"]),

  tasks: defineTable({
    title: v.string(),
    dueDate: v.number(),
    status: v.string(),
    priority: v.string(),
    createdBy: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dueDate", ["dueDate"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_workspaceId", ["workspaceId"]),

  notes: defineTable({
    body: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_entity", ["entityType", "entityId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    priority: v.optional(v.string()),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    workspaceId: v.optional(v.id("workspaces")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_created", ["createdAt"])
    .index("by_workspaceId", ["workspaceId"]),

  activities: defineTable({
    type: v.string(),
    description: v.string(),
    userId: v.optional(v.id("users")),
    userName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    workspaceId: v.optional(v.id("workspaces")),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId", ["workspaceId"]),

  teams: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    managerId: v.optional(v.id("users")),
    memberIds: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"]),

  workspaces: defineTable({
    name: v.string(),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    status: v.string(), // "active", "inactive"
  })
    .index("by_name", ["name"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    clerkUserId: v.string(),
    userId: v.id("users"), // We need this to link internally
    role: v.string(), // "SUPER_ADMIN", "ADMIN", "EMPLOYEE"
    department: v.optional(v.string()),
    status: v.string(), // "active", "inactive"
    joinedAt: v.number(),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_userId", ["userId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_user_workspace", ["userId", "workspaceId"]),

  workspaceInvitations: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.string(), // "SUPER_ADMIN", "ADMIN", "EMPLOYEE"
    department: v.optional(v.string()),
    invitedBy: v.id("users"),
    inviteToken: v.string(),
    status: v.string(), // "pending", "accepted", "expired", "revoked"
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_inviteToken", ["inviteToken"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspace_email", ["workspaceId", "email"]),
});
