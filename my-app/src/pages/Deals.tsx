import { Plus } from "lucide-react";
import { motion } from "motion/react";

const PIPELINE = [
  { id: "prospect", label: "Prospecting", dot: "bg-slate-400", deals: [{ name: "Acme Corp", value: "$28K", owner: "SM", days: 3 }, { name: "DataFlow AI", value: "$145K", owner: "JD", days: 1 }] },
  { id: "qualify", label: "Qualification", dot: "bg-blue-500", deals: [{ name: "NexGen Tech", value: "$67K", owner: "LK", days: 7 }] },
  { id: "proposal", label: "Proposal", dot: "bg-violet-500", deals: [{ name: "Hooli Corp", value: "$67.5K", owner: "AM", days: 12 }, { name: "Initech Ltd.", value: "$132K", owner: "PT", days: 5 }] },
  { id: "negotiate", label: "Negotiation", dot: "bg-orange-500", deals: [{ name: "Globex Industries", value: "$85K", owner: "GR", days: 18 }] },
  { id: "won", label: "Closed Won", dot: "bg-emerald-500", deals: [{ name: "Pied Piper", value: "$48.5K", owner: "SM", days: 24 }] },
];

function Av({ initials, size = "md", cls = "bg-indigo-600" }: { initials: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; cls?: string }) {
  const sz = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base", xl: "w-20 h-20 text-2xl" }[size];
  return (
    <div className={`${sz} ${cls} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function DealsPage() {
  return (
    <div className="space-y-5 pb-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Deals Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">$426K total pipeline value across 7 deals</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Deal
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {PIPELINE.map(col => (
          <div key={col.id} className="flex-shrink-0 w-60">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{col.label}</span>
              <span className="ml-auto text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">{col.deals.length}</span>
            </div>
            <div className="space-y-2.5">
              {col.deals.map((d, i) => (
                <motion.div key={i} whileHover={{ y: -2 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{d.name}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{d.value}</span>
                    <div className="flex items-center gap-1.5">
                      <Av initials={d.owner} size="xs" cls="bg-indigo-500" />
                      <span className="text-[11px] text-slate-400">{d.days}d</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              <button className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Add deal
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
