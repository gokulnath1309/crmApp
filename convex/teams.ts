import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveUser, resolveUserReadOnly } from "./lib/getCurrentUser";
import { hasPermission } from "./rbac";

function formatTeam(team: any) {
  return {
    _id: team._id,
    workspaceId: team.workspaceId,
    organizationId: team.organizationId,
    name: team.name,
    description: team.description ?? "",
    color: team.color ?? "#6366f1",
    icon: team.icon ?? "Users",
    department: team.department ?? "",
    teamLeadId: team.teamLeadId,
    createdBy: team.createdBy,
    createdAt: team.createdAt ?? team._creationTime,
    updatedAt: team.updatedAt ?? team._creationTime,
    archived: team.archived ?? false,
  };
}

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    const allTeams = await ctx.db
      .query("teams")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    let teams = allTeams.filter((t) => {
      if (args.includeArchived) return true;
      return !t.archived;
    });

    const canViewAll = hasPermission(currentUser, "canViewAllData");
    if (!canViewAll) {
      const myMemberEntries = await ctx.db
        .query("teamMembers")
        .withIndex("by_employeeId", (q) => q.eq("employeeId", currentUser._id))
        .collect();
      const myTeamIds = new Set(myMemberEntries.map((m) => m.teamId));
      teams = teams.filter((t) => myTeamIds.has(t._id) || t.teamLeadId === currentUser._id || t.createdBy === currentUser._id);
    }

    const teamsWithMeta = await Promise.all(
      teams.map(async (t) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_teamId", (q) => q.eq("teamId", t._id))
          .collect();

        const memberCount = members.length;

        let teamLead = null;
        if (t.teamLeadId) {
          const lead = await ctx.db.get(t.teamLeadId);
          if (lead) {
            teamLead = {
              _id: lead._id,
              name: lead.name ?? "Unknown",
              email: lead.email ?? "",
              avatarUrl: lead.image ?? lead.avatarUrl,
            };
          }
        }

        return {
          ...formatTeam(t),
          memberCount,
          teamLead,
        };
      })
    );

    return teamsWithMeta.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (team.workspaceId !== workspaceId) return null;

    const canViewAll = hasPermission(currentUser, "canViewAllData");
    if (!canViewAll) {
      const isMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_employee", (q) =>
          q.eq("teamId", team._id).eq("employeeId", currentUser._id)
        )
        .first();
      if (!isMember && team.teamLeadId !== currentUser._id && team.createdBy !== currentUser._id) {
        return null;
      }
    }

    const memberEntries = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
      .collect();

    const members = await Promise.all(
      memberEntries.map(async (me) => {
        const emp = await ctx.db.get(me.employeeId);
        if (!emp) return null;
        const membership = await ctx.db
          .query("workspaceMembers")
          .withIndex("by_user_workspace", (q) =>
            q.eq("userId", emp._id).eq("workspaceId", workspaceId)
          )
          .first();
        return {
          _id: emp._id,
          name: emp.name ?? "Unknown",
          email: emp.email ?? "",
          role: membership?.role?.toLowerCase() ?? emp.role ?? "employee",
          department: membership?.department ?? emp.department ?? "",
          avatarUrl: emp.image ?? emp.avatarUrl,
          isActive: membership ? membership.status === "active" : (emp.isActive ?? true),
          joinedAt: me.joinedAt,
        };
      })
    );

    let owner = null;
    if (team.createdBy) {
      const creator = await ctx.db.get(team.createdBy);
      if (creator) {
        owner = { _id: creator._id, name: creator.name ?? "Unknown", email: creator.email ?? "" };
      }
    }

    let teamLead = null;
    if (team.teamLeadId) {
      const lead = await ctx.db.get(team.teamLeadId);
      if (lead) {
        teamLead = {
          _id: lead._id,
          name: lead.name ?? "Unknown",
          email: lead.email ?? "",
          avatarUrl: lead.image ?? lead.avatarUrl,
        };
      }
    }

    return {
      ...formatTeam(team),
      owner,
      teamLead,
      members: members.filter(Boolean),
      memberCount: members.filter(Boolean).length,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    department: v.optional(v.string()),
    teamLeadId: v.optional(v.id("users")),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user || user.isActive === false) throw new Error("Not authenticated");

    const workspaceId = user.activeWorkspaceId || user.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    if (!hasPermission(user, "canManageTeams")) {
      throw new Error("Permission denied: cannot create teams");
    }

    const name = args.name.trim();
    if (name.length < 3 || name.length > 50) {
      throw new Error("Team name must be between 3 and 50 characters");
    }

    const existing = await ctx.db
      .query("teams")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("name"), name))
      .first();

    if (existing) {
      throw new Error("A team with this name already exists");
    }

    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      workspaceId,
      name,
      description: args.description ?? "",
      color: args.color ?? "#6366f1",
      icon: args.icon ?? "Users",
      department: args.department ?? "",
      teamLeadId: args.teamLeadId,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
      archived: false,
    });

    // Collect all employees already assigned to any team for validation
    const allTeamMembers = await ctx.db.query("teamMembers").collect();
    const assignedSet = new Set(allTeamMembers.map((m) => m.employeeId));

    // Verify workspace membership for validation
    const wsMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const activeWsMemberIds = new Set(
      wsMembers.filter((m) => m.status === "active").map((m) => m.userId)
    );

    const conflicts: string[] = [];

    const insertMember = async (employeeId: Id<"users">) => {
      if (!activeWsMemberIds.has(employeeId)) {
        const emp = await ctx.db.get(employeeId);
        conflicts.push(`${emp?.name ?? "Unknown"}: not an active employee`);
        return;
      }
      if (assignedSet.has(employeeId) && employeeId !== args.teamLeadId) {
        const emp = await ctx.db.get(employeeId);
        conflicts.push(`${emp?.name ?? "Unknown"}: already assigned to another team`);
        return;
      }
      await ctx.db.insert("teamMembers", { teamId, employeeId, joinedAt: now });
      assignedSet.add(employeeId);
    };

    if (args.memberIds && args.memberIds.length > 0) {
      const uniqueIds = [...new Set(args.memberIds)];
      for (const employeeId of uniqueIds) {
        if (employeeId === args.teamLeadId) continue;
        await insertMember(employeeId);
      }
    }

    if (args.teamLeadId) {
      const isAlreadyMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_employee", (q) =>
          q.eq("teamId", teamId).eq("employeeId", args.teamLeadId!)
        )
        .first();
      if (!isAlreadyMember) {
        await ctx.db.insert("teamMembers", {
          teamId,
          employeeId: args.teamLeadId!,
          joinedAt: now,
        });
      }
    }

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "team_created",
      description: `Created team "${name}"`,
      userId: user._id,
      userName: user.name || "System",
      entityType: "team",
      entityId: teamId,
      workspaceId,
    });

    return { teamId };
  },
});

