import { mutation } from "./_generated/server";

export const migrateAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Migrate Companies to Workspaces
    const companies = await ctx.db.query("companies").collect();
    const companyToWorkspaceMap = new Map<string, string>();

    for (const company of companies) {
      if (!company.ownerUserId) continue;

      const newWorkspaceId = await ctx.db.insert("workspaces", {
        name: company.name,
        industry: company.industry,
        companySize: company.employeeCount,
        createdBy: company.ownerUserId,
        createdAt: company.createdAt || Date.now(),
        status: company.status === "inactive" ? "inactive" : "active",
      });

      companyToWorkspaceMap.set(company._id, newWorkspaceId);
    }

    // 2. Migrate Memberships
    const memberships = await ctx.db.query("memberships").collect();
    for (const m of memberships) {
      const workspaceId = companyToWorkspaceMap.get(m.companyId);
      if (!workspaceId) continue;

      const user = await ctx.db.get(m.userId);
      if (!user || !user.clerkId) continue;

      let newRole = "EMPLOYEE";
      if (m.role === "super_admin" || m.role === "owner") newRole = "SUPER_ADMIN";
      else if (m.role === "admin") newRole = "ADMIN";

      await ctx.db.insert("workspaceMembers", {
        workspaceId: workspaceId as any,
        clerkUserId: user.clerkId,
        userId: user._id,
        role: newRole,
        department: m.department,
        status: m.isActive === false ? "inactive" : "active",
        joinedAt: m.joinedAt || Date.now(),
      });
    }

    // 3. Update Users
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      if (u.activeCompanyId) {
        const workspaceId = companyToWorkspaceMap.get(u.activeCompanyId);
        if (workspaceId) {
          await ctx.db.patch(u._id, { activeWorkspaceId: workspaceId as any });
        }
      }
    }

    // 4. Update CRM Entities
    const tablesToUpdate = ["leads", "contacts", "deals", "tasks", "notifications", "activities", "teams"] as const;
    
    let totalUpdated = 0;
    for (const table of tablesToUpdate) {
      const records = await ctx.db.query(table).collect();
      for (const record of records) {
        if ((record as any).companyId) {
          const workspaceId = companyToWorkspaceMap.get((record as any).companyId);
          if (workspaceId) {
            await ctx.db.patch(record._id as any, { workspaceId: workspaceId as any });
            totalUpdated++;
          }
        }
      }
    }

    return `Migrated ${companies.length} companies, ${memberships.length} memberships, and ${totalUpdated} CRM entities.`;
  },
});

export const removeCompanyId = mutation({
  args: {},
  handler: async (ctx) => {
    const tablesToUpdate = [
      "users",
      "leads",
      "contacts",
      "deals",
      "tasks",
      "notifications",
      "activities",
      "teams",
      "notes",
    ] as const;
    
    let totalUpdated = 0;
    for (const table of tablesToUpdate) {
      const records = await ctx.db.query(table).collect();
      for (const record of records) {
        if ((record as any).companyId || (record as any).activeCompanyId) {
          const patchObj: any = {};
          if ((record as any).companyId !== undefined) patchObj.companyId = undefined;
          if ((record as any).activeCompanyId !== undefined) patchObj.activeCompanyId = undefined;
          
          await ctx.db.patch(record._id as any, patchObj);
          totalUpdated++;
        }
      }
    }

    return `Removed companyId from ${totalUpdated} records.`;
  },
});
