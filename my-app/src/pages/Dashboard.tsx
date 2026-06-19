import { useAuth } from "@/features/auth/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";

import { motion } from "motion/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  Users, Briefcase, CheckSquare, ChevronRight, TrendingUp, TrendingDown,
  Clock, MoreHorizontal, Target, UserCheck
} from "lucide-react";

// Sparkline datasets
const sp1 = [{ v: 30 }, { v: 45 }, { v: 38 }, { v: 60 }, { v: 52 }, { v: 68 }, { v: 64 }, { v: 80 }];
const sp2 = [{ v: 50 }, { v: 42 }, { v: 58 }, { v: 48 }, { v: 65 }, { v: 55 }, { v: 72 }, { v: 68 }];
const sp3 = [{ v: 20 }, { v: 35 }, { v: 28 }, { v: 45 }, { v: 38 }, { v: 55 }, { v: 50 }, { v: 64 }];
const sp4 = [{ v: 15 }, { v: 22 }, { v: 18 }, { v: 30 }, { v: 24 }, { v: 32 }, { v: 26 }, { v: 24 }];

const ACTIVITIES = [
  { id: 1, initials: "SM", name: "Sarah Mitchell", action: "moved", subject: "Acme Inc.", detail: "to Negotiation stage", time: "2 min ago", category: "Deal", bg: "bg-violet-500" },
  { id: 2, initials: "JD", name: "James Davis", action: "created a new lead", subject: "TechCorp Solutions", detail: "", time: "18 min ago", category: "Lead", bg: "bg-indigo-500" },
  { id: 3, initials: "LK", name: "Lisa Kim", action: "updated contact", subject: "Robert Chen", detail: "— phone & email", time: "1 hr ago", category: "Contact", bg: "bg-emerald-500" },
  { id: 4, initials: "AM", name: "Alex Monroe", action: "closed deal", subject: "Globex Corp", detail: "— $48,500", time: "3 hr ago", category: "Deal", bg: "bg-orange-500" },
  { id: 5, initials: "PT", name: "Priya Tran", action: "added task", subject: "Follow up with Initech Ltd.", detail: "", time: "Yesterday", category: "Task", bg: "bg-pink-500" },
];

const TASKS_DATA = [
  { id: 1, title: "Follow up with Michael Chen re: Q2 proposal", due: "Today", priority: "High", related: "TechCorp Solutions", done: false },
  { id: 2, title: "Send contract draft to Globex Industries", due: "Tomorrow", priority: "High", related: "Globex Industries", done: false },
  { id: 3, title: "Prepare demo for NexGen Tech", due: "Jun 20", priority: "Medium", related: "NexGen Tech", done: false },
  { id: 4, title: "Update pipeline stage for Hooli Corp", due: "Jun 19", priority: "Low", related: "Hooli Corp", done: true },
];

function Av({ initials, size = "md", cls = "bg-indigo-600" }: { initials: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; cls?: string }) {
  const sz = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base", xl: "w-20 h-20 text-2xl" }[size];
  return (
    <div className={`${sz} ${cls} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

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

function StatCard({ title, value, change, up, Icon, iconBg, data }: { title: string; value: string; change: string; up: boolean; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; iconBg: string; data: { v: number }[] }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 16px 40px -12px rgba(79,70,229,0.12)" }}
      transition={{ duration: 0.18 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/70 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
        </div>
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon style={{ width: 18, height: 18 }} className="text-white" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
        <div className="w-20 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`g${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={1.5} fill={`url(#g${title})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { user, isLoading } = useAuth();
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <Skeleton className="h-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl pb-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {greeting}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Here's what's happening with your CRM today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value="1,284" change="+12% this month" up Icon={Target} iconBg="bg-indigo-500" data={sp1} />
        <StatCard title="Contacts" value="3,847" change="+5% this month" up Icon={Users} iconBg="bg-violet-500" data={sp2} />
        <StatCard title="Active Deals" value="$485K" change="+8% pipeline" up Icon={Briefcase} iconBg="bg-emerald-500" data={sp3} />
        <StatCard title="Tasks Due Today" value="24" change="6 overdue" up={false} Icon={CheckSquare} iconBg="bg-orange-500" data={sp4} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h2>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
            {ACTIVITIES.map(a => (
              <div key={a.id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <Av initials={a.initials} cls={a.bg} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-semibold text-slate-900 dark:text-white">{a.name}</span>{" "}
                    {a.action}{" "}
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">"{a.subject}"</span>
                    {a.detail && <span className="text-slate-500 dark:text-slate-400"> {a.detail}</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-400">{a.time}</span>
                    <Chip label={a.category} v={a.category === "Deal" ? "purple" : a.category === "Lead" ? "blue" : a.category === "Contact" ? "green" : "orange"} />
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500 dark:hover:text-slate-300">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Tasks */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/70">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {[
                { label: "Create Lead", Icon: Target, bg: "bg-indigo-50 dark:bg-indigo-950/50", ic: "text-indigo-600 dark:text-indigo-400" },
                { label: "Add Contact", Icon: UserCheck, bg: "bg-violet-50 dark:bg-violet-950/50", ic: "text-violet-600 dark:text-violet-400" },
                { label: "Create Deal", Icon: Briefcase, bg: "bg-emerald-50 dark:bg-emerald-950/50", ic: "text-emerald-600 dark:text-emerald-400" },
                { label: "Add Task", Icon: CheckSquare, bg: "bg-orange-50 dark:bg-orange-950/50", ic: "text-orange-600 dark:text-orange-400" },
              ].map(({ label, Icon, bg, ic }) => (
                <motion.button key={label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className={`${bg} rounded-xl p-4 flex flex-col items-center gap-2 text-center group`}>
                  <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Icon style={{ width: 18, height: 18 }} className={ic} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Today's Tasks</h2>
            </div>
            <div className="p-4 space-y-2.5">
              {TASKS_DATA.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === "High" ? "bg-red-500" : t.priority === "Medium" ? "bg-orange-400" : "bg-slate-300"}`} />
                  <p className={`text-xs text-slate-600 dark:text-slate-400 leading-snug ${t.done ? "line-through opacity-50" : ""}`}>{t.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}