import { cn } from "@/lib/cn";
import { Edit2, MoreHorizontal, UserMinus, Check } from "lucide-react";

function getInitials(name?: string) {
  if (!name || name === "User") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

const departmentIcons: Record<string, string> = {
  Sales: "📊",
  Marketing: "📣",
  "Customer Success": "🤝",
  Support: "🎧",
  Product: "🛠️",
  Finance: "💰",
  HR: "👥",
  Management: "💼",
  Engineering: "⚙️",
  Design: "🎨",
};

const roleBadgeConfig: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: "Owner",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  admin: {
    label: "Admin",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  employee: {
    label: "Employee",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  },
};

const statusBadgeConfig: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400",
    dot: "bg-red-500",
  },
};

interface EmployeeRowProps {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    isActive?: boolean;
    avatarUrl?: string;
    managerId?: string;
  };
  currentUserId: string;
  currentUserRole: string;
  onEdit: (user: any) => void;
  onToggleActive: (user: any) => void;
}

export function EmployeeRow({
  user,
  currentUserId,
  currentUserRole,
  onEdit,
  onToggleActive,
}: EmployeeRowProps) {
  const initials = getInitials(user.name);
  const isInactive = user.isActive === false;
  const roleCfg = roleBadgeConfig[user.role] || roleBadgeConfig.employee;
  const statusKey = isInactive ? "inactive" : "active";
  const statusCfg = statusBadgeConfig[statusKey];
  const deptDisplay = user.department
    ? `${departmentIcons[user.department] || "📋"} ${user.department}`
    : null;
  const isSuperAdmin = currentUserRole === "super_admin";
  const canToggle =
    (isSuperAdmin && user._id !== currentUserId) ||
    (currentUserRole === "admin" && user.managerId === currentUserId);

  return (
    <div
      className={cn(
        "grid gap-4 p-6 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-800",
        "border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600",
        "min-h-[84px]",
        "grid-cols-[52px_1fr] sm:grid-cols-[72px_minmax(200px,1fr)_120px_100px] lg:grid-cols-[72px_minmax(260px,1fr)_140px_180px_120px_100px]",
        "items-start sm:items-center",
        isInactive &&
          "border-red-100 dark:border-red-950/20 opacity-75"
      )}
    >
      <div className="flex items-center justify-start">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-[52px] h-[52px] rounded-full object-cover ring-2 ring-border shrink-0"
          />
        ) : (
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-border shrink-0">
            {initials}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-900 dark:text-white truncate">
            {user.name}
          </span>
          {isInactive && (
            <span className="text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded-md uppercase leading-none shrink-0">
              Inactive
            </span>
          )}
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-1">
          {user.email}
        </p>

        <div className="sm:hidden flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold",
              roleCfg.className
            )}
          >
            {roleCfg.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold",
              statusCfg.className
            )}
          >
            <span
              className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)}
            />
            {statusCfg.label}
          </span>
          {deptDisplay && (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
              {deptDisplay}
            </span>
          )}
        </div>

        <div className="sm:hidden flex items-center gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="Edit employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(user);
              }}
              title={isInactive ? "Activate" : "Deactivate"}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500",
                isInactive
                  ? "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              )}
            >
              {isInactive ? (
                <Check className="w-4 h-4" />
              ) : (
                <UserMinus className="w-4 h-4" />
              )}
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center justify-center">
        <span
          className={cn(
            "inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-semibold min-w-[72px] justify-center",
            roleCfg.className
          )}
        >
          {roleCfg.label}
        </span>
      </div>

      <div className="hidden lg:flex items-center justify-center">
        {deptDisplay ? (
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
            {deptDisplay}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>

      <div className="hidden lg:flex items-center justify-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
            statusCfg.className
          )}
        >
          <span
            className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)}
          />
          {statusCfg.label}
        </span>
      </div>

      <div className="hidden sm:flex items-center justify-end gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(user);
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
          title="Edit employee"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {canToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(user);
            }}
            title={isInactive ? "Activate" : "Deactivate"}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500",
              isInactive
                ? "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            )}
          >
            {isInactive ? (
              <Check className="w-4 h-4" />
            ) : (
              <UserMinus className="w-4 h-4" />
            )}
          </button>
        )}
        {isSuperAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