export const update = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    department: v.optional(v.string()),
    teamLeadId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user || user.isActive === false) throw new Error("Not authenticated");

    const workspaceId = user.activeWorkspaceId || user.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const team = await ctx.db.get(args.teamId);
    if (!team || team.workspaceId !== workspaceId) throw new Error("Team not found");

    if (!hasPermission(user, "canManageTeams") && team.teamLeadId !== user._id) {
      throw new Error("Permission denied");
    }

    const patch: Record<string, any> = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length < 3 || name.length > 50) throw new Error("Team name must be between 3 and 50 characters");

      const duplicate = await ctx.db
        .query("teams")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .filter((q) => q.and(q.eq(q.field("name"), name), q.neq(q.field("_id"), args.teamId)))
        .first();
      if (duplicate) throw new Error("A team with this name already exists");

      patch.name = name;
    }
    if (args.description !== undefined) patch.description = args.description;
    if (args.color !== undefined) patch.color = args.color;
    if (args.icon !== undefined) patch.icon = args.icon;
    if (args.department !== undefined) patch.department = args.department;
    if (args.teamLeadId !== undefined) {
      patch.teamLeadId = args.teamLeadId;

      const isMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_employee", (q) =>
          q.eq("teamId", args.teamId).eq("employeeId", args.teamLeadId!)
        )
        .first();
      if (!isMember) {
        await ctx.db.insert("teamMembers", {
          teamId: args.teamId,
          employeeId: args.teamLeadId!,
          joinedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.teamId, patch);

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "team_updated",
      description: `Updated team "${team.name}"`,
      userId: user._id,
      userName: user.name || "System",
      entityType: "team",
      entityId: args.teamId,
      workspaceId,
    });

    return { success: true };
  },
});

