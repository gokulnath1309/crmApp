import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Edit2, MoreHorizontal, UserMinus, Check, Copy, Mail, Shield, Power } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

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
  onUpdateRole?: (user: any, newRole: string) => void;
}

export function EmployeeRow({
  user,
  currentUserId,
  currentUserRole,
  onEdit,
  onToggleActive,
  onUpdateRole,
}: EmployeeRowProps) {
  const { toast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = () => setShowDropdown(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showDropdown]);

  const initials = getInitials(user.name);
  const isInactive = user.isActive === false;
  const roleKey = (user.role || "employee").toLowerCase();
  const roleCfg = roleBadgeConfig[roleKey] || roleBadgeConfig.employee;
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
        "flex flex-col sm:grid gap-4 p-5 sm:p-6 rounded-2xl max-sm:rounded-[20px] border transition-all duration-200 bg-white dark:bg-slate-800",
        "border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600",
        "min-h-[84px] max-sm:min-h-0",
        "sm:grid-cols-[72px_minmax(200px,1fr)_120px_100px] lg:grid-cols-[72px_minmax(260px,1fr)_140px_180px_120px_100px]",
        "items-start sm:items-center",
        isInactive &&
          "border-red-100 dark:border-red-950/20 opacity-75"
      )}
    >
      {/* Mobile: Header */}
      <div className="flex items-center gap-4 sm:hidden w-full pb-3 border-b border-slate-900/10 dark:border-slate-100/10">
        <div className="relative shrink-0 w-[56px] h-[56px]">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-[56px] h-[56px] rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
            />
          ) : (
            <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-base font-bold ring-2 ring-slate-100 dark:ring-slate-700">
              {initials}
            </div>
          )}
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[18px] font-semibold text-slate-900 dark:text-white truncate leading-snug">
            {user.name}
          </h4>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate leading-normal">
            {user.email}
          </p>
        </div>
      </div>

      {/* Desktop: Avatar */}
      <div className="hidden sm:flex items-center justify-start">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-[52px] h-[52px] rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700 shrink-0"
          />
        ) : (
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-100 dark:ring-slate-700 shrink-0">
            {initials}
          </div>
        )}
      </div>

      {/* Desktop: Name & Email */}
      <div className="hidden sm:block min-w-0">
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
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {user.email}
        </p>
      </div>

      {/* Mobile: Metadata Row — role badge, department, status pill on one line */}
      <div className="flex flex-wrap items-center justify-center gap-7 sm:hidden w-full max-w-full">
        <span
          className={cn(
            "inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-semibold leading-none",
            roleCfg.className
          )}
        >
          {roleCfg.label}
        </span>
        {deptDisplay && (
          <span className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 leading-none">
            {deptDisplay}
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12px] font-semibold leading-none",
            statusCfg.className
          )}
        >
          <span
            className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)}
          />
          {statusCfg.label}
        </span>
      </div>

      {/* Mobile: Action Row — dynamic columns based on permitted actions */}
      <div className={cn(
        "grid sm:hidden w-full relative border-t border-slate-900/10 dark:border-slate-100/10 pt-1.5 divide-x divide-slate-900/10 dark:divide-slate-100/10",
        canToggle && isSuperAdmin ? "grid-cols-3" : (canToggle || isSuperAdmin ? "grid-cols-2" : "grid-cols-1 justify-items-center")
      )}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(user);
          }}
          className="group flex items-center justify-center gap-2 py-2.5 min-h-[44px] text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500 text-[13px] font-semibold"
          title="Edit employee"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors shrink-0" />
          <span>Edit</span>
        </button>

        {canToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(user);
            }}
            title={isInactive ? "Activate" : "Deactivate"}
            className={cn(
              "group flex items-center justify-center gap-2 py-2.5 min-h-[44px] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500 text-[13px] font-semibold",
              isInactive
                ? "text-slate-600 dark:text-slate-350 hover:text-emerald-600 dark:hover:text-emerald-400"
                : "text-slate-600 dark:text-slate-350 hover:text-red-650 dark:hover:text-red-400"
            )}
          >
            <Power className={cn(
              "w-3.5 h-3.5 transition-colors shrink-0",
              isInactive
                ? "text-slate-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400"
                : "text-emerald-500 dark:text-emerald-400 group-hover:text-red-500 dark:group-hover:text-red-400"
            )} />
            <span>{isInactive ? "Activate" : "Deactivate"}</span>
          </button>
        )}

        {isSuperAdmin && (
          <div className="relative flex justify-center w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="group flex items-center justify-center gap-2 py-2.5 min-h-[44px] text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500 w-full text-[13px] font-semibold"
              title="More options"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white transition-colors shrink-0" />
              <span>More</span>
            </button>
            {showDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5 z-40 text-left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    navigator.clipboard.writeText(user.email);
                    toast("success", "Email address copied to clipboard.");
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Copy Email
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    navigator.clipboard.writeText(user._id);
                    toast("success", "User ID copied to clipboard.");
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Copy User ID
                </button>

                {user._id !== currentUserId && onUpdateRole && (
                  <div className="border-t border-slate-100 dark:border-slate-700/60 my-1 pt-1">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Quick Assign Role
                    </div>
                    {roleKey !== "employee" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onUpdateRole(user, "employee");
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Make Employee
                      </button>
                    )}
                    {roleKey !== "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onUpdateRole(user, "admin");
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Make Admin
                      </button>
                    )}
                    {roleKey !== "super_admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onUpdateRole(user, "super_admin");
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Make Owner
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Role */}
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

      {/* Desktop: Department */}
      <div className="hidden lg:flex items-center justify-center">
        {deptDisplay ? (
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
            {deptDisplay}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </div>

      {/* Desktop: Status */}
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

      {/* Desktop: Actions */}
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
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-500"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5 z-40 text-left">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    navigator.clipboard.writeText(user.email);
                    toast("success", "Email address copied to clipboard.");
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Copy Email
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    navigator.clipboard.writeText(user._id);
                    toast("success", "User ID copied to clipboard.");
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Copy User ID
                </button>

                {user._id !== currentUserId && onUpdateRole && (
                  <div className="border-t border-slate-100 dark:border-slate-700/60 my-1 pt-1">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Quick Assign Role
                    </div>
                    {roleKey !== "employee" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onUpdateRole(user, "employee");
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        Make Employee
                      </button>
                    )}
                    {roleKey !== "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onUpdateRole(user, "admin");
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        Make Admin
                      </button>
                    )}
                    {roleKey !== "super_admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onUpdateRole(user, "super_admin");
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        Make Owner
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
