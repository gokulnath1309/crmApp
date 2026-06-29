import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  Calendar, Clock, User, Tag, ArrowRight,
  Trash2, RotateCcw, History, Loader2,
} from "lucide-react";

interface TaskDetailModalProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Cancelled: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  Medium: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Urgent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function TaskDetailModal({ taskId, open, onClose, onUpdate }: TaskDetailModalProps) {
  const { toast } = useToast();
  const task = useQuery(api.tasks.getById, taskId ? { id: taskId as any } : "skip");
  const history = useQuery(api.tasks.getHistory, taskId ? { taskId: taskId as any } : "skip");
  const users = useQuery(api.users.list);

  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const restoreTask = useMutation(api.tasks.restore);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset form when task changes
  const savedTask = task as Doc<"tasks"> | null;
  if (savedTask && !editing && title !== savedTask.title) {
    setTitle(savedTask.title);
    setDescription(savedTask.description || "");
    setDueDate(new Date(savedTask.dueDate).toISOString().split("T")[0]);
    setStatus(savedTask.status);
    setPriority(savedTask.priority);
    setAssignedTo(savedTask.assignedTo || "");
  }

  const isDeleted = savedTask?.deletedAt;
  const userMap = new Map(users?.map((u: any) => [u._id, u]) || []);

  const getAssigneeName = (id?: string) => {
    if (!id) return "Unassigned";
    const u = userMap.get(id) as any;
    return u?.name || "Unknown";
  };

  async function handleSave() {
    if (!taskId || !title.trim()) return;
    setSaving(true);
    try {
      await updateTask({
        id: taskId as any,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : savedTask!.dueDate,
        status: status as any,
        priority: priority as any,
        assignedTo: assignedTo ? (assignedTo as any) : undefined,
      });
      toast("success", "Task updated");
      setEditing(false);
      onUpdate();
    } catch (e: any) {
      toast("error", e.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!taskId) return;
    try {
      await removeTask({ id: taskId as any });
      toast("success", "Task cancelled");
      onClose();
      onUpdate();
    } catch (e: any) {
      toast("error", e.message || "Failed to delete task");
    }
  }

  async function handleRestore() {
    if (!taskId) return;
    try {
      await restoreTask({ id: taskId as any });
      toast("success", "Task restored");
      onUpdate();
    } catch (e: any) {
      toast("error", e.message || "Failed to restore task");
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl">
      {!savedTask ? (
        <div className="space-y-3 py-8">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Title */}
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className={cn("text-lg font-bold text-slate-900 dark:text-white", isDeleted && "line-through opacity-60")}>
                  {savedTask.title}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[savedTask.status] || STATUS_COLORS.Pending)}>
                    {savedTask.status}
                  </span>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", PRIORITY_STYLES[savedTask.priority] || PRIORITY_STYLES.Medium)}>
                    {savedTask.priority}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Description</label>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">{savedTask.description || "No description"}</p>
            )}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Status</label>
              {editing ? (
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[savedTask.status])}>{savedTask.status}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
              {editing ? (
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              ) : (
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", PRIORITY_STYLES[savedTask.priority])}>{savedTask.priority}</span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Due Date</label>
              {editing ? (
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(savedTask.dueDate)}
                  {savedTask.status !== "Completed" && savedTask.dueDate < Date.now() && (
                    <span className="text-red-500 text-xs font-semibold">Overdue</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Assignee</label>
              {editing ? (
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Unassigned</option>
                  {users?.map((u: any) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {savedTask.assignedTo ? (
                    <>
                      <Avatar name={getAssigneeName(savedTask.assignedTo)} size="sm" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{getAssigneeName(savedTask.assignedTo)}</span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Unassigned</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {savedTask.tags && savedTask.tags.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {savedTask.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Tag className="w-2.5 h-2.5 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> Created by {getAssigneeName(savedTask.createdBy)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {getTimeAgo(savedTask.createdAt)}</span>
            {savedTask.completedAt && (
              <span className="flex items-center gap-1 text-emerald-500">
                <ArrowRight className="w-3 h-3" /> Completed {formatDateTime(savedTask.completedAt)}
              </span>
            )}
            {savedTask.assignedAt && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Assigned {formatDateTime(savedTask.assignedAt)}</span>
            )}
          </div>

          {/* History */}
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <History className="w-3 h-3" /> Activity History
            </label>
            {history === undefined ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No activity recorded</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((h: any) => (
                  <div key={h._id} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{h.userName || "System"}</span>
                      {" "}
                      {h.action === "created" && "created this task"}
                      {h.action === "assigned" && "assigned this task"}
                      {h.action === "reassigned" && "reassigned this task"}
                      {h.action === "unassigned" && "unassigned this task"}
                      {h.action === "completed" && "marked as completed"}
                      {h.action === "reopened" && "reopened this task"}
                      {h.action === "deleted" && "cancelled this task"}
                      {h.action === "restored" && "restored this task"}
                      {h.action === "status_changed" && `changed status to "${h.newValue}"`}
                      {h.action === "priority_changed" && `changed priority to "${h.newValue}"`}
                      {h.action === "due_date_changed" && `changed due date`}
                      {h.action === "field_changed" && `updated ${h.field}`}
                      <span className="ml-1 text-slate-400">{getTimeAgo(h.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex gap-2">
              {isDeleted ? (
                <Button variant="secondary" size="sm" onClick={handleRestore}>
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </Button>
              ) : (
                <>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500 font-medium">Confirm delete?</span>
                      <Button variant="danger" size="sm" onClick={handleDelete}>Yes, Delete</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Save</Button>
                </>
              ) : (
                !isDeleted && (
                  <Button variant="primary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
