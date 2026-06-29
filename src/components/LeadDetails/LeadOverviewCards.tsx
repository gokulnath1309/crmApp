import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  DollarSign, Percent, AlertTriangle, User as UserIcon, Calendar, 
  History, BellRing 
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface LeadOverviewCardsProps {
  lead: any;
  lastActivity: any;
  nextReminder: any;
}

export function LeadOverviewCards({ lead, lastActivity, nextReminder }: LeadOverviewCardsProps) {
  const users = useQuery(api.users.list);

  if (!lead) return null;

  const ownerUser = users?.find((u: any) => u._id === lead.assignedTo);
  const ownerName = ownerUser?.name || "Unassigned";
  const ownerAvatar = ownerUser?.avatarUrl;

  // Probability mapper
  const getProbability = () => {
    if (lead.customFields?.probabilityOfSuccess !== undefined) {
      return Number(lead.customFields.probabilityOfSuccess);
    }
    const defaults: Record<string, number> = {
      "New": 10,
      "Contacted": 20,
      "Qualified": 40,
      "Proposal Sent": 60,
      "Negotiation": 80,
      "Won": 100,
      "Lost": 0,
      "Unqualified": 0,
    };
    return defaults[lead.status] || 10;
  };

  const prob = getProbability();

  // Color mapping based on values
  const getValueColor = (val?: number) => {
    if (!val) return "border-slate-100 dark:border-slate-800 text-slate-500";
    if (val >= 100000) return "border-emerald-500/25 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (val >= 25000) return "border-indigo-500/25 dark:border-indigo-500/10 text-indigo-650 dark:text-indigo-400";
    return "border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400";
  };

  const getPriorityColor = (p?: string) => {
    if (p === "Urgent" || p === "High") return "border-rose-500/25 dark:border-rose-500/15 text-rose-600 dark:text-rose-450 bg-rose-50/10";
    if (p === "Medium") return "border-amber-500/25 dark:border-amber-500/15 text-amber-600 dark:text-amber-450 bg-amber-50/10";
    return "border-slate-100 dark:border-slate-800 text-slate-500";
  };

  const getFollowUpColor = (rem?: any) => {
    if (!rem) return "border-slate-100 dark:border-slate-800 text-slate-400";
    const isOverdue = rem.dueDate < Date.now();
    return isOverdue
      ? "border-rose-500/25 dark:border-rose-500/15 text-rose-600 dark:text-rose-450 animate-pulse"
      : "border-indigo-500/25 dark:border-indigo-500/15 text-indigo-600 dark:text-indigo-400";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
      {/* 1. Estimated Value Card */}
      <div className={`bg-white dark:bg-slate-800 border p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px] ${getValueColor(lead.value)}`}>
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Est. Value</span>
          <DollarSign className="w-4 h-4 text-slate-350" />
        </div>
        <div className="mt-2.5">
          <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
            {lead.value !== undefined ? formatCurrency(lead.value, lead.currency || "INR") : "—"}
          </p>
          <span className="text-[9px] text-slate-400 font-medium">{lead.currency || "INR"}</span>
        </div>
      </div>

      {/* 2. Probability Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px]">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Probability</span>
          <Percent className="w-4 h-4 text-slate-350" />
        </div>
        <div className="mt-2.5">
          <p className="text-lg font-extrabold text-indigo-650 dark:text-indigo-400">
            {prob}%
          </p>
          <span className="text-[9px] text-slate-400 font-medium">Stage Confidence</span>
        </div>
      </div>

      {/* 3. Priority Card */}
      <div className={`bg-white dark:bg-slate-800 border p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px] ${getPriorityColor(lead.priority)}`}>
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Priority</span>
          <AlertTriangle className="w-4 h-4 text-slate-350" />
        </div>
        <div className="mt-2.5">
          <p className="text-sm font-extrabold uppercase tracking-wide truncate">
            {lead.priority || "Medium"}
          </p>
          <span className="text-[9px] text-slate-400 font-medium">Urgency Level</span>
        </div>
      </div>

      {/* 4. Owner Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px]">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lead Owner</span>
          {ownerAvatar ? (
            <img src={ownerAvatar} alt={ownerName} className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <UserIcon className="w-4 h-4 text-slate-350" />
          )}
        </div>
        <div className="mt-2.5 min-w-0">
          <p className="text-sm font-extrabold text-slate-850 dark:text-slate-150 truncate">
            {ownerName}
          </p>
          <span className="text-[9px] text-slate-400 font-medium">Sales Rep</span>
        </div>
      </div>

      {/* 5. Expected Close Date Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px]">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expected Close</span>
          <Calendar className="w-4 h-4 text-slate-350" />
        </div>
        <div className="mt-2.5">
          <p className="text-xs font-bold text-slate-805 dark:text-slate-105">
            {lead.customFields?.expectedClosingDate 
              ? new Date(lead.customFields.expectedClosingDate).toLocaleDateString()
              : "Not Decided"}
          </p>
          <span className="text-[9px] text-slate-405 font-medium">Closing Goal</span>
        </div>
      </div>

      {/* 6. Last Activity Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px]">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Activity</span>
          <History className="w-4 h-4 text-slate-350" />
        </div>
        <div className="mt-2.5">
          <p className="text-xs font-bold text-slate-805 dark:text-slate-105">
            {lastActivity 
              ? `${lastActivity.activityType} (${lastActivity.date})`
              : "No History"}
          </p>
          <span className="text-[9px] text-slate-400 font-medium">Sales interaction</span>
        </div>
      </div>

      {/* 7. Next Follow-up Card */}
      <div className={`bg-white dark:bg-slate-800 border p-4 rounded-2xl shadow-xs transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[105px] ${getFollowUpColor(nextReminder)}`}>
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Next Follow-up</span>
          <BellRing className="w-4 h-4 text-slate-350" />
        </div>
        <div className="mt-2.5">
          <p className="text-xs font-bold truncate">
            {nextReminder 
              ? new Date(nextReminder.dueDate).toLocaleDateString()
              : "No Reminder"}
          </p>
          <span className="text-[9px] text-slate-400 font-medium">Scheduled Alert</span>
        </div>
      </div>
    </div>
  );
}
