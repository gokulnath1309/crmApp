import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  History, Search, Pin, Trash2, Edit3, ChevronDown, 
  ChevronUp, Phone, Mail, MessageSquare, Video, 
  Sparkles, FileText, Plus, Clock, User as UserIcon, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ActivityTimelineProps {
  lead: any;
  activities: any[] | undefined;
  transitions?: any[] | undefined;
}

export function ActivityTimeline({ lead, activities, transitions }: ActivityTimelineProps) {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const users = useQuery(api.users.list);

  // Mutations
  const pinMutation = useMutation(api.leads.pinActivity);
  const updateMutation = useMutation(api.leads.updateActivity);
  const deleteMutation = useMutation(api.leads.deleteActivity);

  // State
  const [searchVal, setSearchVal] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedDatePreset, setSelectedDatePreset] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Edit activity state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  if (!lead) return null;

  // Icons mapper based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Phone Call":
        return <Phone className="w-3.5 h-3.5 text-emerald-600" />;
      case "Email":
        return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case "WhatsApp":
      case "SMS":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case "Meeting":
      case "Video Call":
        return <Video className="w-3.5 h-3.5 text-amber-600" />;
      case "Demo":
        return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
      case "Proposal":
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case "Note":
      case "Internal Note":
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
      case "Lead Created":
        return <Plus className="w-3.5 h-3.5 text-indigo-650" />;
      case "Lead Lost":
      case "Lead Unqualified":
      case "Lead Spam":
      case "Duplicate Lead":
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case "Lead Reopened":
        return <Clock className="w-3.5 h-3.5 text-indigo-650" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getNodeBg = (type: string) => {
    switch (type) {
      case "Phone Call": return "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20";
      case "Email": return "bg-blue-50 border-blue-100 dark:bg-blue-950/20";
      case "Meeting": return "bg-amber-50 border-amber-100 dark:bg-amber-955/20";
      case "Demo": return "bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20";
      case "Proposal": return "bg-rose-50 border-rose-100 dark:bg-rose-955/20";
      case "Lead Created": return "bg-indigo-50 border-indigo-105 dark:bg-indigo-950/20";
      case "Lead Lost":
      case "Lead Unqualified":
      case "Lead Spam":
      case "Duplicate Lead":
        return "bg-rose-50 border-rose-100 dark:bg-rose-950/20";
      default: return "bg-slate-50 border-slate-200 dark:bg-slate-805/40";
    }
  };

  // Filter Activities
  const getFilteredActivities = () => {
    const allItems: any[] = [];

    // Add normal manual activities
    if (activities) {
      allItems.push(...activities);
    }

    // Add stage transitions as formatted system events
    if (transitions) {
      for (const t of transitions) {
        let actionType = "Status Change";
        let summary = `Status changed from ${t.fromStage} to ${t.toStage}`;
        let notes = "";

        if (t.toStage === "Lost") {
          actionType = "Lead Lost";
          summary = "Lead marked as Lost";
          notes = `Reason: ${t.data?.lostReason || "N/A"}\nNotes: ${t.data?.lostNotes || ""}`;
        } else if (t.toStage === "Unqualified") {
          actionType = "Lead Unqualified";
          summary = "Lead marked as Unqualified";
          notes = `Reason: ${t.data?.unqualifiedReason || "N/A"}\nNotes: ${t.data?.unqualifiedNotes || ""}`;
        } else if (t.toStage === "Spam") {
          actionType = "Lead Spam";
          summary = "Lead marked as Spam";
          notes = `Reason: ${t.data?.spamReason || "N/A"}\nNotes: ${t.data?.spamNotes || ""}`;
        } else if (t.toStage === "Duplicate") {
          actionType = "Duplicate Lead";
          summary = "Merged as Duplicate";
          notes = `Merged into Lead ID: ${t.data?.mergedIntoLeadId || "N/A"}\nNotes: ${t.data?.notes || ""}`;
        } else if (t.fromStage && ["Lost", "Unqualified", "Spam", "Duplicate"].includes(t.fromStage) && t.toStage === "Contacted") {
          actionType = "Lead Reopened";
          summary = "Lead reopened";
          notes = `Reopening Reason: ${t.data?.requalificationReason || "N/A"}`;
        }

        allItems.push({
          _id: t._id,
          activityType: actionType,
          summary,
          notes,
          userId: t.userId,
          userName: t.userName,
          createdAt: t.transitionedAt,
          date: new Date(t.transitionedAt).toLocaleDateString(),
          time: new Date(t.transitionedAt).toLocaleTimeString(),
          isSystemEvent: true,
        });
      }
    }

    // Add synthetic lead creation event
    if (lead) {
      allItems.push({
        _id: "creation",
        activityType: "Lead Created",
        summary: "Lead created in system",
        notes: lead.initialNotes || "No initial notes provided.",
        userId: lead.createdBy || "",
        userName: "System",
        createdAt: lead.createdAt,
        date: new Date(lead.createdAt).toLocaleDateString(),
        time: new Date(lead.createdAt).toLocaleTimeString(),
        isSystemEvent: true,
      });
    }

    let filtered = [...allItems];

    // 1. Search text
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.summary.toLowerCase().includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q)) ||
          a.activityType.toLowerCase().includes(q)
      );
    }

    // 2. Activity Type
    if (selectedType !== "All") {
      filtered = filtered.filter((a) => a.activityType === selectedType);
    }

    // 3. User
    if (selectedUser !== "All") {
      filtered = filtered.filter((a) => a.userId === selectedUser);
    }

    // 4. Date presets
    if (selectedDatePreset !== "All") {
      const now = Date.now();
      let limitMs = 0;
      if (selectedDatePreset === "Today") limitMs = 24 * 60 * 60 * 1000;
      if (selectedDatePreset === "7days") limitMs = 7 * 24 * 60 * 60 * 1000;
      if (selectedDatePreset === "30days") limitMs = 30 * 24 * 60 * 60 * 1000;

      filtered = filtered.filter((a) => (now - a.createdAt) <= limitMs);
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  };

  const handlePinToggle = async (activityId: string) => {
    try {
      await pinMutation({ activityId: activityId as any });
      toast("success", "Activity pinned state updated");
    } catch (err: any) {
      toast("error", err.message || "Failed to pin activity");
    }
  };

  const handleStartEdit = (activity: any) => {
    setEditingId(activity._id);
    setEditNotes(activity.notes || "");
  };

  const handleSaveEdit = async (activityId: string) => {
    try {
      await updateMutation({
        activityId: activityId as any,
        notes: editNotes,
      });
      setEditingId(null);
      toast("success", "Activity notes updated");
    } catch (err: any) {
      toast("error", err.message || "Failed to update activity");
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity log?")) return;
    try {
      await deleteMutation({ activityId: activityId as any });
      toast("success", "Activity deleted successfully");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete activity");
    }
  };

  const filtered = getFilteredActivities();

  // Activity Types present in timeline for filter options
  const uniqueTypes = ["Phone Call", "Meeting", "Email", "WhatsApp", "Demo", "Proposal", "Note", "Lead Created", "Status Change", "Lead Lost", "Lead Unqualified", "Lead Spam", "Lead Reopened", "Duplicate Lead"];

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/40 mb-4">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-505" /> Interaction History
        </h3>

        {/* Global Search inside Timeline */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search timeline..."
            className="w-full h-8.5 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-905 text-xs outline-none text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">Creator</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">Everyone</option>
            {users?.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">Date</label>
          <select
            value={selectedDatePreset}
            onChange={(e) => setSelectedDatePreset(e.target.value)}
            className="w-full bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Activities Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[500px]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
            <Clock className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs italic">No matching activities logged.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-200 dark:border-slate-750 ml-3 py-1 space-y-4">
            {filtered.map((act) => {
              const isExpanded = expandedId === act._id;
              const isEditing = editingId === act._id;
              
              // Permission check
              const isCreator = act.userId === currentUser?._id;
              const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
              const canEdit = !act.isSystemEvent && (isCreator || isAdmin);
              const canDelete = !act.isSystemEvent && (isCreator || isAdmin);
              const canPin = !act.isSystemEvent;

              return (
                <div key={act._id} className="relative group">
                  {/* Timeline indicator node */}
                  <div className={`absolute -left-[32px] top-1 w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-slate-800 shadow-sm z-10 ${getNodeBg(act.activityType)}`}>
                    {getActivityIcon(act.activityType)}
                  </div>

                  {/* Activity Card */}
                  <div className={`bg-slate-50/50 dark:bg-slate-900/10 border p-3 rounded-2xl transition-all duration-150 ${
                    act.isPinned 
                      ? "border-amber-200 dark:border-amber-900/20 bg-amber-50/5 dark:bg-amber-955/5 shadow-xs" 
                      : "border-slate-100/60 dark:border-slate-750/30"
                  }`}>
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-200/60 dark:bg-slate-800 text-slate-655 dark:text-slate-400 rounded-sm">
                          {act.activityType}
                        </span>
                        {act.stageAtTime && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                            at stage {act.stageAtTime}
                          </span>
                        )}
                        {act.isPinned && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600">
                            📌 Pinned
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canPin && (
                          <button
                            onClick={() => handlePinToggle(act._id)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              act.isPinned 
                                ? "text-amber-500 hover:bg-amber-100/20" 
                                : "text-slate-350 hover:text-slate-600 hover:bg-slate-105"
                            }`}
                          >
                            <Pin className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {canEdit && !isEditing && (
                          <button
                            onClick={() => handleStartEdit(act)}
                            className="p-1 text-slate-350 hover:text-slate-600 hover:bg-slate-105 rounded-md cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(act._id)}
                            className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Summary / Notes */}
                    <div className="mt-1.5">
                      <p className="text-xs font-bold text-slate-805 dark:text-slate-100 leading-snug">
                        {act.summary}
                      </p>
                      
                      {isEditing ? (
                        <div className="mt-2 space-y-1.5">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                            className="w-full p-2.5 text-xs rounded-xl border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleSaveEdit(act._id)}
                              className="h-7 px-3 bg-indigo-650 hover:bg-indigo-755 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Save Edit
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="h-7 px-3 border border-slate-205 text-slate-500 hover:bg-slate-50 rounded-lg text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        act.notes && (
                          <div className="mt-1.5">
                            <div className={`text-xs text-slate-550 dark:text-slate-400 bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-750/20 whitespace-pre-wrap ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}>
                              {act.notes}
                            </div>
                            {act.notes.length > 100 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : act._id)}
                                className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold hover:underline mt-1 flex items-center gap-0.5 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>Show less <ChevronUp className="w-3 h-3" /></>
                                ) : (
                                  <>Read full note <ChevronDown className="w-3 h-3" /></>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100/50 dark:border-slate-800/40 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-350" />
                        By: {act.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-350" />
                        {act.date} {act.time || ""}
                      </span>
                    </div>

                    {/* Attachments mapping */}
                    {act.attachments && act.attachments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100/50 dark:border-slate-800/40">
                        <span className="text-[9px] font-extrabold text-slate-400">Attached:</span>
                        {act.attachments.map((file: string, fIdx: number) => (
                          <span key={fIdx} className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 rounded font-semibold border border-slate-200/50">
                            📎 {file}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
