import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { Navigate } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";
import { Select } from "@/components/ui/Select";
import {
  TrendingUp,
  Briefcase,
  Download,
  Award,
  DollarSign,
  Activity,
  Layers,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const STAGE_COLORS: Record<string, string> = {
  Prospecting: "#3b82f6",     // Blue
  Qualification: "#6366f1",   // Indigo
  Proposal: "#8b5cf6",        // Violet
  Negotiation: "#f97316",     // Orange
  "Verbal Commit": "#ec4899", // Pink
  "Closed Won": "#10b981",    // Emerald
  "Closed Lost": "#ef4444",   // Red
};

export function ReportsPage() {
  const { user: currentUser } = useUser();
  const metrics = useQuery(api.dashboard.getMetrics);
  const [activeTab, setActiveTab] = useState<"revenue" | "funnel" | "stages" | "leads">("revenue");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");

  // Role guard — ProtectedRoute above handles auth; this only checks role.
  if (currentUser && currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Get list of currencies present in the metrics
  const currencies = Array.from(
    new Set([
      ...Object.keys(metrics.closedRevenue || {}),
      ...Object.keys(metrics.totalPipelineValue || {}),
      ...Object.keys(metrics.weightedPipelineValue || {}),
      ...Object.keys(metrics.wonRevenue || {}),
      ...Object.keys(metrics.revenueForecast || {}),
    ])
  );

  const currencyOptions = [
    { value: "ALL", label: "All Currencies" },
    ...currencies.map(cur => ({ value: cur, label: `${cur} Focus` }))
  ];

  // If selectedCurrency is "ALL" but currencies has items, we default to the first one or INR if it exists
  const activeCurrency = selectedCurrency === "ALL" 
    ? (currencies.includes("INR") ? "INR" : currencies[0] || "INR")
    : selectedCurrency;

  // Prepare Revenue chart data
  const revenueChartData = currencies.map((cur) => ({
    currency: cur,
    "Closed Revenue": (metrics.closedRevenue as any)[cur] || 0,
    "Weighted Pipeline": (metrics.weightedPipelineValue as any)[cur] || 0,
    "Total Pipeline": (metrics.totalPipelineValue as any)[cur] || 0,
    "Forecast Revenue": (metrics.revenueForecast as any)[cur] || 0,
  }));

  // Prepare Deal Stage chart data
  const dealStageData = Object.entries(metrics.dealsByStage).map(([stage, count]) => ({
    stage,
    count,
    color: STAGE_COLORS[stage] || "#6366f1",
  }));

  // Prepare Pie Chart data for active pipeline vs closed revenue for active currency
  const activeCurrencyStats = [
    { name: "Closed Won", value: (metrics.closedRevenue as any)[activeCurrency] || 0, color: "#10b981" },
    { name: "Weighted Active Pipeline", value: (metrics.weightedPipelineValue as any)[activeCurrency] || 0, color: "#8b5cf6" },
    { name: "Forecast Opportunity", value: (metrics.revenueForecast as any)[activeCurrency] || 0, color: "#f97316" },
  ];

  // Calculate conversion rates
  const totalLeads = metrics.totalLeads || 0;
  const totalContacts = metrics.totalContacts || 0;
  const wonDeals = Object.values(metrics.dealsByStage).reduce((a, b) => a + b, 0); // approximation or closed won count
  const closedWonCount = metrics.dealsByStage["Closed Won"] || 0;
  
  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs font-semibold py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="text-slate-900 dark:text-white">
                {entry.name.includes("Count") || entry.name.includes("count")
                  ? entry.value
                  : formatCurrency(entry.value, entry.payload.currency || activeCurrency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Lead qualification metrics datasets
  const leadMetrics = metrics.leadMetrics;
  const funnelData = leadMetrics ? [
    { name: "New", count: leadMetrics.leadsByStatus.New + leadMetrics.leadsByStatus.Contacted + leadMetrics.leadsByStatus.Qualified + leadMetrics.leadsByStatus.Converted },
    { name: "Contacted", count: leadMetrics.leadsByStatus.Contacted + leadMetrics.leadsByStatus.Qualified + leadMetrics.leadsByStatus.Converted },
    { name: "Qualified", count: leadMetrics.leadsByStatus.Qualified + leadMetrics.leadsByStatus.Converted },
    { name: "Converted", count: leadMetrics.leadsByStatus.Converted },
  ] : [];

  const unqualifiedData = leadMetrics ? Object.entries(leadMetrics.unqualifiedReasons).map(([reason, count]) => ({
    reason,
    count,
  })) : [];

  const lostData = leadMetrics ? Object.entries(leadMetrics.lostReasons).map(([reason, count]) => ({
    reason,
    count,
  })) : [];

  const agingData = leadMetrics ? Object.entries(leadMetrics.leadAging).map(([age, count]) => ({
    name: age,
    value: count,
  })) : [];

  const spamCount = leadMetrics ? leadMetrics.leadsByStatus.Spam : 0;
  const duplicateCount = leadMetrics ? leadMetrics.leadsByStatus.Duplicate : 0;
  const validCount = leadMetrics ? (totalLeads - spamCount - duplicateCount) : 0;
  
  const qualityData = [
    { name: "Valid Leads", value: validCount, color: "#6366f1" },
    { name: "Spam", value: spamCount, color: "#ef4444" },
    { name: "Duplicate", value: duplicateCount, color: "#f97316" },
  ];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Currency,Value\n";

    // Add closed revenue
    Object.entries(metrics.closedRevenue || {}).forEach(([cur, val]) => {
      csvContent += `Closed Won Revenue,${cur},${val}\n`;
    });
    // Add total pipeline
    Object.entries(metrics.totalPipelineValue || {}).forEach(([cur, val]) => {
      csvContent += `Total Pipeline Value,${cur},${val}\n`;
    });
    // Add weighted pipeline
    Object.entries(metrics.weightedPipelineValue || {}).forEach(([cur, val]) => {
      csvContent += `Weighted Pipeline Value,${cur},${val}\n`;
    });
    // Add won revenue
    Object.entries(metrics.wonRevenue || {}).forEach(([cur, val]) => {
      csvContent += `Won Lead Revenue,${cur},${val}\n`;
    });
    // Add forecast revenue
    Object.entries(metrics.revenueForecast || {}).forEach(([cur, val]) => {
      csvContent += `Forecast Revenue (Proposal/Neg),${cur},${val}\n`;
    });

    // Add stages
    csvContent += "\nStage,Count\n";
    Object.entries(metrics.dealsByStage).forEach(([stage, count]) => {
      csvContent += `"${stage}",${count}\n`;
    });

    // General Stats
    csvContent += `\nGeneral Metric,Value\n`;
    csvContent += `Total Leads,${metrics.totalLeads}\n`;
    csvContent += `Total Contacts,${metrics.totalContacts}\n`;
    csvContent += `Win Rate,${metrics.winRate.toFixed(2)}%\n`;
    csvContent += `Lost Rate,${metrics.lostRate.toFixed(2)}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CRM_Analytics_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl pb-6 px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Sales & Pipeline Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deep-dive performance charts, conversion funnels, and revenue forecasting.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {currencies.length > 1 && (
            <Select
              options={currencyOptions}
              value={selectedCurrency}
              onChange={(val) => setSelectedCurrency(val)}
              className="w-36"
              triggerClassName="h-10 text-xs font-semibold"
            />
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Win Rate</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 leading-none">
              {metrics.winRate.toFixed(1)}%
            </h3>
            <span className="text-[10px] text-slate-400 block mt-1.5">
              Closed Won vs Closed Lost
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
            <Award className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Deals</p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 leading-none">
              {Object.entries(metrics.dealsByStage)
                .filter(([stage]) => stage !== "Closed Won" && stage !== "Closed Lost")
                .reduce((sum, [_, count]) => sum + count, 0)}
            </h3>
            <span className="text-[10px] text-slate-400 block mt-1.5">
              Deals currently in pipeline
            </span>
          </div>
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Closed Won Revenue</p>
            <div className="mt-1 space-y-0.5">
              {Object.keys(metrics.closedRevenue || {}).length === 0 ? (
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">—</h3>
              ) : (
                Object.entries(metrics.closedRevenue).slice(0, 2).map(([currency, amount]) => (
                  <div key={currency} className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                    {formatCurrency(amount, currency)}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weighted Forecast</p>
            <div className="mt-1 space-y-0.5">
              {Object.keys(metrics.weightedPipelineValue || {}).length === 0 ? (
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">—</h3>
              ) : (
                Object.entries(metrics.weightedPipelineValue).slice(0, 2).map(([currency, amount]) => (
                  <div key={currency} className="text-base font-extrabold text-indigo-650 dark:text-indigo-400 leading-none">
                    {formatCurrency(amount, currency)}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none border-b border-slate-150 dark:border-slate-800/80 pb-0.5">
        {[
          { id: "revenue", label: "Revenue & Forecasts", icon: DollarSign },
          { id: "stages", label: "Pipeline Stage Analysis", icon: Layers },
          { id: "funnel", label: "Conversion Funnel", icon: Activity },
          { id: "leads", label: "Lead Qualification & Quality", icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold transition-all relative border-b-2 cursor-pointer flex-shrink-0 ${
              activeTab === tab.id
                ? "border-indigo-650 text-indigo-650 dark:border-indigo-455 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-850 dark:hover:text-slate-350"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Section */}
      {activeTab === "leads" ? (
        <div className="w-full space-y-6">
          {/* Detailed Leads Qualification Dashboard */}
          {metrics.leadMetrics && (
            <>
              {/* Funnel & Employee Conversion Rate Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex flex-col justify-between min-h-[clamp(250px,40vw,400px)]">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lead Qualification Conversion Funnel
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visual conversion steps and rates down the lifecycle.
                    </p>
                  </div>
                  <div className="py-4 flex flex-col justify-center gap-4 flex-1 mt-4">
                    {funnelData.map((stage, i, arr) => {
                      const maxVal = arr[0].count || 1;
                      const widthPercent = maxVal > 0 ? (stage.count / maxVal) * 100 : 0;
                      const prevVal = i > 0 ? arr[i-1].count : 0;
                      const conversionRate = prevVal > 0 ? (stage.count / prevVal) * 100 : 100;
                      const colors = ["bg-blue-600", "bg-indigo-600", "bg-violet-600", "bg-emerald-600"];

                      return (
                        <div key={stage.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-350">{stage.name} Stage</span>
                            <div className="flex items-center gap-2">
                              {i > 0 && (
                                <span className="text-[10px] text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-mono">
                                  {conversionRate.toFixed(1)}% conv.
                                </span>
                              )}
                              <span className="text-slate-900 dark:text-white font-bold">{stage.count}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-6 flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg overflow-hidden border border-slate-100/50 dark:border-slate-700 flex items-center px-1">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(widthPercent, 5)}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className={`h-4 rounded-md ${colors[i % colors.length]} flex items-center justify-end px-2`}
                              >
                                {widthPercent > 15 && (
                                  <span className="text-[8px] font-extrabold text-white uppercase tracking-wider">{stage.name}</span>
                                )}
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Employee Conversion Rates Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex flex-col justify-between min-h-[clamp(250px,40vw,400px)]">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Employee Conversion Rates
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lead to deal conversion rates compared across different employees.
                    </p>
                  </div>
                  {metrics.leadMetrics.employeeConversionRate.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                      No conversions logged per employee.
                    </div>
                  ) : (
                    <div className="h-72 w-full mt-4 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.leadMetrics.employeeConversionRate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.15)" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                          <YAxis tickFormatter={(val) => `${val}%`} tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                          <Tooltip formatter={(val) => [`${val}%`, "Conversion Rate"]} />
                          <Bar dataKey="conversionRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Unqualified & Lost Reasons Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unqualified Reasons Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex flex-col justify-between min-h-[clamp(220px,35vw,350px)]">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Unqualified Leads by Reason
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Breakdown of reasons why leads were archived as unqualified.
                    </p>
                  </div>
                  {unqualifiedData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                      No unqualified leads logged.
                    </div>
                  ) : (
                    <div className="h-56 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={unqualifiedData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(203, 213, 225, 0.15)" />
                          <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                          <YAxis dataKey="reason" type="category" tickLine={false} axisLine={false} className="text-[10px] font-bold text-slate-500" width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Lost Reasons Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex flex-col justify-between min-h-[clamp(220px,35vw,350px)]">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lost Leads by Reason
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Breakdown of reasons why leads were closed as lost.
                    </p>
                  </div>
                  {lostData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                      No lost leads logged.
                    </div>
                  ) : (
                    <div className="h-56 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lostData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(203, 213, 225, 0.15)" />
                          <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                          <YAxis dataKey="reason" type="category" tickLine={false} axisLine={false} className="text-[10px] font-bold text-slate-500" width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Aging & Lead Quality Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Aging Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex flex-col justify-between min-h-[clamp(220px,35vw,350px)]">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lead Aging Distribution
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Time elapsed since creation for active leads in pipeline.
                    </p>
                  </div>
                  {agingData.every(d => d.value === 0) ? (
                    <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                      No active leads in pipeline.
                    </div>
                  ) : (
                    <div className="h-56 w-full mt-4 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={agingData.filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {agingData.filter(d => d.value > 0).map((_, index) => {
                              const colors = ["#10b981", "#f97316", "#ef4444"];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Lead Quality breakdown Card */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex flex-col justify-between min-h-[clamp(220px,35vw,350px)]">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Lead Database Quality
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Proportion of valid database opportunities vs Spam and Duplicate entries.
                    </p>
                  </div>
                  {qualityData.every(d => d.value === 0) ? (
                    <div className="h-48 flex items-center justify-center text-sm text-slate-400">
                      No lead quality metrics available.
                    </div>
                  ) : (
                    <div className="h-56 w-full mt-4 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={qualityData.filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {qualityData.filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-6 shadow-sm flex flex-col justify-between min-h-[clamp(280px,45vw,420px)]">
          <AnimatePresence mode="wait">
            {activeTab === "revenue" && (
              <motion.div
                key="revenue-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 h-full flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Revenue Performance by Currency
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                    Comparison of actual won revenue against total and risk-adjusted active pipeline.
                  </p>
                </div>
                {revenueChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                    No transaction or pipeline data available.
                  </div>
                ) : (
                  <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.15)" />
                        <XAxis dataKey="currency" tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                        <YAxis tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.04)" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, color: "#64748b", paddingTop: 10 }} />
                        <Bar dataKey="Closed Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Weighted Pipeline" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Total Pipeline" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "stages" && (
              <motion.div
                key="stages-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 h-full flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Deals Count by Stage
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                    Distribution of active and closed deals across stages of the sales process.
                  </p>
                </div>
                {dealStageData.every(d => d.count === 0) ? (
                  <div className="h-64 flex items-center justify-center text-sm text-slate-400">
                    No deals in pipeline.
                  </div>
                ) : (
                  <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dealStageData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(203, 213, 225, 0.15)" />
                        <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] font-semibold text-slate-400" />
                        <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} className="text-[10px] font-bold text-slate-500" width={100} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.04)" }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                          {dealStageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "funnel" && (
              <motion.div
                key="funnel-chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 h-full flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Lead to Customer Funnel
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                    Conversion tracking from initial lead creation through closed-won deals.
                  </p>
                </div>
                <div className="py-6 flex flex-col justify-center gap-6 h-72">
                  {[
                    { label: "Total Leads", value: totalLeads, desc: "Top of Funnel Interest", color: "bg-indigo-600" },
                    { label: "Contacts Created", value: totalContacts, desc: "Engaged Contacts / Qualified", color: "bg-violet-600" },
                    { label: "Deals Created", value: wonDeals, desc: "Active Sales Opportunities", color: "bg-pink-500" },
                    { label: "Closed Won Deals", value: closedWonCount, desc: "Converted Customers", color: "bg-emerald-500" },
                  ].map((stage, i, arr) => {
                    const maxVal = arr[0].value || 1;
                    const widthPercent = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
                    const prevVal = i > 0 ? arr[i-1].value : 0;
                    const conversionRate = prevVal > 0 ? (stage.value / prevVal) * 100 : 100;

                    return (
                      <div key={stage.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-350">{stage.label}</span>
                          <div className="flex items-center gap-2">
                            {i > 0 && (
                              <span className="text-[10px] text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-mono">
                                {conversionRate.toFixed(1)}% conv.
                              </span>
                            )}
                            <span className="text-slate-900 dark:text-white font-bold">{stage.value}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg overflow-hidden border border-slate-100/50 dark:border-slate-750/30 flex items-center px-1">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(widthPercent, 5)}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className={`h-4 rounded-md ${stage.color} flex items-center justify-end px-2`}
                            >
                              {widthPercent > 15 && (
                                <span className="text-[8px] font-extrabold text-white uppercase tracking-wider">{stage.desc}</span>
                              )}
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Currency Focus Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-6 shadow-sm flex flex-col justify-between min-h-[clamp(280px,45vw,420px)]">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {activeCurrency} Performance Summary
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
              Breakdown of total revenue allocation for {activeCurrency}.
            </p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeCurrencyStats.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {activeCurrencyStats.filter(item => item.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), activeCurrency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Focused</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(
                  activeCurrencyStats.reduce((sum, item) => sum + item.value, 0),
                  activeCurrency
                )}
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-50 dark:border-slate-700/40 pt-4 mt-2">
            {activeCurrencyStats.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-semibold py-1 hover:bg-slate-50 dark:hover:bg-slate-700/20 px-2 rounded-lg transition-colors">
                <span className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(item.value, activeCurrency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Reports Breakdown Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Currency Breakdown Matrix
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
            Tabular summary of transaction flow, active leads, and forecasts grouped by currency.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-50 dark:border-slate-750/30 rounded-xl">
          <table className="w-full min-w-[650px] border-collapse text-left text-slate-900 dark:text-white">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-750/50 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3.5">Currency</th>
                <th className="px-6 py-3.5 text-right">Closed Won Revenue</th>
                <th className="px-6 py-3.5 text-right">Active Pipeline Value</th>
                <th className="px-6 py-3.5 text-right">Weighted Pipeline</th>
                <th className="px-6 py-3.5 text-right">Forecast Revenue</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/40 dark:divide-slate-750/20 text-xs font-semibold">
              {currencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                    No financial data available.
                  </td>
                </tr>
              ) : (
                currencies.map((cur) => (
                  <tr key={cur} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 text-slate-900 dark:text-white font-extrabold uppercase tracking-wider">{cur}</td>
                    <td className="px-6 py-3 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency((metrics.closedRevenue as any)[cur] || 0, cur)}
                    </td>
                    <td className="px-6 py-3 text-right text-blue-600 dark:text-blue-400">
                      {formatCurrency((metrics.totalPipelineValue as any)[cur] || 0, cur)}
                    </td>
                    <td className="px-6 py-3 text-right text-violet-600 dark:text-violet-400">
                      {formatCurrency((metrics.weightedPipelineValue as any)[cur] || 0, cur)}
                    </td>
                    <td className="px-6 py-3 text-right text-orange-600 dark:text-orange-400">
                      {formatCurrency((metrics.revenueForecast as any)[cur] || 0, cur)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setSelectedCurrency(cur)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          activeCurrency === cur
                            ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/30 dark:border-indigo-850 dark:text-indigo-400"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
                        }`}
                      >
                        Focus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
