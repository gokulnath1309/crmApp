import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";

  const notifications = useQuery(
    api.notifications.list,
    filter === "unread" ? { read: false } : {},
  );
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const dismiss = useMutation(api.notifications.dismiss);

  const isLoading = notifications === undefined;

  return (
    <div className="space-y-5 max-w-2xl pb-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Notifications
        </h1>
        {unreadCount && unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSearchParams({ filter: "all" })}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            filter === "all"
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          All
        </button>
        <button
          onClick={() => setSearchParams({ filter: "unread" })}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
            filter === "unread"
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          Unread {unreadCount !== undefined ? `(${unreadCount})` : ""}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No notifications"
          description={filter === "unread" ? "You've read everything!" : "You have no notifications yet."}
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/40">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={cn(
                "flex items-start gap-4 px-6 py-4 transition-colors",
                !n.read ? "bg-indigo-50/50 dark:bg-indigo-950/15" : "hover:bg-slate-50 dark:hover:bg-slate-700/30",
              )}
            >
              <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", !n.read ? "bg-indigo-500" : "bg-transparent")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm leading-snug", !n.read ? "font-semibold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300")}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.actionUrl && (
                      <button
                        onClick={() => navigate(n.actionUrl!)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="View"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!n.read && (
                      <button
                        onClick={() => markAsRead({ id: n._id })}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => dismiss({ id: n._id })}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
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
