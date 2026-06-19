import { Building, Filter, MoreHorizontal, Plus } from "lucide-react";

const LEADS = [
  { id: 1, name: "TechCorp Solutions", contact: "Michael Chen", email: "michael@techcorp.com", status: "New", value: "$24,000", source: "Website", score: 92 },
  { id: 2, name: "Globex Industries", contact: "Sarah Johnson", email: "sarah@globex.com", status: "Contacted", value: "$85,000", source: "LinkedIn", score: 78 },
  { id: 3, name: "Initech Ltd.", contact: "Robert Park", email: "rpark@initech.com", status: "Qualified", value: "$132,000", source: "Referral", score: 88 },
  { id: 4, name: "Hooli Corp", contact: "Amanda Lee", email: "a.lee@hooli.com", status: "Proposal", value: "$67,500", source: "Cold Email", score: 65 },
  { id: 5, name: "Pied Piper Inc.", contact: "Chris Nelson", email: "chris@piedpiper.io", status: "New", value: "$15,200", source: "Event", score: 71 },
];

function Chip({ label, v = "neutral" }: { label: string; v?: "neutral" | "green" | "blue" | "orange" | "red" | "purple" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }[v];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles}`}>{label}</span>;
}

export function LeadsPage() {
  const statusV = (s: string): "blue" | "neutral" | "green" | "purple" => ({ New: "blue", Contacted: "neutral", Qualified: "green", Proposal: "purple" }[s] as any ?? "neutral");
  return (
    <div className="space-y-5 max-w-7xl pb-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Leads</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">1,284 total · 47 assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Lead
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/70">
                {["Company", "Contact", "Status", "Value", "Source", "Score", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
              {LEADS.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{l.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{l.contact}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{l.email}</p>
                  </td>
                  <td className="px-5 py-3.5"><Chip label={l.status} v={statusV(l.status)} /></td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white">{l.value}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{l.source}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${l.score >= 85 ? "bg-emerald-500" : l.score >= 70 ? "bg-yellow-500" : "bg-orange-500"}`} style={{ width: `${l.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{l.score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500 dark:hover:text-slate-300">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