export const archive = mutation({
  args: { teamId: v.id("teams"), archived: v.boolean() },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user || user.isActive === false) throw new Error("Not authenticated");

    const workspaceId = user.activeWorkspaceId || user.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const team = await ctx.db.get(args.teamId);
    if (!team || team.workspaceId !== workspaceId) throw new Error("Team not found");

    if (!hasPermission(user, "canArchiveTeam") && !hasPermission(user, "canManageTeams")) {
      throw new Error("Permission denied");
    }

    await ctx.db.patch(args.teamId, { archived: args.archived, updatedAt: Date.now() });

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: args.archived ? "team_archived" : "team_unarchived",
      description: `${args.archived ? "Archived" : "Unarchived"} team "${team.name}"`,
      userId: user._id,
      userName: user.name || "System",
      entityType: "team",
      entityId: args.teamId,
      workspaceId,
    });

    return { success: true };
  },
});

export const remove = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user || user.isActive === false) throw new Error("Not authenticated");

    const workspaceId = user.activeWorkspaceId || user.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const team = await ctx.db.get(args.teamId);
    if (!team || team.workspaceId !== workspaceId) throw new Error("Team not found");

    if (!hasPermission(user, "canDeleteTeam") && !hasPermission(user, "canManageTeams")) {
      throw new Error("Permission denied");
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const m of members) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.teamId);

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "team_deleted",
      description: `Deleted team "${team.name}"`,
      userId: user._id,
      userName: user.name || "System",
      entityType: "team",
      entityId: args.teamId,
      workspaceId,
    });

    return { success: true };
  },
});

