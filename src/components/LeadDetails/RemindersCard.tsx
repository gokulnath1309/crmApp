import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  BellRing, Plus, Clock, Trash2, Calendar, CheckSquare,
  Square, AlertCircle, RefreshCw, ChevronDown, Check, Loader2 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface RemindersCardProps {
  lead: any;
}

export function RemindersCard({ lead }: RemindersCardProps) {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Queries/Mutations from api.leads
  const reminders = useQuery(api.leads.listLeadReminders, lead ? { leadId: lead._id } : "skip");
  const createReminderMutation = useMutation(api.leads.createReminder);
  const completeReminderMutation = useMutation(api.leads.completeReminder);
  const updateReminderMutation = useMutation(api.leads.updateReminder);

  // State
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [snoozeOpenId, setSnoozeOpenId] = useState<string | null>(null);

  if (!lead) return null;

  // Permissions check
  const isAdminOrManager = currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "manager";
  const isAssignedToMe = lead.assignedTo === currentUser?._id;
  const isCreatedByMe = lead.createdBy === currentUser?._id;
  const canModify = isAdminOrManager || isAssignedToMe || isCreatedByMe;

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    setIsCreating(true);
    try {
      const dateTimeStr = `${newDate}T${newTime || "09:00"}:00`;
      const epoch = new Date(dateTimeStr).getTime();

      await createReminderMutation({
        leadId: lead._id,
        title: newTitle.trim(),
        dueDate: epoch,
      });

      setNewTitle("");
      setNewDate("");
      setNewTime("09:00");
      setShowAddForm(false);
      toast("success", "Reminder set successfully!");
    } catch (err: any) {
      toast("error", err.message || "Failed to create reminder");
    } finally {
      setIsCreating(false);
    }
  };

  const handleComplete = async (reminderId: string) => {
    try {
      await completeReminderMutation({ reminderId: reminderId as any });
      toast("success", "Reminder marked completed!");
    } catch (err: any) {
      toast("error", err.message || "Failed to complete reminder");
    }
  };

  const handleSnooze = async (reminder: any, minutes: number) => {
    setSnoozeOpenId(null);
    const newDueDate = reminder.dueDate + minutes * 60000;
    try {
      await updateReminderMutation({
        reminderId: reminder._id,
        title: reminder.title,
        dueDate: newDueDate,
      });
      toast("success", `Reminder snoozed for ${minutes} mins`);
    } catch (err: any) {
      toast("error", "Failed to snooze reminder");
    }
  };

  const activeReminders = reminders?.filter(r => !r.isCompleted) || [];

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/40 mb-4">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <BellRing className="w-4 h-4 text-indigo-505" /> Follow-up Alerts
        </h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Active: {activeReminders.length}
        </span>
      </div>

      {/* Add Reminder Form */}
      {canModify && (
        <div className="mb-4">
          {showAddForm ? (
            <form onSubmit={handleCreateReminder} className="bg-slate-50/50 dark:bg-slate-905/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-450 block mb-1 uppercase tracking-wider">Reminder Note</label>
                <input
                  type="text"
                  placeholder="e.g. Follow up call, send quote..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none text-slate-900 dark:text-white"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-450 block mb-1 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-450 block mb-1 uppercase tracking-wider">Due Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Reminder"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 px-4 border border-slate-205 text-slate-500 hover:bg-slate-5 hover:text-slate-750 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full h-9 border border-dashed border-indigo-250 hover:border-indigo-400 text-indigo-650 hover:bg-indigo-50/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Set Reminder Alert
            </button>
          )}
        </div>
      )}

      {/* Reminder feed */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[350px] space-y-2">
        {!reminders ? (
          <div className="space-y-2">
            <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : activeReminders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            No pending follow-up alerts set.
          </div>
        ) : (
          activeReminders.map((rem) => {
            const isOverdue = rem.dueDate < Date.now();
            const timeStr = new Date(rem.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={rem._id}
                className={`p-3.5 border rounded-2xl flex items-start justify-between gap-3 group relative transition-all ${
                  isOverdue
                    ? "bg-rose-50/15 dark:bg-rose-955/5 border-rose-100 dark:border-rose-900/30 ring-1 ring-rose-500/5"
                    : "bg-slate-50 dark:bg-slate-905/30 border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleComplete(rem._id)}
                    className="mt-0.5 text-indigo-650 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Square className="w-4 h-4 text-slate-350" />
                  </button>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-805 dark:text-slate-150 leading-snug">
                      {rem.title}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[9px] font-semibold uppercase tracking-wider">
                      <span className={`flex items-center gap-1 ${
                        isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-400"
                      }`}>
                        <Calendar className="w-3 h-3 text-slate-350" />
                        {new Date(rem.dueDate).toLocaleDateString()} at {timeStr}
                      </span>
                      {isOverdue && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-sm font-extrabold">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Snooze & delete controls */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={() => setSnoozeOpenId(snoozeOpenId === rem._id ? null : rem._id)}
                      className="h-6 px-2 border border-slate-200 bg-white text-[9px] rounded-lg text-slate-655 outline-none flex items-center gap-0.5 cursor-pointer hover:bg-slate-50"
                    >
                      Snooze <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {snoozeOpenId === rem._id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setSnoozeOpenId(null)} />
                        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          {[
                            { label: "15 mins", value: 15 },
                            { label: "1 hour", value: 60 },
                            { label: "Tomorrow", value: 1440 },
                            { label: "3 days", value: 4320 },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleSnooze(rem, opt.value)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              + {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
