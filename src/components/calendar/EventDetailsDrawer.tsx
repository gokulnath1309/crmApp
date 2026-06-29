import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "../ui/Toast";
import {
  X, Calendar, Clock, MapPin, Video, User, Users,
  Edit3, Trash2, Copy, ExternalLink,
  Phone, Repeat, CheckSquare, Monitor, GraduationCap,
  Umbrella, MoreHorizontal, Tag, FileText, Bell,
} from "lucide-react";

const EVENT_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  Meeting: { icon: Calendar, label: "Meeting", color: "#4F46E5" },
  Call: { icon: Phone, label: "Call", color: "#059669" },
  "Follow-up": { icon: Repeat, label: "Follow-up", color: "#D97706" },
  Task: { icon: CheckSquare, label: "Task", color: "#DC2626" },
  Demo: { icon: Monitor, label: "Demo", color: "#7C3AED" },
  Presentation: { icon: Monitor, label: "Presentation", color: "#2563EB" },
  "Site Visit": { icon: MapPin, label: "Site Visit", color: "#0891B2" },
  Training: { icon: GraduationCap, label: "Training", color: "#0D9488" },
  Personal: { icon: User, label: "Personal", color: "#9333EA" },
  Holiday: { icon: Umbrella, label: "Holiday", color: "#E11D48" },
  Other: { icon: MoreHorizontal, label: "Other", color: "#64748B" },
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-amber-100 text-amber-700",
  Urgent: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  Scheduled: "bg-indigo-100 text-indigo-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
  Missed: "bg-amber-100 text-amber-700",
  Rescheduled: "bg-blue-100 text-blue-700",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface EventDetailsDrawerProps {
  event: any;
  users: { _id: string; name: string; email: string }[];
  onClose: () => void;
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  onDuplicate: (event: any) => void;
}

export function EventDetailsDrawer({ event, users, onClose, onEdit, onDelete, onDuplicate }: EventDetailsDrawerProps) {
  const removeEvent = useMutation(api.events.remove);
  const updateStatus = useMutation(api.events.updateStatus);
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const userMap = useMemo(() => {
    const map: Record<string, { name: string; email: string }> = {};
    (users || []).forEach((u: any) => { map[u._id] = { name: u.name || "Unknown", email: u.email }; });
    return map;
  }, [users]);

  if (!event) return null;

  const config = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.Other;
  const Icon = config.icon;
  const owner = userMap[event.ownerId];
  const assignedUser = userMap[event.assignedTo];
  const createdByUser = userMap[event.createdBy];

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeEvent({ id: event._id });
      toast("success", "Event deleted");
      onDelete(event);
      onClose();
    } catch (err: any) {
      toast("error", err.message || "Failed to delete event");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await updateStatus({ id: event._id, status: newStatus });
      toast("success", `Event marked as ${newStatus}`);
    } catch (err: any) {
      toast("error", err.message || "Failed to update status");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-slate-100 dark:border-slate-700/70">
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(event)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors" title="Edit">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => onDuplicate(event)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Duplicate">
                <Copy className="w-4 h-4" />
              </button>
              {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-red-600 font-medium">Delete?</span>
                  <button onClick={handleDelete} disabled={deleting} className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                    {deleting ? "..." : "Yes"}
                  </button>
                  <button onClick={() => setShowConfirm(false)} className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    No
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title + Type + Status */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: config.color + "20" }}>
              <Icon className="w-6 h-6" style={{ color: config.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.color + "20", color: config.color }}>
                  {config.label}
                </span>
                {event.status && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] || "bg-slate-100 text-slate-600"}`}>
                    {event.status}
                  </span>
                )}
                {event.priority && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[event.priority] || "bg-slate-100 text-slate-600"}`}>
                    {event.priority}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl px-4 py-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Date/Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p>{formatDate(event.start)}{event.allDay ? " (All day)" : `, ${formatTime(event.start)}`}</p>
                <p>to {formatDate(event.end)}{!event.allDay && `, ${formatTime(event.end)}`}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{event.location}{event.locationType ? ` (${event.locationType})` : ""}</span>
              </div>
            )}

            {event.meetingLink && (
              <div className="flex items-center gap-3 text-sm">
                <Video className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  {event.meetingProvider?.replace("_", " ") || "Join Meeting"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {event.reminder && event.reminder !== "None" && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Reminder: {event.reminder} before</span>
              </div>
            )}

            {event.repeat && event.repeat !== "None" && (
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Repeat className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Repeats: {event.repeat}</span>
              </div>
            )}
          </div>

          {/* People & Related */}
          {(event.relatedType || owner || assignedUser || createdByUser || (event.guests && event.guests.length > 0)) && (
            <div className="border-t border-slate-100 dark:border-slate-700/70 pt-4 space-y-3">
              {event.relatedType && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Related {event.relatedType}: {event.relatedId}</span>
                </div>
              )}
              {owner && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Owner: {owner.name}</span>
                </div>
              )}
              {assignedUser && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Assigned to: {assignedUser.name}</span>
                </div>
              )}
              {createdByUser && (
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Created by: {createdByUser.name}</span>
                </div>
              )}
              {event.guests && event.guests.length > 0 && (
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Guests:</span>
                    <div className="mt-1 space-y-0.5">
                      {event.guests.map((g: string, i: number) => (
                        <div key={i} className="text-slate-500">{g}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="border-t border-slate-100 dark:border-slate-700/70 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-700/30 rounded-xl px-4 py-3">{event.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-slate-100 dark:border-slate-700/70 pt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>
              <span className="block">Created</span>
              <span>{event.createdAt ? formatDate(event.createdAt) : "-"}</span>
            </div>
            <div>
              <span className="block">Updated</span>
              <span>{event.updatedAt ? formatDate(event.updatedAt) : "-"}</span>
            </div>
          </div>

          {/* Quick Status */}
          <div className="border-t border-slate-100 dark:border-slate-700/70 pt-4">
            <span className="text-xs font-semibold text-slate-500 block mb-2">Quick Status:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {["Completed", "Cancelled", "Rescheduled"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={event.status === s}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    event.status === s
                      ? "bg-indigo-100 text-indigo-700 cursor-default"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