export const addMembers = mutation({
  args: {
    teamId: v.id("teams"),
    employeeIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user || user.isActive === false) throw new Error("Not authenticated");

    const workspaceId = user.activeWorkspaceId || user.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const team = await ctx.db.get(args.teamId);
    if (!team || team.workspaceId !== workspaceId) throw new Error("Team not found");

    if (!hasPermission(user, "canManageTeams") && team.teamLeadId !== user._id) {
      throw new Error("Permission denied");
    }

    // Collect all employee IDs already assigned to ANY team in this workspace
    const allTeamMembers = await ctx.db
      .query("teamMembers")
      .collect();

    const assignedEmployeeIds = new Set(allTeamMembers.map((m) => m.employeeId));

    // Get all workspace members to verify active status
    const workspaceMembers = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const activeMemberIds = new Set(
      workspaceMembers.filter((m) => m.status === "active").map((m) => m.userId)
    );

    const now = Date.now();
    const added: Id<"users">[] = [];
    const conflicts: string[] = [];

    for (const employeeId of args.employeeIds) {
      // Check if employee is part of this workspace and active
      if (!activeMemberIds.has(employeeId)) {
        const emp = await ctx.db.get(employeeId);
        conflicts.push(`${emp?.name ?? "Unknown"}: not an active employee in this workspace`);
        continue;
      }

      // Check if employee is already assigned to ANY team
      if (assignedEmployeeIds.has(employeeId)) {
        const emp = await ctx.db.get(employeeId);
        conflicts.push(`${emp?.name ?? "Unknown"}: already assigned to another team`);
        continue;
      }

      // Check if already in this specific team (redundancy check)
      const existing = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_employee", (q) =>
          q.eq("teamId", args.teamId).eq("employeeId", employeeId)
        )
        .first();
      if (existing) continue;

      await ctx.db.insert("teamMembers", {
        teamId: args.teamId,
        employeeId,
        joinedAt: now,
      });
      added.push(employeeId);

      // Update assigned set to reflect the new insertion
      assignedEmployeeIds.add(employeeId);
    }

    if (conflicts.length > 0) {
      const partial = added.length > 0 ? ` ${added.length} employee(s) were added, but ${conflicts.length} could not be added:` : "";
      throw new Error(
        `The following employees could not be added: ${conflicts.join("; ")}.${partial}`
      );
    }

    if (added.length > 0) {
      const names = await Promise.all(
        added.map(async (id) => {
          const emp = await ctx.db.get(id);
          return emp?.name ?? "Unknown";
        })
      );

      await ctx.scheduler.runAfter(0, internal.activities.log, {
        type: "team_members_added",
        description: `${names.join(", ")} added to team "${team.name}"`,
        userId: user._id,
        userName: user.name || "System",
        entityType: "team",
        entityId: args.teamId,
        workspaceId,
      });
    }

    return { added: added.length };
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    employeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    if (!user || user.isActive === false) throw new Error("Not authenticated");

    const workspaceId = user.activeWorkspaceId || user.workspaceId;
    if (!workspaceId) throw new Error("No active workspace");

    const team = await ctx.db.get(args.teamId);
    if (!team || team.workspaceId !== workspaceId) throw new Error("Team not found");

    if (!hasPermission(user, "canManageTeams") && team.teamLeadId !== user._id) {
      throw new Error("Permission denied");
    }

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_employee", (q) =>
        q.eq("teamId", args.teamId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!member) throw new Error("Member not found in team");

    await ctx.db.delete(member._id);

    await ctx.scheduler.runAfter(0, internal.activities.log, {
      type: "team_member_removed",
      description: `Removed member from team "${team.name}"`,
      userId: user._id,
      userName: user.name || "System",
      entityType: "team",
      entityId: args.teamId,
      workspaceId,
    });

    return { success: true };
  },
});

export const getTeamMetrics = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (team.workspaceId !== workspaceId) return null;

    const memberEntries = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const memberIds = memberEntries.map((m) => m.employeeId);

    const allLeads = await ctx.db
      .query("leads")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const teamLeads = allLeads.filter((l) => l.assignedTo && memberIds.includes(l.assignedTo));
    const openLeads = teamLeads.filter((l) => l.status !== "Closed" && l.status !== "Converted");

    const allDeals = await ctx.db
      .query("deals")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const teamDeals = allDeals.filter((d) => d.assignedTo && memberIds.includes(d.assignedTo));
    const openDeals = teamDeals.filter((d) => d.status !== "Won" && d.status !== "Lost");
    const wonDeals = teamDeals.filter((d) => d.status === "Won");

    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    const allTasks = await ctx.db
      .query("tasks")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const teamTasks = allTasks.filter((t) => t.assignedTo && memberIds.includes(t.assignedTo));
    const pendingTasks = teamTasks.filter((t) => t.status !== "completed" && t.status !== "done");

    return {
      totalLeads: teamLeads.length,
      openLeads: openLeads.length,
      totalDeals: teamDeals.length,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      totalRevenue,
      totalTasks: teamTasks.length,
      pendingTasks: pendingTasks.length,
      memberCount: memberIds.length,
    };
  },
});

