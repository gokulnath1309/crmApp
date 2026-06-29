import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveUserReadOnly } from "./lib/getCurrentUser";

export const globalSearch = query({
  args: {
    queryStr: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveUserReadOnly(ctx);
    if (!currentUser || currentUser.isActive === false) {
      return { leads: [], contacts: [], deals: [], companies: [] };
    }

    const workspaceId = currentUser.activeWorkspaceId || currentUser.workspaceId;
    if (!workspaceId) {
      return { leads: [], contacts: [], deals: [], companies: [] };
    }

    const q = args.queryStr.toLowerCase().trim();
    if (!q) {
      return { leads: [], contacts: [], deals: [], companies: [] };
    }

    // 1. Fetch leads
    const allLeads = await ctx.db
      .query("leads")
      .withIndex("by_workspaceId", (x) => x.eq("workspaceId", workspaceId))
      .collect();
    const leads = allLeads
      .filter((l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        (l.phone && l.phone.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((l) => ({
        _id: l._id,
        name: `${l.firstName} ${l.lastName}`,
        email: l.email,
        company: l.company,
        status: l.status,
      }));

    // 2. Fetch contacts
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspaceId", (x) => x.eq("workspaceId", workspaceId))
      .collect();
    const contacts = allContacts
      .filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        company: c.company,
        status: c.status,
      }));

    // 3. Fetch deals
    const allDeals = await ctx.db
      .query("deals")
      .withIndex("by_workspaceId", (x) => x.eq("workspaceId", workspaceId))
      .collect();
    const deals = allDeals
      .filter((d) =>
        d.title.toLowerCase().includes(q) ||
        (d.company && d.company.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((d) => ({
        _id: d._id,
        title: d.title,
        company: d.company,
        value: d.value,
        currency: d.currency || "INR",
        stage: d.stage,
      }));

    // 4. Fetch companies
    const allCompanies = await ctx.db
      .query("companies")
      .withIndex("by_workspaceId", (x) => x.eq("workspaceId", workspaceId))
      .collect();
    const companies = allCompanies
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.domain && c.domain.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        domain: c.domain,
        industry: c.industry,
      }));

    return { leads, contacts, deals, companies };
  },
});
