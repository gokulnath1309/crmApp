import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { 
  Bell, Check, CheckCheck, Trash2, Pin, Archive, 
  Search, Settings, EyeOff, ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

// Redesign components
import { NotificationSettingsModal } from "@/components/notifications/NotificationSettingsModal";
import { BulkActionToolbar } from "@/components/notifications/BulkActionToolbar";
import { NotificationSummary } from "@/components/notifications/NotificationSummary";
import { QuickFilters } from "@/components/notifications/QuickFilters";
import { QuickActions } from "@/components/notifications/QuickActions";
import { WorkspaceActivity } from "@/components/notifications/WorkspaceActivity";

// Import Lucide icons dynamically to render by name
import * as Lucide from "lucide-react";

export function NotificationsPage() {
  const navigate = useNavigate();
  
  // States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("newest");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Queries
  const currentUser = useQuery(api.users.getCurrentUser);
  const notifications = useQuery(api.notifications.list, { 
    filter: activeTab,
    search: searchQuery || undefined 
  });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const categoryCounts = useQuery(api.notifications.getCategoryCounts);

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAsUnread = useMutation(api.notifications.markAsUnread);
  const pinNotification = useMutation(api.notifications.pinNotification);
  const archiveNotification = useMutation(api.notifications.archiveNotification);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const dismiss = useMutation(api.notifications.dismiss);
  const bulkUpdate = useMutation(api.notifications.bulkUpdate);

  const isLoading = notifications === undefined;

  // Sorting
  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    const list = [...notifications];
    if (sortBy === "oldest") {
      list.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === "priority") {
      const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      list.sort((a, b) => (priorityWeight[b.priority || "low"] || 0) - (priorityWeight[a.priority || "low"] || 0));
    }
    return list;
  }, [notifications, sortBy]);

  // Grouping notifications (Today, Yesterday, This Week, Earlier)
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof sortedNotifications> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    };

    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    sortedNotifications.forEach(n => {
      if (n.createdAt >= startOfToday) {
        groups.Today.push(n);
      } else if (n.createdAt >= startOfYesterday) {
        groups.Yesterday.push(n);
      } else if (n.createdAt >= startOfWeek) {
        groups["This Week"].push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  }, [sortedNotifications]);

  // Bulk Actions
  const handleBulkAction = async (action: "read" | "unread" | "archive" | "unarchive" | "pin" | "unpin" | "delete") => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdate({ ids: selectedIds as any[], action });
      setSelectedIds([]);
    } catch (e) {
      console.error("Bulk action failed", e);
    }
  };

  const toggleSelectAll = () => {
    if (!notifications) return;
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getDynamicIcon = (iconName: string | undefined, color: string | undefined) => {
    const Name = (iconName || "Bell") as keyof typeof Lucide;
    const LucideIcon = (Lucide[Name] || Lucide.Bell) as React.ComponentType<any>;

    const colorClasses: Record<string, string> = {
      green: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
      blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
      orange: "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400",
      red: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450",
      purple: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400",
    };

    return (
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-100/50 dark:border-transparent", colorClasses[color || "blue"])}>
        <LucideIcon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-905 pb-16">
      {/* Settings Dialog */}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
      />

      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-150 dark:border-slate-700/50 px-6 py-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              Notifications
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-xs font-extrabold animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-405 dark:text-slate-450 font-medium mt-1">
              Stay updated with everything happening across your workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {unreadCount !== undefined && unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-805 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-650 dark:text-slate-205 rounded-xl shadow-xs transition-all"
              >
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 border border-slate-150 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-650 transition-colors"
              title="Notification Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Feed Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search, Sort and Filter Pills Bar */}
            <div className="space-y-4">
              {/* Search & Sort Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notifications by title, description or category..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
                
                {/* Sort selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSortBy(prev => prev === "newest" ? "oldest" : prev === "oldest" ? "priority" : "newest")}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4 text-slate-405" />
                    Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </button>
                </div>
              </div>

              {/* Tabs list (Animated pill select) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-nowrap scrollbar-thin scrollbar-thumb-slate-200">
                {[
                  { id: "all", label: "All" },
                  { id: "unread", label: "Unread" },
                  { id: "deals", label: "Deals" },
                  { id: "leads", label: "Leads" },
                  { id: "tasks", label: "Tasks" },
                  { id: "system", label: "System" },
                  { id: "mentions", label: "Mentions" },
                  { id: "calendar", label: "Calendar" },
                  { id: "employees", label: "Employees" },
                  { id: "teams", label: "Teams" },
                  { id: "reports", label: "Reports" }
                ].map(tab => {
                  const count = categoryCounts ? (categoryCounts as any)[tab.id] : 0;
                  const countLabel = count > 0 ? ` (${count})` : "";
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-full transition-all shrink-0",
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 text-slate-505 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )}
                    >
                      {tab.label}
                      {countLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notifications Feed */}
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-4">
                <Spinner size="lg" />
                <p className="text-xs text-slate-400 font-semibold">Loading your workspace feed...</p>
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-12 h-12 text-slate-350" />}
                title="Feed is clean!"
                description={activeTab === "unread" ? "You have no unread notifications." : "No matching notifications found."}
              />
            ) : (
              <div className="space-y-6">
                
                {/* Select All Row */}
                <div className="flex items-center justify-between px-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-405 hover:text-slate-700 dark:hover:text-slate-205 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === notifications.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Select All ({notifications.length})
                  </label>
                </div>

                {/* Group Feed Rendering */}
                {Object.entries(groupedNotifications).map(([groupTitle, list]) => {
                  if (list.length === 0) return null;
                  return (
                    <div key={groupTitle} className="space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                        {groupTitle}
                      </h3>
                      <div className="space-y-2">
                        {list.map(n => {
                          const isSelected = selectedIds.includes(n._id);
                          return (
                            <div
                              key={n._id}
                              className={cn(
                                "flex items-start gap-4 p-4 rounded-2xl border transition-all relative group",
                                !n.read 
                                  ? "bg-indigo-50/15 dark:bg-indigo-950/5 border-indigo-100/60 dark:border-indigo-950/20" 
                                  : "bg-white dark:bg-slate-800 border-slate-150 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-750/30"
                              )}
                            >
                              {/* Selection checkbox */}
                              <div className="pt-2 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(n._id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </div>

                              {/* Unread blue dot indicator */}
                              {!n.read && (
                                <span className="absolute left-10 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                              )}

                              {/* Dynamic Icon */}
                              <div className="pl-2.5 shrink-0">
                                {getDynamicIcon(n.icon, n.color)}
                              </div>

                              {/* Text Details & Deep Link Click behavior */}
                              <div 
                                className="flex-1 min-w-0 cursor-pointer pt-0.5"
                                onClick={() => {
                                  if (n.actionUrl) {
                                    // Mark read, then deep-link
                                    if (!n.read) markAsRead({ id: n._id });
                                    navigate(n.actionUrl);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <p className={cn("text-xs leading-snug truncate", !n.read ? "font-black text-slate-850 dark:text-slate-100" : "font-bold text-slate-650 dark:text-slate-350")}>
                                    {n.title}
                                  </p>
                                  {n.pinned && (
                                    <Pin className="w-3 h-3 text-indigo-650 shrink-0 transform rotate-45" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-450 dark:text-slate-450 leading-relaxed mt-1 pr-6">{n.message}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">{formatRelativeTime(n.createdAt)}</span>
                                  {n.workspaceId && (
                                    <span className="text-[9px] text-slate-350 dark:text-slate-550">• Workspace</span>
                                  )}
                                </div>
                              </div>

                              {/* Micro Actions (Mark read, Pin, Archive, Trash) */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-md">
                                {n.read ? (
                                  <button
                                    onClick={() => markAsUnread({ id: n._id })}
                                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-405 hover:text-indigo-650 rounded-md transition-colors"
                                    title="Mark as unread"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markAsRead({ id: n._id })}
                                    className="p-1 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-405 hover:text-emerald-500 rounded-md transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => pinNotification({ id: n._id, pinned: !n.pinned })}
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-405 hover:text-indigo-600 rounded-md transition-colors"
                                  title={n.pinned ? "Unpin" : "Pin"}
                                >
                                  <Pin className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => archiveNotification({ id: n._id, archived: !n.archived })}
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-405 hover:text-amber-500 rounded-md transition-colors"
                                  title="Archive"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => dismiss({ id: n._id })}
                                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-405 hover:text-rose-500 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Column (1/3 width) - collapses below main feed on tablet/mobile */}
          <div className="space-y-6">
            <NotificationSummary counts={categoryCounts} />
            <QuickFilters 
              currentFilter={activeTab} 
              onChangeFilter={(f) => setActiveTab(f)}
              counts={{ unread: unreadCount ?? 0 }}
            />
            <QuickActions 
              onOpenSettings={() => setIsSettingsOpen(true)}
              onMarkAllRead={() => markAllAsRead()}
            />
            <WorkspaceActivity />
          </div>

        </div>
      </div>

      {/* Floating bulk actions select bar */}
      <BulkActionToolbar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onAction={handleBulkAction}
      />
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