export const getEmployees = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const employees = await Promise.all(
      members.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        if (!u) return null;
        return {
          _id: u._id,
          name: u.name ?? "Unknown User",
          email: u.email ?? "",
          role: m.role?.toLowerCase() ?? u.role ?? "employee",
          department: m.department ?? u.department ?? "",
          avatarUrl: u.image ?? u.avatarUrl,
          isActive: m.status === "active",
          jobTitle: u.jobTitle ?? "",
        };
      })
    );

    return employees.filter((e): e is NonNullable<typeof e> => e !== null).sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getAvailableEmployees = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return [];

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return [];

    // Only active workspace members
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Collect all employee IDs already assigned to ANY team
    const allTeamMembers = await ctx.db.query("teamMembers").collect();
    const assignedIds = new Set(allTeamMembers.map((m) => m.employeeId));

    const available = await Promise.all(
      members.map(async (m) => {
        if (assignedIds.has(m.userId)) return null;

        const u = await ctx.db.get(m.userId);
        if (!u) return null;
        if (u.isActive === false) return null;

        return {
          _id: u._id,
          name: u.name ?? "Unknown User",
          email: u.email ?? "",
          role: m.role?.toLowerCase() ?? u.role ?? "employee",
          department: m.department ?? u.department ?? "",
          avatarUrl: u.image ?? u.avatarUrl,
          jobTitle: u.jobTitle ?? "",
        };
      })
    );

    return available.filter((e): e is NonNullable<typeof e> => e !== null).sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) return null;

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) return null;

    const allTeams = await ctx.db
      .query("teams")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.neq(q.field("archived"), true))
      .collect();

    const totalTeams = allTeams.length;
    if (totalTeams === 0) {
      return {
        totalTeams: 0,
        largestTeam: null,
        recentlyActiveTeam: null,
        averageMembers: 0,
        totalRevenueByTeam: [],
        pipelineValueByTeam: [],
        teams: [],
      };
    }

    const teamsWithStats = await Promise.all(
      allTeams.map(async (t) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_teamId", (q) => q.eq("teamId", t._id))
          .collect();
        const memberIds = members.map((m) => m.employeeId);

        const allLeads = await ctx.db
          .query("leads")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
          .collect();
        const teamLeads = allLeads.filter((l) => l.assignedTo && memberIds.includes(l.assignedTo));

        const allDeals = await ctx.db
          .query("deals")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
          .collect();
        const teamDeals = allDeals.filter((d) => d.assignedTo && memberIds.includes(d.assignedTo));
        const wonDeals = teamDeals.filter((d) => d.status === "Won");

        return {
          _id: t._id,
          name: t.name,
          color: t.color ?? "#6366f1",
          memberCount: memberIds.length,
          openLeads: teamLeads.filter((l) => l.status !== "Closed" && l.status !== "Converted").length,
          openDeals: teamDeals.filter((d) => d.status !== "Won" && d.status !== "Lost").length,
          revenue: wonDeals.reduce((sum, d) => sum + (d.value || 0), 0),
          pipelineValue: teamDeals.filter((d) => d.status !== "Won" && d.status !== "Lost").reduce((sum, d) => sum + (d.value || 0), 0),
          updatedAt: t.updatedAt ?? t._creationTime,
        };
      })
    );

    const largestTeam = [...teamsWithStats].sort((a, b) => b.memberCount - a.memberCount)[0] ?? null;
    const recentlyActiveTeam = [...teamsWithStats].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
    const totalMembers = teamsWithStats.reduce((sum, t) => sum + t.memberCount, 0);
    const averageMembers = totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0;

    return {
      totalTeams,
      largestTeam: largestTeam ? { _id: largestTeam._id, name: largestTeam.name, memberCount: largestTeam.memberCount } : null,
      recentlyActiveTeam: recentlyActiveTeam ? { _id: recentlyActiveTeam._id, name: recentlyActiveTeam.name, updatedAt: recentlyActiveTeam.updatedAt } : null,
      averageMembers,
      totalRevenueByTeam: teamsWithStats.map((t) => ({ teamId: t._id, name: t.name, color: t.color, revenue: t.revenue })),
      pipelineValueByTeam: teamsWithStats.map((t) => ({ teamId: t._id, name: t.name, color: t.color, pipelineValue: t.pipelineValue })),
      teams: teamsWithStats,
    };
  },
});
