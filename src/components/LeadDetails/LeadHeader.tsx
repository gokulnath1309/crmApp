import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Building, Edit, Trash2, Share2, MoreHorizontal, Check, 
  Sparkles, Calendar, Clock, User as UserIcon
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getPermissions } from "@/lib/permissions";

interface LeadHeaderProps {
  lead: any;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChangeClick: () => void;
}

export function LeadHeader({ lead, onEdit, onDelete, onStatusChangeClick }: LeadHeaderProps) {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const users = useQuery(api.users.list);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!lead) return null;

  const permissions = getPermissions(currentUser);
  const ownerUser = users?.find((u: any) => u._id === lead.assignedTo);
  const ownerName = ownerUser?.name || "Unassigned";

  // Permission Logic
  const isAdminOrManager = currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "manager";
  const isAssignedToMe = lead.assignedTo === currentUser?._id;
  const isCreatedByMe = lead.createdBy === currentUser?._id;
  const canModify = isAdminOrManager || isAssignedToMe || isCreatedByMe;

  // Status Badge styling
  const statusStyles: Record<string, string> = {
    "New": "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-350 dark:border-slate-650",
    "Contacted": "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    "Qualified": "bg-violet-50 text-violet-755 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30",
    "Proposal Sent": "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30",
    "Negotiation": "bg-amber-50 text-amber-705 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    "Won": "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    "Lost": "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30",
    "Unqualified": "bg-gray-105 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  };

  const statusStyle = statusStyles[lead.status] || statusStyles["New"];

  // Priority Badge styling
  const priorityStyles: Record<string, string> = {
    "Urgent": "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-400 dark:border-rose-900/20",
    "High": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-955/30 dark:text-orange-400 dark:border-orange-900/20",
    "Medium": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/20",
    "Low": "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };

  const priorityStyle = priorityStyles[lead.priority || "Medium"];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast("success", "Lead workspace URL copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-200 hover:shadow-md">
      {/* Lead Left: Avatar and Identity */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
          <Building className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              {lead.company}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${statusStyle}`}>
              {lead.status}
            </span>
            {lead.priority && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityStyle}`}>
                {lead.priority}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-350 mt-1">
            Primary Contact: <span className="text-slate-900 dark:text-white">{lead.firstName} {lead.lastName}</span>
            {lead.jobTitle && <span className="text-slate-400 dark:text-slate-500 font-normal"> • {lead.jobTitle}</span>}
          </p>
          
          {/* Metadata timeline logs */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              Created: {new Date(lead.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              Updated: {new Date(lead.updatedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-300" />
              Owner: <strong className="text-slate-700 dark:text-slate-300">{ownerName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Lead Right: Value, Score, and Actions */}
      <div className="flex flex-wrap items-center gap-4 md:self-center">
        {/* Quality Score Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/10 rounded-xl">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-xs text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
            Score: <strong className="text-slate-900 dark:text-white">{lead.score || 0}/100</strong>
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {canModify && (
            <button
              onClick={onEdit}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-805 font-bold text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}

          {canModify && permissions.canViewAllData && (
            <button
              onClick={onDelete}
              className="h-10 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-950/15 dark:hover:bg-rose-955/25 dark:text-rose-400 font-bold text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}

          <button
            onClick={handleShare}
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-805 font-bold text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />} Share
          </button>

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1.5 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onStatusChangeClick();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
                  >
                    🔄 Advance Stage
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <div className="px-4 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Role: {currentUser?.role || "employee"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
