import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUser } from "@/features/auth/UserProvider";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RenameWorkspaceModal } from "@/components/RenameWorkspaceModal";
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Bell, Settings,
  LogOut, Target, ChevronLeft, ChevronRight, X, BarChart2, Sun, Moon,
  Building2, CreditCard, UserCircle, Calendar, Pencil,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  excludeJobFunctions?: string[];
  requireJobFunctions?: string[];
}

const navItems: NavItem[] = [
  // Dashboard - All roles
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "sales_rep", "employee", "marketing", "support"] },

  // Leads
  { label: "Leads", href: "/leads", icon: Target, roles: ["super_admin", "admin", "marketing"] },
  { label: "My Leads", href: "/leads", icon: Target, roles: ["sales_rep", "employee"] },

  // Contacts
  { label: "Contacts", href: "/contacts", icon: Users, roles: ["super_admin", "admin"] },
  { label: "My Contacts", href: "/contacts", icon: Users, roles: ["sales_rep", "employee"] },

  // Companies (Customer list proxy, scoped to tenant)
  { label: "Companies", href: "/companies", icon: Building2, roles: ["super_admin", "admin"] },

  // Deals
  { label: "Deals", href: "/deals", icon: Briefcase, roles: ["super_admin", "admin"] },
  { label: "My Deals", href: "/deals", icon: Briefcase, roles: ["sales_rep", "employee"] },

  // Tasks
  { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["super_admin", "admin"] },
  { label: "My Tasks", href: "/tasks", icon: CheckSquare, roles: ["sales_rep", "employee", "support"] },

  // Calendar
  { label: "Calendar", href: "/calendar", icon: Calendar, roles: ["super_admin", "admin", "sales_rep", "marketing", "support", "employee"] },

  // Management / Admin only
  { label: "Employees", href: "/employees", icon: Users, roles: ["super_admin", "admin"] },
  { label: "Teams", href: "/teams", icon: Users, roles: ["super_admin", "admin"] },
  { label: "Reports", href: "/reports", icon: BarChart2, roles: ["super_admin"] },
  
  // Marketing Campaigns & Analytics
  { label: "Campaigns", href: "/leads", icon: Target, roles: ["marketing"] },
  { label: "Analytics", href: "/reports", icon: BarChart2, roles: ["marketing"] },

  // Notifications (all)
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["super_admin", "admin", "sales_rep", "marketing", "support", "employee"] },

  // Settings
  { label: "Settings", href: "/settings", icon: Settings, roles: ["super_admin"] },

  // Profile (all)
  { label: "Profile", href: "/profile", icon: UserCircle, roles: ["super_admin", "admin", "sales_rep", "marketing", "support", "employee"] },

  // Billing
  { label: "Billing", href: "/billing", icon: CreditCard, roles: ["super_admin"] },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { activeWorkspace } = useWorkspace();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [dark, toggleDark] = useDarkMode();
  const [renameOpen, setRenameOpen] = useState(false);

  const company = useQuery(api.workspaces.getMyWorkspace, {});
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});

  const canRename = activeWorkspace?.role === "SUPER_ADMIN";

  const userRole = user?.role || "employee";

  const visibleItems = navItems.filter((item) => {
    return item.roles?.includes(userRole) ?? false;
  });

  const companyName = company?.name || "Unnamed Workspace";
  const companyInitials = companyName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <BarChart2 className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-slate-900 dark:text-white text-[15px] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            CRM Pro
          </span>
        )}
        {isMobile && (
          <button onClick={onMobileClose} className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workspace selector */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 group">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">{companyInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block truncate">{companyName}</span>
              {company?.plan && (
                <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                  {company.plan === "basic" ? "Basic Plan" : company.plan === "professional" ? "Professional" : "Enterprise"}
                </span>
              )}
            </div>
            {canRename && (
              <button
                onClick={() => setRenameOpen(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer"
                title="Rename workspace"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 mb-2 uppercase tracking-widest">
            Menu
          </p>
        )}
        {visibleItems.map((item) => (
          <NavLink
            key={item.href + item.label}
            to={item.href}
            end={item.href === "/dashboard"}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            {!collapsed && item.label === "Notifications" && unreadCount !== undefined && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile card & controls */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        {!collapsed && user && (
          <NavLink
            to="/profile"
            onClick={isMobile ? onMobileClose : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </NavLink>
        )}

        <div className={cn("flex gap-1 mt-2", collapsed && "flex-col")}>
          <button
            onClick={toggleDark}
            className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 cursor-pointer"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {signOut && (
            <button
              onClick={signOut}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <RenameWorkspaceModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        currentName={companyName}
      />
      {isMobile ? (
        <>
          {mobileOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
          )}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-[70] transform transition-transform duration-300 lg:hidden",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ width: "var(--sidebar-width, 260px)" }}
          >
            {sidebarContent}
          </aside>
        </>
      ) : (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 transition-all duration-300 hidden lg:flex flex-col",
            collapsed && "w-16"
          )}
          style={{ width: collapsed ? undefined : "var(--sidebar-width, 260px)" }}
        >
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
