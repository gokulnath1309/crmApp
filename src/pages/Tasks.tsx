import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { cn } from "@/lib/cn";
import {
  Search, Plus, X, CheckSquare, CheckCircle, AlertCircle,
  Play, Calendar, ChevronLeft, ChevronRight,
  Filter, Download, Trash2, RotateCcw, UserPlus,
  Columns, CalendarDays, ListChecks,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["Pending", "In Progress", "Blocked", "Completed", "Cancelled"] as const;
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"] as const;

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

const DATE_PRESETS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "next_week", label: "Next Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
];

type ViewMode = "list" | "kanban" | "calendar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(ts: number, completed?: boolean): { text: string; isOverdue: boolean } {
  const now = Date.now();
  if (completed) return { text: "Completed", isOverdue: false };
  const diff = ts - now;
  if (diff < 0) return { text: "Overdue", isOverdue: true };
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return { text: "Today", isOverdue: false };
  if (days === 1) return { text: "Tomorrow", isOverdue: false };
  if (days <= 7) return { text: `${days}d left`, isOverdue: false };
  return { text: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }), isOverdue: false };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TasksPage() {
  const { toast } = useToast();

  // ── Auth ──
  const users = useQuery(api.users.list);

  // ── State ──
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [datePreset, setDatePreset] = useState("");
  const [dateField, setDateField] = useState("dueDate");
  const [sortBy, setSortBy] = useState("dueDate");
  const [viewCompleted, setViewCompleted] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  // ── New Task Form ──
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newAssignedTo, setNewAssignedTo] = useState("");

  // ── Bulk State ──
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  // ── Debounced search ──
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => setDebouncedSearch(val), 300);
    setSearchTimer(timer);
  }, [searchTimer]);

  // ── Queries ──
  const taskArgs = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    assignedTo: employeeFilter || undefined,
    datePreset: datePreset || undefined,
    dateField,
    sortBy,
    viewCompleted: viewCompleted || undefined,
    overdue: overdueOnly || undefined,
    unassigned: unassignedOnly || undefined,
    limit: 100,
  }), [debouncedSearch, statusFilter, priorityFilter, employeeFilter, datePreset, dateField, sortBy, viewCompleted, overdueOnly, unassignedOnly]);

  const { tasks, totalCount } = useQuery(api.tasks.list, taskArgs as any) || { tasks: [], nextCursor: null, totalCount: 0 };

  // ── Mutations ──
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const bulkAssign = useMutation(api.tasks.bulkAssign);
  const bulkUpdateStatus = useMutation(api.tasks.bulkUpdateStatus);
  const bulkDelete = useMutation(api.tasks.bulkDelete);
  const bulkRestore = useMutation(api.tasks.bulkRestore);

  // ── User Map ──
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    users?.forEach((u: any) => map.set(u._id, u));
    return map;
  }, [users]);

  const getAssigneeName = (id?: string) => {
    if (!id) return "Unassigned";
    return userMap.get(id)?.name || "Unknown";
  };

  // ── Create Task ──
  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      await createTask({
        title: newTitle.trim(),
        dueDate: newDue ? new Date(newDue).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000,
        priority: newPriority as any,
        assignedTo: newAssignedTo ? (newAssignedTo as any) : undefined,
      });
      setNewTitle(""); setNewDue(""); setNewPriority("Medium"); setNewAssignedTo("");
      setShowNewForm(false);
      toast("success", "Task created");
    } catch (e: any) {
      toast("error", e.message || "Failed to create task");
    }
  }

  // ── Quick Status Update ──
  async function quickStatus(taskId: string, currentStatus: string) {
    const transition: Record<string, string> = {
      Pending: "In Progress",
      "In Progress": "Completed",
      Blocked: "In Progress",
      Completed: "Pending",
      Cancelled: "Pending",
    };
    const nextStatus = transition[currentStatus];
    if (!nextStatus) return;

    try {
      const task = tasks.find((t: any) => t._id === taskId);
      if (!task) return;
      await updateTask({
        id: taskId as any,
        status: nextStatus as any,
      });
    } catch (e: any) {
      toast("error", e.message || "Failed to update task");
    }
  }

  // ── Selection ──
  const toggleSelect = (id: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t: any) => t._id)));
    }
  };

  const clearSelection = () => setSelectedTasks(new Set());

  // ── Bulk Actions ──
  async function handleBulkAssign() {
    if (!bulkAssignee || selectedTasks.size === 0) return;
    try {
      await bulkAssign({ taskIds: Array.from(selectedTasks) as any, assignedTo: bulkAssignee as any });
      toast("success", `Assigned ${selectedTasks.size} task(s)`);
      clearSelection();
    } catch (e: any) {
      toast("error", e.message || "Bulk assign failed");
    }
  }

  async function handleBulkStatus() {
    if (!bulkStatus || selectedTasks.size === 0) return;
    try {
      await bulkUpdateStatus({ taskIds: Array.from(selectedTasks) as any, status: bulkStatus as any });
      toast("success", `Updated ${selectedTasks.size} task(s)`);
      clearSelection();
    } catch (e: any) {
      toast("error", e.message || "Bulk update failed");
    }
  }

  async function handleBulkDelete() {
    if (selectedTasks.size === 0) return;
    try {
      await bulkDelete({ taskIds: Array.from(selectedTasks) as any });
      toast("success", `Deleted ${selectedTasks.size} task(s)`);
      clearSelection();
    } catch (e: any) {
      toast("error", e.message || "Bulk delete failed");
    }
  }

  async function handleBulkRestore() {
    if (selectedTasks.size === 0) return;
    try {
      await bulkRestore({ taskIds: Array.from(selectedTasks) as any });
      toast("success", `Restored ${selectedTasks.size} task(s)`);
      clearSelection();
    } catch (e: any) {
      toast("error", e.message || "Bulk restore failed");
    }
  }

  // ── Export ──
  async function handleExport() {
    try {
      if (!tasks || tasks.length === 0) {
        toast("info", "No tasks to export");
        return;
      }
      const csvHeader = "ID,Title,Status,Priority,Assignee,Created By,Due Date,Tags\n";
      const csvRows = tasks.map((t: any) =>
        `"${t._id}","${(t.title || "").replace(/"/g, '""')}","${t.status}","${t.priority}","${getAssigneeName(t.assignedTo)}","${getAssigneeName(t.createdBy)}","${new Date(t.dueDate).toISOString().split("T")[0]}","${(t.tags || []).join("; ")}"`
      ).join("\n");
      const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("success", "Tasks exported");
    } catch {
      toast("error", "Export failed");
    }
  }

  // ── Task Status Icon ──
  function StatusIcon({ status, onClick }: { status: string; onClick: (e: React.MouseEvent) => void }) {
    if (status === "Completed") {
      return (
        <button onClick={onClick} className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity" title="Reopen">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </button>
      );
    }
    if (status === "Cancelled") {
      return (
        <button onClick={onClick} className="mt-0.5 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0 cursor-default" title="Cancelled">
          <X className="w-3 h-3 text-white" />
        </button>
      );
    }
    return (
      <button onClick={onClick} className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 flex items-center justify-center flex-shrink-0 transition-colors">
        {status === "In Progress" && <Play className="w-3 h-3 text-blue-500" />}
        {status === "Blocked" && <AlertCircle className="w-3 h-3 text-red-500" />}
      </button>
    );
  }

  // ── Loading State ──
  if (tasks === undefined) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalCount} task{totalCount !== 1 ? "s" : ""}
            {!viewCompleted && (
              <span className="ml-1 text-slate-400">
                · {tasks.filter((t: any) => t.status === "Pending" || t.status === "In Progress" || t.status === "Blocked").length} active
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} size="sm">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {search && (
              <button onClick={() => { setSearch(""); setDebouncedSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-0.5">
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded-lg transition-colors", view === "list" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")} title="List">
              <ListChecks className="w-4 h-4" />
            </button>
            <button onClick={() => setView("kanban")} className={cn("p-1.5 rounded-lg transition-colors", view === "kanban" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")} title="Kanban">
              <Columns className="w-4 h-4" />
            </button>
            <button onClick={() => setView("calendar")} className={cn("p-1.5 rounded-lg transition-colors", view === "calendar" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")} title="Calendar">
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          {/* Export */}
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>

          {/* Filters toggle */}
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
        </div>

        {/* ── Filters ── */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            {/* Status */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Priority */}
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Employee */}
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">All Employees</option>
              {users?.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>

            {/* Date Preset */}
            <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {DATE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>

            {/* Date Field */}
            <select value={dateField} onChange={(e) => setDateField(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="dueDate">Due Date</option>
              <option value="createdAt">Created Date</option>
              <option value="completedAt">Completed Date</option>
              <option value="updatedAt">Updated Date</option>
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="dueDate">Due Date</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="updatedAt">Recently Updated</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            {/* Toggle filters */}
            <div className="flex items-center gap-1 ml-1">
              <button onClick={() => { setViewCompleted(!viewCompleted); setOverdueOnly(false); }}
                className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", viewCompleted ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
                Completed
              </button>
              <button onClick={() => { setOverdueOnly(!overdueOnly); setViewCompleted(false); }}
                className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", overdueOnly ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
                Overdue
              </button>
              <button onClick={() => setUnassignedOnly(!unassignedOnly)}
                className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors", unassignedOnly ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
                Unassigned
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── New Task Form ── */}
      {showNewForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New Task</h3>
            <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex gap-3">
            <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assignee</label>
            <select value={newAssignedTo} onChange={(e) => setNewAssignedTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">Unassigned (Self)</option>
              {users?.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <Button onClick={handleCreate} disabled={!newTitle.trim()} className="w-full" size="sm">
            Create Task
          </Button>
        </div>
      )}

      {/* ── Bulk Action Bar ── */}
      {selectedTasks.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 p-3 flex flex-wrap items-center gap-2 animate-in slide-in-from-top duration-200">
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mr-1">{selectedTasks.size} selected</span>

          <select value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none">
            <option value="">Assign to...</option>
            {users?.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          {bulkAssignee && <Button variant="primary" size="sm" onClick={handleBulkAssign}>
            <UserPlus className="w-3 h-3" /> Assign
          </Button>}

          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none">
            <option value="">Set status...</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {bulkStatus && <Button variant="primary" size="sm" onClick={handleBulkStatus}>
            <CheckSquare className="w-3 h-3" /> Update
          </Button>}

          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-500 hover:text-red-600">
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBulkRestore}>
            <RotateCcw className="w-3 h-3" /> Restore
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="w-3 h-3" /> Clear
          </Button>
        </div>
      )}

      {/* ── Main Content ── */}
      {view === "list" && (
        <>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-8 h-8 text-slate-400" />}
              title={search || statusFilter || priorityFilter || employeeFilter ? "No matching tasks" : "No tasks yet"}
              description={search || statusFilter || priorityFilter || employeeFilter ? "Try adjusting your filters" : "Create a task to get started"}
              action={
                !(search || statusFilter || priorityFilter || employeeFilter) ? (
                  <Button onClick={() => setShowNewForm(true)} size="sm">
                    <Plus className="w-4 h-4" /> Create Task
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setDebouncedSearch(""); setStatusFilter(""); setPriorityFilter(""); setEmployeeFilter(""); setDatePreset(""); setOverdueOnly(false); setUnassignedOnly(false); }}>
                    Clear Filters
                  </Button>
                )
              }
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
              {/* Select all checkbox */}
              <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700/40 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-xs text-slate-400 font-medium">
                  {selectedTasks.size === tasks.length && tasks.length > 0 ? "Deselect all" : "Select all"}
                </span>
              </div>

              <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
                {tasks.map((t: any) => {
                  const due = formatDueDate(t.dueDate, t.status === "Completed" || t.status === "Cancelled");
                  const isSelected = selectedTasks.has(t._id);
                  const assigneeName = getAssigneeName(t.assignedTo);

                  return (
                    <div
                      key={t._id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group",
                        (t.status === "Completed" || t.status === "Cancelled") && "opacity-60"
                      )}
                      onClick={() => setDetailTaskId(t._id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(t._id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                      />
                      <StatusIcon
                        status={t.status}
                        onClick={(e) => { e.stopPropagation(); quickStatus(t._id, t.status); }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-medium text-slate-900 dark:text-white truncate", (t.status === "Completed" || t.status === "Cancelled") && "line-through")}>
                            {t.title}
                          </p>
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0", STATUS_COLORS[t.status] || STATUS_COLORS.Pending)}>
                            {t.status}
                          </span>
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0", PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium)}>
                            {t.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{assigneeName}</span>
                          <span className="text-slate-200 dark:text-slate-600">·</span>
                          <span className={cn("text-xs font-semibold", due.isOverdue ? "text-red-500" : "text-slate-400")}>
                            <Calendar className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            {due.text}
                          </span>
                          {t.tags && t.tags.length > 0 && (
                            <>
                              <span className="text-slate-200 dark:text-slate-600">·</span>
                              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium truncate max-w-[100px]">
                                {t.tags.slice(0, 2).join(", ")}{t.tags.length > 2 ? "..." : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.assignedTo && (
                          <Avatar name={assigneeName} size="sm" className="w-6 h-6 text-[9px]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination hint */}
          {totalCount > 100 && (
            <p className="text-xs text-slate-400 text-center">
              Showing {tasks.length} of {totalCount} tasks. Use filters to narrow results.
            </p>
          )}
        </>
      )}

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {STATUS_OPTIONS.map((status) => {
            const columnTasks = tasks.filter((t: any) => t.status === status);
            return (
              <div key={status} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {status}
                  </h3>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {columnTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No tasks</p>
                  ) : (
                    columnTasks.map((t: any) => {
                      const due = formatDueDate(t.dueDate, t.status === "Completed" || t.status === "Cancelled");
                      return (
                        <div
                          key={t._id}
                          onClick={() => setDetailTaskId(t._id)}
                          className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-sm transition-shadow"
                        >
                          <p className={cn("text-sm font-medium text-slate-900 dark:text-white truncate", (t.status === "Completed" || t.status === "Cancelled") && "line-through opacity-60")}>
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold", PRIORITY_STYLES[t.priority])}>
                              {t.priority}
                            </span>
                            <span className={cn("text-[10px] font-medium", due.isOverdue ? "text-red-500" : "text-slate-400")}>
                              {due.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {t.assignedTo ? (
                              <Avatar name={getAssigneeName(t.assignedTo)} size="sm" className="w-5 h-5 text-[7px]" />
                            ) : (
                              <span className="text-[10px] text-slate-400">Unassigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Calendar View ── */}
      {view === "calendar" && (
        <CalendarView tasks={tasks} onTaskClick={setDetailTaskId} />
      )}

      {/* ── Task Detail Modal ── */}
      <TaskDetailModal
        taskId={detailTaskId}
        open={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onUpdate={() => {}}
      />
    </div>
  );
}

// ─── Calendar View Component ──────────────────────────────────────────────────

function CalendarView({
  tasks,
  onTaskClick,
}: {
  tasks: any[];
  onTaskClick: (id: string) => void;
}) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const dayTasks = (day: number) => {
    const start = new Date(year, month, day).getTime();
    const end = start + 86400000;
    return tasks.filter((t: any) => !t.deletedAt && t.dueDate >= start && t.dueDate < end);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white min-w-[160px] text-center">{monthLabel}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
          <button onClick={() => setViewMode("month")} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", viewMode === "month" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500")}>Month</button>
          <button onClick={() => setViewMode("week")} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", viewMode === "week" ? "bg-white dark:bg-slate-600 shadow-sm" : "text-slate-500")}>Week</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 text-center border-r border-slate-100 dark:border-slate-700 last:border-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-slate-50 dark:border-slate-700/40 p-1" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const isToday = date.toDateString() === today.toDateString();
          const t = dayTasks(day);

          return (
            <div
              key={day}
              className={cn(
                "min-h-[100px] border-r border-b border-slate-50 dark:border-slate-700/40 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors",
                isToday && "bg-indigo-50/30 dark:bg-indigo-950/20"
              )}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                isToday ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"
              )}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {t.slice(0, 3).map((task: any) => (
                  <button
                    key={task._id}
                    onClick={() => onTaskClick(task._id)}
                    className={cn(
                      "w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate block",
                      task.status === "Completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      task.status === "Blocked" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      task.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    )}
                  >
                    {task.title}
                  </button>
                ))}
                {t.length > 3 && (
                  <span className="text-[9px] text-indigo-500 font-semibold pl-1">+{t.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
