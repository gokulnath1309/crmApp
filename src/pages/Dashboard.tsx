import { useUser } from "@/features/auth/UserProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCurrency } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

import { motion } from "motion/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  Users, Briefcase, CheckSquare, ChevronRight, TrendingUp, TrendingDown,
  Clock, Target, UserCheck, CheckCircle2, Percent,
} from "lucide-react";

// Sparkline datasets
const sp1 = [{ v: 30 }, { v: 45 }, { v: 38 }, { v: 60 }, { v: 52 }, { v: 68 }, { v: 64 }, { v: 80 }];
const sp2 = [{ v: 50 }, { v: 42 }, { v: 58 }, { v: 48 }, { v: 65 }, { v: 55 }, { v: 72 }, { v: 68 }];
const sp3 = [{ v: 20 }, { v: 35 }, { v: 28 }, { v: 45 }, { v: 38 }, { v: 55 }, { v: 50 }, { v: 64 }];
const sp4 = [{ v: 15 }, { v: 22 }, { v: 18 }, { v: 30 }, { v: 24 }, { v: 32 }, { v: 26 }, { v: 24 }];

// Local formatCurrency removed; using imported formatCurrency from src/lib/currency

const formatTime = (epoch: number) => {
  const diff = Date.now() - epoch;
  if (diff < 60000) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

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

function StatCard({ title, value, change, up, Icon, iconBg, data }: { title: string; value: string | React.ReactNode; change: string; up: boolean; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; iconBg: string; data: { v: number }[] }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 16px 40px -12px rgba(79,70,229,0.12)" }}
      transition={{ duration: 0.18 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/70 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <div className="text-slate-900 dark:text-white mt-1 tracking-tight font-sans">
            {typeof value === "string" ? (
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</span>
            ) : (
              value
            )}
          </div>
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
  const navigate = useNavigate();
  const { user } = useUser();
  const isLoading = false;
  const metrics = useQuery(api.dashboard.getMetrics);
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const teamMetrics = useQuery(api.teams.getDashboardMetrics, {});
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";

  if (isLoading || !user || !metrics) {
    return (
      <div className="space-y-5 px-4 pt-4 pb-6">
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
    <div className="space-y-5 max-w-7xl pb-6 px-4 pt-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {greeting}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Here's what's happening with your CRM today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={String(metrics.totalLeads)} change={`${metrics.openLeadsCount || 0} active leads`} up Icon={Target} iconBg="bg-indigo-500" data={sp1} />
        <StatCard title="Contacts" value={String(metrics.totalContacts)} change="+5% this month" up Icon={Users} iconBg="bg-violet-500" data={sp2} />
        <StatCard
          title="Won Revenue"
          value={
            <div className="flex flex-col gap-0.5 mt-1 min-w-0">
              {Object.keys(metrics.wonRevenue || {}).length === 0 ? (
                <span className="text-slate-400 text-sm font-semibold">No revenue</span>
              ) : (
                Object.entries(metrics.wonRevenue).map(([currency, amount]) => (
                  <div key={currency} className="text-sm font-semibold flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currency}</span>
                    <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(amount as number, currency)}</span>
                  </div>
                ))
              )}
            </div>
          }
          change="+8% pipeline"
          up
          Icon={Briefcase}
          iconBg="bg-emerald-500"
          data={sp3}
        />
        <StatCard
          title="Revenue Forecast"
          value={
            <div className="flex flex-col gap-0.5 mt-1 min-w-0">
              {Object.keys(metrics.revenueForecast || {}).length === 0 ? (
                <span className="text-slate-400 text-sm font-semibold">No forecast</span>
              ) : (
                Object.entries(metrics.revenueForecast).map(([currency, amount]) => (
                  <div key={currency} className="text-sm font-semibold flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currency}</span>
                    <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(amount as number, currency)}</span>
                  </div>
                ))
              )}
            </div>
          }
          change="Proposal/Neg."
          up
          Icon={TrendingUp}
          iconBg="bg-orange-500"
          data={sp4}
        />
      </div>

      {/* Lead Qualification Metrics Section (Visible to Admins / Managers) */}
      {currentUser && (currentUser.role === "super_admin" || currentUser.role === "admin" || currentUser.role === "manager") && metrics.leadMetrics && (
        <>
          <div className="pt-2">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Target className="w-4 h-4 text-indigo-500" />
              Lead Qualification & Funnel Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time status breakdown, qualification conversion velocity and conversion health.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Qualification Rate</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {Math.round(metrics.leadMetrics.qualificationRate)}%
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Leads qualifying into sales stage</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Conversion Rate</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {Math.round(metrics.leadMetrics.conversionRate)}%
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Leads converted to active deals</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg Response Time</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {metrics.leadMetrics.avgResponseTimeMin} min
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Average time to first contact</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Closed & Archived</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {Object.entries(metrics.leadMetrics.leadsByStatus)
                    .filter(([s]) => ["Converted", "Unqualified", "Lost", "Spam", "Duplicate"].includes(s))
                    .reduce((sum, [, val]) => sum + (val as number), 0)}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Inactive and terminal leads</p>
            </Card>
          </div>

          <Card className="p-5 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Lead Lifecycle Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(metrics.leadMetrics.leadsByStatus).map(([status, count]) => (
                <div key={status} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{status}</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{count as number}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Teams Section */}
      {teamMetrics && teamMetrics.totalTeams > 0 && (
        <>
          <div className="pt-2">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Users className="w-4 h-4 text-indigo-500" />
              Team Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Performance metrics across all teams.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Teams</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{teamMetrics.totalTeams}</p>
            </Card>
            {teamMetrics.largestTeam && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Largest Team</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{teamMetrics.largestTeam.name}</p>
                <p className="text-xs text-slate-500">{teamMetrics.largestTeam.memberCount} members</p>
              </Card>
            )}
            {teamMetrics.recentlyActiveTeam && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recently Active</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{teamMetrics.recentlyActiveTeam.name}</p>
                <p className="text-xs text-slate-500">{formatTime(teamMetrics.recentlyActiveTeam.updatedAt)}</p>
              </Card>
            )}
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg Members</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{teamMetrics.averageMembers}</p>
            </Card>
          </div>

          {/* Revenue & Pipeline by Team */}
          {(teamMetrics.totalRevenueByTeam.some((t: any) => t.revenue > 0) || teamMetrics.pipelineValueByTeam.some((t: any) => t.pipelineValue > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teamMetrics.totalRevenueByTeam.some((t: any) => t.revenue > 0) && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Revenue by Team</h3>
                  <div className="space-y-2">
                    {teamMetrics.totalRevenueByTeam.filter((t: any) => t.revenue > 0).map((t: any) => {
                      const maxRev = Math.max(...teamMetrics.totalRevenueByTeam.map((x: any) => x.revenue), 1);
                      return (
                        <div key={t.teamId} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700 dark:text-slate-300">{t.name}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">${t.revenue.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(t.revenue / maxRev) * 100}%`, backgroundColor: t.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
              {teamMetrics.pipelineValueByTeam.some((t: any) => t.pipelineValue > 0) && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Pipeline by Team</h3>
                  <div className="space-y-2">
                    {teamMetrics.pipelineValueByTeam.filter((t: any) => t.pipelineValue > 0).map((t: any) => {
                      const maxPipe = Math.max(...teamMetrics.pipelineValueByTeam.map((x: any) => x.pipelineValue), 1);
                      return (
                        <div key={t.teamId} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700 dark:text-slate-300">{t.name}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">${t.pipelineValue.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(t.pipelineValue / maxPipe) * 100}%`, backgroundColor: t.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      <div className="pt-2">
        <h2 className="text-md font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Briefcase className="w-4 h-4 text-indigo-500" />
          Deal Pipeline Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time breakdown of active sales cycles and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Pipeline"
          value={
            <div className="flex flex-col gap-0.5 mt-1 min-w-0">
              {Object.keys(metrics.totalPipelineValue || {}).length === 0 ? (
                <span className="text-slate-400 text-sm font-semibold">No active deals</span>
              ) : (
                Object.entries(metrics.totalPipelineValue).map(([currency, amount]) => (
                  <div key={currency} className="text-sm font-semibold flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currency}</span>
                    <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(amount as number, currency)}</span>
                  </div>
                ))
              )}
            </div>
          }
          change="Active stages"
          up
          Icon={Briefcase}
          iconBg="bg-indigo-600"
          data={sp1}
        />
        <StatCard
          title="Weighted Pipeline"
          value={
            <div className="flex flex-col gap-0.5 mt-1 min-w-0">
              {Object.keys(metrics.weightedPipelineValue || {}).length === 0 ? (
                <span className="text-slate-400 text-sm font-semibold">No active deals</span>
              ) : (
                Object.entries(metrics.weightedPipelineValue).map(([currency, amount]) => (
                  <div key={currency} className="text-sm font-semibold flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currency}</span>
                    <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(amount as number, currency)}</span>
                  </div>
                ))
              )}
            </div>
          }
          change="Prob. adjusted"
          up
          Icon={Target}
          iconBg="bg-violet-600"
          data={sp2}
        />
        <StatCard
          title="Closed Won Revenue"
          value={
            <div className="flex flex-col gap-0.5 mt-1 min-w-0">
              {Object.keys(metrics.closedRevenue || {}).length === 0 ? (
                <span className="text-slate-400 text-sm font-semibold">No closed deals</span>
              ) : (
                Object.entries(metrics.closedRevenue).map(([currency, amount]) => (
                  <div key={currency} className="text-sm font-semibold flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{currency}</span>
                    <span className="text-[15px] font-extrabold text-slate-900 dark:text-white">{formatCurrency(amount as number, currency)}</span>
                  </div>
                ))
              )}
            </div>
          }
          change="From won deals"
          up
          Icon={CheckCircle2}
          iconBg="bg-emerald-600"
          data={sp3}
        />
        <StatCard
          title="Pipeline Performance"
          value={
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Win Rate</span>
                <span className="text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lost Rate</span>
                <span className="text-[15px] font-extrabold text-red-500 dark:text-red-400">
                  {metrics.lostRate.toFixed(1)}%
                </span>
              </div>
            </div>
          }
          change="Closed won vs lost"
          up={metrics.winRate >= 50}
          Icon={Percent}
          iconBg="bg-blue-600"
          data={sp4}
        />
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
            {metrics.activities.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No recent activity.
              </div>
            ) : (
              metrics.activities.map(a => {
                const initials = (a.userName || "System")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                
                let category = "Activity";
                let bg = "bg-slate-500";
                if (a.type.startsWith("lead")) {
                  category = "Lead";
                  bg = "bg-indigo-500";
                } else if (a.type.startsWith("contact")) {
                  category = "Contact";
                  bg = "bg-emerald-500";
                } else if (a.type.startsWith("deal")) {
                  category = "Deal";
                  bg = "bg-violet-500";
                } else if (a.type.startsWith("task")) {
                  category = "Task";
                  bg = "bg-pink-500";
                }

                return (
                  <div key={a._id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <Av initials={initials} cls={bg} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {a.userName || "System"}
                        </span>{" "}
                        {a.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-400">{formatTime(a.createdAt)}</span>
                        <Chip label={category} v={category === "Deal" ? "purple" : category === "Lead" ? "blue" : category === "Contact" ? "green" : "orange"} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
                { label: "Create Lead", Icon: Target, bg: "bg-indigo-50 dark:bg-indigo-950/50", ic: "text-indigo-600 dark:text-indigo-400", path: "/leads?new=true" },
                { label: "Add Contact", Icon: UserCheck, bg: "bg-violet-50 dark:bg-violet-950/50", ic: "text-violet-600 dark:text-violet-400", path: "/contacts?new=true" },
                { label: "Create Deal", Icon: Briefcase, bg: "bg-emerald-50 dark:bg-emerald-950/50", ic: "text-emerald-600 dark:text-emerald-400", path: "/deals?new=true" },
                { label: "Add Task", Icon: CheckSquare, bg: "bg-orange-50 dark:bg-orange-950/50", ic: "text-orange-600 dark:text-orange-400", path: "/tasks?new=true" },
              ].map(({ label, Icon, bg, ic, path }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(path)}
                  className={`${bg} rounded-xl p-4 flex flex-col items-center gap-2 text-center group`}
                >
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
              {metrics.todaysTasks.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  No tasks due today.
                </div>
              ) : (
                metrics.todaysTasks.map(t => (
                  <div key={t._id} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === "High" ? "bg-red-500" : t.priority === "Medium" ? "bg-orange-400" : "bg-slate-300"}`} />
                    <p className={`text-xs text-slate-600 dark:text-slate-400 leading-snug ${t.status === "Completed" ? "line-through opacity-50" : ""}`}>{t.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Deals by Stage</h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(metrics.dealsByStage).map(([stage, count]) => {
                const maxCount = Math.max(...Object.values(metrics.dealsByStage), 1);
                const percent = (count / maxCount) * 100;
                
                // stage-specific color mappings
                let barColor = "bg-indigo-500 dark:bg-indigo-600";
                if (stage === "Closed Won") barColor = "bg-emerald-500 dark:bg-emerald-600";
                else if (stage === "Closed Lost") barColor = "bg-red-500 dark:bg-red-600";
                else if (stage === "Negotiation" || stage === "Verbal Commit") barColor = "bg-violet-500 dark:bg-violet-600";
                else if (stage === "Proposal") barColor = "bg-orange-500 dark:bg-orange-600";

                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{stage}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}