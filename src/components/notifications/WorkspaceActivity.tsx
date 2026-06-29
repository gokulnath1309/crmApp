import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users, Activity } from "lucide-react";

export function WorkspaceActivity() {
  const users = useQuery(api.users.list);
  const activities = useQuery(api.activities.list, { limit: 5 });

  const activeUsers = users?.filter((u: any) => u.isActive) || [];

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs space-y-6">
      {/* Active Users */}
      <div>
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" /> Active Workspace Users
        </h4>
        {activeUsers.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No other active users.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeUsers.map((user: any) => {
              const name = user.name || "User";
              const initials = name.charAt(0).toUpperCase();
              return (
                <div
                  key={user._id}
                  className="relative group cursor-pointer"
                  title={`${name} (${user.role})`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-650 dark:text-slate-205">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  {/* Presence indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div>
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-slate-400" /> Recent System Logs
        </h4>
        {!activities ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-xs text-slate-405 dark:text-slate-500 italic">No recent system logs.</p>
        ) : (
          <div className="space-y-3">
            {activities.map(act => (
              <div key={act._id} className="text-[11px] leading-relaxed border-l-2 border-slate-100 dark:border-slate-700 pl-3">
                <p className="font-bold text-slate-700 dark:text-slate-200">
                  <span className="text-indigo-650 dark:text-indigo-400">{act.userName || "System"}</span> {act.description}
                </p>
                <span className="text-[9px] text-slate-400 font-semibold">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
