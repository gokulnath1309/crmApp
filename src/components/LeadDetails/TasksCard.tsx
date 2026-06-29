import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  CheckCircle, Plus, Calendar, User, Trash2,
  CheckSquare, Square, Loader2 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface TasksCardProps {
  lead: any;
}

export function TasksCard({ lead }: TasksCardProps) {
  const { toast } = useToast();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const users = useQuery(api.users.list);

  // Queries/Mutations from api.tasks
  const tasksData = useQuery(api.tasks.list, lead ? { leadId: lead._id } : "skip");
  const tasks = tasksData?.tasks;
  const createTaskMutation = useMutation(api.tasks.create);
  const updateTaskMutation = useMutation(api.tasks.update);
  const deleteTaskMutation = useMutation(api.tasks.remove);

  // State
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "overdue">("pending");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!lead) return null;

  // Permissions check
  const isAdminOrManager = currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "manager";
  const isAssignedToMe = lead.assignedTo === currentUser?._id;
  const isCreatedByMe = lead.createdBy === currentUser?._id;
  const canModify = isAdminOrManager || isAssignedToMe || isCreatedByMe;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsCreating(true);
    try {
      const epoch = newTaskDueDate 
        ? new Date(`${newTaskDueDate}T17:00:00`).getTime() 
        : Date.now() + 24 * 60 * 60 * 1000; // Tomorrow default

      await createTaskMutation({
        title: newTaskTitle.trim(),
        dueDate: epoch,
        status: "Pending",
        priority: newTaskPriority,
        assignedTo: newTaskAssignee ? (newTaskAssignee as any) : currentUser?._id,
        leadId: lead._id,
      });

      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskPriority("Medium");
      setNewTaskAssignee("");
      setShowAddTaskForm(false);
      toast("success", "Sub-task created successfully!");
    } catch (err: any) {
      toast("error", err.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (task: any) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await updateTaskMutation({
        id: task._id,
        title: task.title,
        dueDate: task.dueDate,
        status: newStatus,
        priority: task.priority,
        assignedTo: task.assignedTo,
        leadId: lead._id,
      });
      toast("success", task.status === "Completed" ? "Task reopened" : "Task completed! 🎉");
    } catch (err: any) {
      toast("error", err.message || "Failed to update task status");
    }
  };

  const handleUpdateField = async (task: any, fieldPatch: Record<string, any>) => {
    try {
      await updateTaskMutation({
        id: task._id,
        title: fieldPatch.title !== undefined ? fieldPatch.title : task.title,
        dueDate: fieldPatch.dueDate !== undefined ? fieldPatch.dueDate : task.dueDate,
        status: fieldPatch.status !== undefined ? fieldPatch.status : task.status,
        priority: fieldPatch.priority !== undefined ? fieldPatch.priority : task.priority,
        assignedTo: fieldPatch.assignedTo !== undefined ? (fieldPatch.assignedTo ? fieldPatch.assignedTo : undefined) : task.assignedTo,
        leadId: lead._id,
      });
      toast("success", "Task updated successfully");
    } catch (err: any) {
      toast("error", err.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTaskMutation({ id: taskId as any });
      toast("success", "Task deleted");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete task");
    }
  };

  // Group tasks
  const getTasksByTab = () => {
    if (!tasks) return [];
    
    const now = Date.now();
    return tasks.filter(t => {
      const isCompleted = t.status === "Completed";
      const isOverdue = !isCompleted && t.dueDate < now;

      if (activeTab === "completed") return isCompleted;
      if (activeTab === "overdue") return isOverdue;
      return !isCompleted && !isOverdue; // Pending/Upcoming
    });
  };

  const currentTasks = getTasksByTab();

  const getPriorityBadgeColor = (p: string) => {
    if (p === "High" || p === "Urgent") return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
    if (p === "Medium") return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/40 mb-4">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-indigo-505" /> Tasks Checklist
        </h3>

        {/* Tabs */}
        <div className="flex bg-slate-105 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-805 rounded-xl p-0.5">
          {(["pending", "completed", "overdue"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                activeTab === tab 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-650"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Button or Form */}
      {canModify && (
        <div className="mb-4">
          {showAddTaskForm ? (
            <form onSubmit={handleCreateTask} className="bg-slate-50/50 dark:bg-slate-905/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-450 block mb-1 uppercase tracking-wider">Task Title</label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none text-slate-900 dark:text-white"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-455 block mb-1 uppercase tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-455 block mb-1 uppercase tracking-wider">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-455 block mb-1 uppercase tracking-wider">Assignee</label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Myself</option>
                  {users?.filter((u): u is NonNullable<typeof u> => !!u).filter(u => u._id !== currentUser?._id).map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTaskForm(false)}
                  className="h-8 px-4 border border-slate-205 text-slate-500 hover:bg-slate-5 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddTaskForm(true)}
              className="w-full h-9 border border-dashed border-indigo-250 hover:border-indigo-400 text-indigo-650 hover:bg-indigo-50/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Sub-task
            </button>
          )}
        </div>
      )}

      {/* Task List Feed */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[350px] space-y-2">
        {!tasks ? (
          <div className="space-y-2">
            <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : currentTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            No {activeTab} sub-tasks logged.
          </div>
        ) : (
          currentTasks.map((task) => {
            const isCompleted = task.status === "Completed";
            const assigneeUser = users?.find((u): u is NonNullable<typeof u> => !!u && u._id === task.assignedTo);
            const assigneeName = assigneeUser?.name || "Unassigned";

            return (
              <div 
                key={task._id}
                className={`p-3.5 bg-slate-50 dark:bg-slate-905/30 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start justify-between gap-3 group transition-all ${
                  isCompleted ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Task checkbox selector */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 text-indigo-650 hover:scale-110 transition-transform cursor-pointer"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-500/10" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-350" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p className={`text-xs font-bold text-slate-805 dark:text-slate-150 leading-snug break-words ${
                      isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
                    }`}>
                      {task.title}
                    </p>
                    
                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span className={`px-1.5 py-0.5 rounded-sm ${getPriorityBadgeColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-350" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>

                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-350" />
                        Assignee: {assigneeName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Quick Inline Reassigner */}
                  <select
                    value={task.assignedTo || ""}
                    onChange={(e) => handleUpdateField(task, { assignedTo: e.target.value })}
                    className="h-6 px-1 bg-white border border-slate-200 text-[9px] rounded-lg text-slate-655 outline-none cursor-pointer"
                  >
                    <option value="">Reassign...</option>
                    {users?.filter((u): u is NonNullable<typeof u> => !!u).map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>

                  {/* Quick Priority Changer */}
                  <select
                    value={task.priority}
                    onChange={(e) => handleUpdateField(task, { priority: e.target.value })}
                    className="h-6 px-1 bg-white border border-slate-200 text-[9px] rounded-lg text-slate-655 outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  {currentUser?.role === "super_admin" && (
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-1 text-slate-355 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
