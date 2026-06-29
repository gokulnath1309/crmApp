import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface NotificationSummaryProps {
  counts: {
    all: number;
    unread: number;
    deals: number;
    leads: number;
    tasks: number;
    system: number;
    mentions: number;
    calendar: number;
    employees: number;
    teams: number;
    reports: number;
  } | undefined;
}

export function NotificationSummary({ counts }: NotificationSummaryProps) {
  if (!counts) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs animate-pulse space-y-4">
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-sm w-1/3" />
        <div className="h-32 bg-slate-150 dark:bg-slate-700 rounded-full w-32 mx-auto" />
      </div>
    );
  }

  const { all, unread, deals, leads, tasks, system, mentions, calendar, employees, teams, reports } = counts;
  const read = Math.max(0, all - unread);

  // Prepare chart data for Categories (only show categories that have > 0 notifications)
  const categoryData = [
    { name: "Deals", value: deals, color: "#a855f7" }, // Purple
    { name: "Leads", value: leads, color: "#8b5cf6" }, // Indigo
    { name: "Tasks", value: tasks, color: "#3b82f6" }, // Blue
    { name: "System", value: system, color: "#f97316" }, // Orange
    { name: "Mentions", value: mentions, color: "#ec4899" }, // Pink
    { name: "Calendar", value: calendar, color: "#06b6d4" }, // Cyan
    { name: "Employees", value: employees, color: "#10b981" }, // Emerald
    { name: "Teams", value: teams, color: "#14b8a6" }, // Teal
    { name: "Reports", value: reports, color: "#eab308" }, // Yellow
  ].filter(d => d.value > 0);

  // Fallback if no categories
  if (categoryData.length === 0) {
    categoryData.push({ name: "System", value: 1, color: "#94a3b8" });
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-4">
        Notification Summary
      </h4>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Doughnut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md border border-slate-850 font-bold">
                        {data.name}: {data.value}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black text-slate-800 dark:text-slate-100">{all}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Total</span>
          </div>
        </div>

        {/* Statistics list */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-700/50 pb-1.5">
            <span className="text-slate-450 dark:text-slate-400 font-bold">Unread Feed</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{unread}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-700/50 pb-1.5">
            <span className="text-slate-450 dark:text-slate-400 font-bold">Read Feed</span>
            <span className="font-extrabold text-slate-600 dark:text-slate-350">{read}</span>
          </div>

          {/* Categories Legend */}
          <div className="pt-2">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">By Category</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {categoryData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-black text-slate-700 dark:text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
