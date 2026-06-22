import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    // Convex Auth required/standard fields
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
    role: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    authProvider: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  })
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
    assignedTo: v.optional(v.id("users")),
    value: v.optional(v.number()),
    score: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_source", ["source"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_createdAt", ["createdAt"]),

  contacts: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.string(),
    jobTitle: v.optional(v.string()),
    status: v.string(),
    tags: v.array(v.string()),
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
    .index("by_createdAt", ["createdAt"]),

  companies: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  deals: defineTable({
    title: v.string(),
    value: v.number(),
    status: v.string(),
    stage: v.string(),
    company: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  tasks: defineTable({
    title: v.string(),
    dueDate: v.number(),
    status: v.string(),
    priority: v.string(),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dueDate", ["dueDate"])
    .index("by_status", ["status"]),

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
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId", "read"]),

  activities: defineTable({
    type: v.string(),
    description: v.string(),
    userId: v.optional(v.id("users")),
    userName: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});

