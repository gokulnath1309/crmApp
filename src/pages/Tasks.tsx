import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, X, Play, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const STATUS_FLOW: Record<string, string[]> = {
  Pending: ["In Progress", "Blocked"],
  "In Progress": ["Completed", "Blocked"],
  Blocked: ["In Progress"],
  Completed: ["Pending"],
};

function formatDueDate(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  if (diff < 0) return "Overdue";
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days} days`;
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || styles.Pending}`}>
      {status}
    </span>
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

function StatusIcon({ status, onClick }: { status: string; onClick: () => void }) {
  if (status === "Completed") {
    return (
      <button onClick={onClick} className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 border-emerald-500 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity" title="Reopen">
        <CheckCircle className="w-3.5 h-3.5 text-white" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 flex items-center justify-center flex-shrink-0 transition-colors"
      title={status === "Pending" ? "Start" : status === "Blocked" ? "Unblock" : "Complete"}
    >
      {status === "In Progress" && <Play className="w-3 h-3 text-blue-500" />}
      {status === "Blocked" && <AlertCircle className="w-3 h-3 text-red-500" />}
    </button>
  );
}

export function TasksPage() {
  const { toast } = useToast();
  const tasksData = useQuery(api.tasks.list, {});
  const updateTask = useMutation(api.tasks.update);
  const createTask = useMutation(api.tasks.create);

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");

  const tasks = tasksData ?? [];
  const pending = tasks.filter(t => t.status !== "Completed").length;

  async function advanceStatus(id: string, currentStatus: string) {
    try {
      const existing = tasks.find(t => t._id === id);
      if (!existing) return;

      const transitions = STATUS_FLOW[currentStatus];
      const nextStatus = transitions?.[0];
      if (!nextStatus) return;

      await updateTask({
        id: id as any,
        title: existing.title,
        dueDate: existing.dueDate,
        status: nextStatus,
        priority: existing.priority,
        assignedTo: existing.assignedTo,
      });
    } catch {
      toast("error", "Failed to update task");
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const dueDate = newDue ? new Date(newDue).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;
      await createTask({
        title: newTitle.trim(),
        dueDate,
        status: "Pending",
        priority: newPriority,
      });
      setNewTitle("");
      setNewDue("");
      setNewPriority("Medium");
      setShowNew(false);
      toast("success", "Task created");
    } catch {
      toast("error", "Failed to create task");
    }
  }

  const priorityColor = (p: string) => {
    if (p === "High") return "red";
    if (p === "Medium") return "orange";
    return "neutral";
  };

  return (
    <div className="space-y-5 max-w-3xl pb-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tasksData === undefined ? "Loading..." : `${pending} pending · ${tasks.length - pending} completed`}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>

      {/* New Task Form */}
      {showNew && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New Task</h3>
            <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={newDue}
              onChange={e => setNewDue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as any)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Create Task
          </button>
        </div>
      )}

      {/* Task List */}
      {tasksData === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-12 text-center">
          <p className="text-sm text-slate-400">No tasks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
            {tasks.map(t => {
              const isDone = t.status === "Completed";
              return (
                <div key={t._id} className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isDone ? "opacity-60" : ""}`}>
                  <StatusIcon status={t.status} onClick={() => advanceStatus(t._id, t.status)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium text-slate-900 dark:text-white ${isDone ? "line-through" : ""}`}>{t.title}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{t.assignedTo ? "Assigned" : "Unassigned"}</span>
                      <span className="text-slate-200 dark:text-slate-600">·</span>
                      <span className={`text-xs font-semibold ${t.dueDate < Date.now() && !isDone ? "text-red-500" : "text-slate-400"}`}>
                        {formatDueDate(t.dueDate)}
                      </span>
                    </div>
                  </div>
                  <Chip label={t.priority} v={priorityColor(t.priority) as any} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
