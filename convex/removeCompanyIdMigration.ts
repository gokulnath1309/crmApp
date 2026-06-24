import { mutation } from "./_generated/server";

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
