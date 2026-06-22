import { useState } from "react";
import { CheckCircle, Plus } from "lucide-react";

const TASKS_DATA = [
  { id: 1, title: "Follow up with Michael Chen re: Q2 proposal", due: "Today", priority: "High", related: "TechCorp Solutions", done: false },
  { id: 2, title: "Send contract draft to Globex Industries", due: "Tomorrow", priority: "High", related: "Globex Industries", done: false },
  { id: 3, title: "Prepare demo for NexGen Tech", due: "Jun 20", priority: "Medium", related: "NexGen Tech", done: false },
  { id: 4, title: "Update pipeline stage for Hooli Corp", due: "Jun 19", priority: "Low", related: "Hooli Corp", done: true },
  { id: 5, title: "Send onboarding docs to Pied Piper", due: "Jun 22", priority: "Medium", related: "Pied Piper Inc.", done: false },
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

export function TasksPage() {
  const [list, setList] = useState(TASKS_DATA);
  const done = list.filter(t => t.done).length;
  return (
    <div className="space-y-5 max-w-3xl pb-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{list.length - done} remaining · {done} completed</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
          {list.map(t => (
            <div key={t.id} className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${t.done ? "opacity-60" : ""}`}>
              <button
                onClick={() => setList(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${t.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"}`}
              >
                {t.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-slate-900 dark:text-white ${t.done ? "line-through" : ""}`}>{t.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{t.related}</span>
                  <span className="text-slate-200 dark:text-slate-600">·</span>
                  <span className={`text-xs font-semibold ${t.due === "Today" ? "text-red-500" : "text-slate-400"}`}>{t.due}</span>
                </div>
              </div>
              <Chip label={t.priority} v={t.priority === "High" ? "red" : t.priority === "Medium" ? "orange" : "neutral"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
