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
    profileStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    isOwner: v.optional(v.boolean()),
    // Multi-tenant workspace fields
    activeWorkspaceId: v.optional(v.id("workspaces")),
    notificationSettings: v.optional(v.any()),
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
    assignedTeamId: v.optional(v.id("teams")),
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

    // Enterprise CRM fields
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    companySize: v.optional(v.number()),
    annualRevenue: v.optional(v.number()),
    priority: v.optional(v.string()), // Low, Medium, High
    whatsApp: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    initialNotes: v.optional(v.string()),
    customFields: v.optional(v.any()),
    companyId: v.optional(v.id("companies")),

    // Customer Discovery fields (industry-agnostic, collected during Contacted stage)
    businessType: v.optional(v.string()),       // Startup, SME, Enterprise, Government, Non-Profit, Individual
    buyingAuthority: v.optional(v.string()),    // Decision Maker, Influencer, Evaluator, End User, Unknown
    currentSituation: v.optional(v.string()),
    businessChallenges: v.optional(v.string()),
    goalsObjectives: v.optional(v.string()),
    currentProcess: v.optional(v.string()),
    painPoints: v.optional(v.string()),
    requirementsSummary: v.optional(v.string()),
    expectedOutcome: v.optional(v.string()),
    competitors: v.optional(v.string()),
    urgency: v.optional(v.string()),            // Low, Medium, High, Critical
    budgetStatus: v.optional(v.string()),       // Approved, Planned, Under Review, Unknown
    timeline: v.optional(v.string()),           // Immediately, Within 1 Month, 1–3 Months, 3–6 Months, 6+ Months, Unknown
    decisionMaker: v.optional(v.boolean()),
    decisionMakerName: v.optional(v.string()),
    decisionMakerRole: v.optional(v.string()),
    preferredCommunication: v.optional(v.string()),
    preferredContactTime: v.optional(v.string()),
    preferredFollowUpMethod: v.optional(v.string()),

    // Conversion tracking
    convertedAt: v.optional(v.number()),
    dealId: v.optional(v.id("deals")),

    // Extended lead qualification fields
    statusReason: v.optional(v.string()),
    statusNotes: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    closedBy: v.optional(v.id("users")),
    reopenedAt: v.optional(v.number()),
    reopenedBy: v.optional(v.id("users")),
    mergedIntoLeadId: v.optional(v.id("leads")),
    spamFlag: v.optional(v.boolean()),
    isClosed: v.optional(v.boolean()),
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
    companyId: v.optional(v.id("companies")),
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
    assignedTeamId: v.optional(v.id("teams")),
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
    companyId: v.optional(v.id("companies")),
  })
    .index("by_assignedTo", ["assignedTo"])
    .index("by_createdBy", ["createdBy"])
    .index("by_ownerId", ["ownerId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId", ["workspaceId"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    status: v.string(),             // "Pending" | "In Progress" | "Blocked" | "Completed" | "Cancelled"
    priority: v.string(),           // "Low" | "Medium" | "High" | "Urgent"
    createdBy: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    assignedBy: v.optional(v.id("users")),
    assignedTeamId: v.optional(v.id("teams")),
    workspaceId: v.optional(v.id("workspaces")),
    organizationId: v.optional(v.id("workspaces")),
    leadId: v.optional(v.id("leads")),
    companyId: v.optional(v.id("companies")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    projectId: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    departmentId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Ownership tracking
    updatedBy: v.optional(v.id("users")),
    completedBy: v.optional(v.id("users")),
    deletedBy: v.optional(v.id("users")),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    assignedAt: v.optional(v.number()),
  })
    .index("by_dueDate", ["dueDate"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_leadId", ["leadId"])
    .index("by_deletedAt", ["deletedAt"])
    .index("by_workspaceId_deletedAt", ["workspaceId", "deletedAt"])
    .index("by_workspaceId_status", ["workspaceId", "status"])
    .index("by_workspaceId_assignedTo", ["workspaceId", "assignedTo"])
    .index("by_workspaceId_createdBy", ["workspaceId", "createdBy"])
    .index("by_workspaceId_dueDate", ["workspaceId", "dueDate"])
    .index("by_workspaceId_updatedAt", ["workspaceId", "updatedAt"])
    .index("by_companyId", ["companyId"])
    .index("by_contactId", ["contactId"])
    .index("by_dealId", ["dealId"]),

  taskHistory: defineTable({
    taskId: v.id("tasks"),
    action: v.string(),             // "created" | "assigned" | "reassigned" | "unassigned" | "status_changed" | "priority_changed" | "due_date_changed" | "completed" | "reopened" | "deleted" | "restored" | "updated" | "field_changed"
    field: v.optional(v.string()),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    userId: v.id("users"),
    userName: v.optional(v.string()),
    timestamp: v.number(),
    workspaceId: v.optional(v.id("workspaces")),
  })
    .index("by_taskId", ["taskId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_taskId_timestamp", ["taskId", "timestamp"]),

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
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    updatedAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
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
    organizationId: v.optional(v.id("workspaces")),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    department: v.optional(v.string()),
    teamLeadId: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    archived: v.optional(v.boolean()),
  })
    .index("by_workspaceId", ["workspaceId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    employeeId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_team_employee", ["teamId", "employeeId"]),

  workspaces: defineTable({
    name: v.string(),
    industry: v.optional(v.string()),
    companySize: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    status: v.string(), // "active", "inactive"
    clerkOrgId: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_clerkOrgId", ["clerkOrgId"]),

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
    sentAt: v.optional(v.number()),
    resentAt: v.optional(v.number()),
    messageId: v.optional(v.string()),
    lastDeliveryStatus: v.optional(v.string()),
    lastDeliveryError: v.optional(v.string()),
    smtpResponse: v.optional(v.string()),
    emailStatus: v.optional(v.string()),
    emailSentAt: v.optional(v.number()),
    emailError: v.optional(v.string()),
    name: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    permissions: v.optional(v.array(v.string())),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_inviteToken", ["inviteToken"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspace_email", ["workspaceId", "email"]),

  leadStageTransitions: defineTable({
    leadId: v.id("leads"),
    fromStage: v.string(),
    toStage: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    transitionedAt: v.number(),
    data: v.any(), // stage transition answers
    workspaceId: v.id("workspaces"),
  })
    .index("by_leadId", ["leadId"])
    .index("by_workspaceId", ["workspaceId"]),

  leadActivities: defineTable({
    leadId: v.id("leads"),
    activityType: v.string(), // Phone Call, Email, WhatsApp, etc.
    userId: v.id("users"),
    userName: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    duration: v.optional(v.string()),
    summary: v.string(),
    notes: v.optional(v.string()),
    outcome: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())), // Base64 data urls
    followUpDate: v.optional(v.string()),
    reminder: v.optional(v.boolean()),
    nextAction: v.optional(v.string()),
    stageAtTime: v.string(),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
    isPinned: v.optional(v.boolean()), // Support activity pinning
    updatedAt: v.optional(v.number()), // Support activity edits
  })
    .index("by_leadId", ["leadId"])
    .index("by_workspaceId", ["workspaceId"]),

  leadReminders: defineTable({
    leadId: v.id("leads"),
    userId: v.id("users"),
    userName: v.string(),
    title: v.string(),
    dueDate: v.number(), // timestamp
    isCompleted: v.boolean(),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
  })
    .index("by_leadId", ["leadId"])
    .index("by_userId", ["userId"])
    .index("by_dueDate", ["dueDate"])
    .index("by_workspaceId", ["workspaceId"]),

  leadAttachments: defineTable({
    leadId: v.id("leads"),
    stage: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    fileUrl: v.optional(v.string()), // base64 string (legacy)
    category: v.optional(v.string()),
    duration: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    uploadedBy: v.id("users"),
    workspaceId: v.id("workspaces"),
    storageKey: v.optional(v.string()),
    storageId: v.optional(v.string()),
    size: v.optional(v.number()),
    createdAt: v.number(),
    uploadedAt: v.optional(v.number()),

    // Future AI support fields (optional, non-blocking)
    transcription: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    actionItems: v.optional(v.array(v.string())),
    sentimentScore: v.optional(v.number()),
    detectedObjections: v.optional(v.array(v.string())),
    speakerSegments: v.optional(v.array(
      v.object({
        speaker: v.string(),
        startTime: v.number(),
        endTime: v.number(),
      })
    )),
  })
    .index("by_leadId", ["leadId"])
    .index("by_workspaceId", ["workspaceId"]),

  customFields: defineTable({
    label: v.string(),
    name: v.string(),
    type: v.string(),
    options: v.optional(v.array(v.string())),
    required: v.boolean(),
    stage: v.string(),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_stage", ["workspaceId", "stage"]),

  emails: defineTable({
    leadId: v.id("leads"),
    from: v.string(),
    to: v.array(v.string()),
    subject: v.string(),
    body: v.string(),
    sentAt: v.number(),
    status: v.string(), // "sent" | "draft" | "failed"
    workspaceId: v.id("workspaces"),
  }).index("by_leadId", ["leadId"]),

  meetings: defineTable({
    leadId: v.id("leads"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()), // Video link or address
    outcome: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
  }).index("by_leadId", ["leadId"]),

  noteVersions: defineTable({
    noteId: v.id("notes"),
    body: v.string(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_noteId", ["noteId"]),

  companies: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    status: v.optional(v.string()), // Prospect, Active, Customer, Partner, Inactive
    workspaceId: v.optional(v.id("workspaces")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Legacy fields for backward compatibility
    employeeCount: v.optional(v.number()),
    ownerUserId: v.optional(v.string()),
    plan: v.optional(v.string()),
    slug: v.optional(v.string()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_name", ["name"]),

  events: defineTable({
    workspaceId: v.id("workspaces"),
    ownerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(), // Meeting, Call, Follow-up, Task, Demo, Presentation, Site Visit, Training, Personal, Holiday, Other
    relatedType: v.optional(v.string()), // lead, contact, company, deal
    relatedId: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    start: v.number(),
    end: v.number(),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    locationType: v.optional(v.string()), // Office, Customer Address, Hotel, Online, Custom
    meetingLink: v.optional(v.string()),
    meetingProvider: v.optional(v.string()), // google_meet, zoom, teams, custom
    priority: v.optional(v.string()), // Low, Medium, High, Urgent
    reminder: v.optional(v.string()), // None, 5 min, 10 min, 15 min, 30 min, 1 hour, 2 hours, 1 day
    repeat: v.optional(v.string()), // None, Daily, Weekly, Monthly, Yearly, Custom
    color: v.optional(v.string()),
    status: v.optional(v.string()), // Scheduled, Completed, Cancelled, Missed, Rescheduled
    guests: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_ownerId", ["ownerId"])
    .index("by_start", ["start"])
    .index("by_status", ["status"])
    .index("by_eventType", ["eventType"]),
});
