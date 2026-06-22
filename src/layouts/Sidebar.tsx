import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Bell, Settings,
  LogOut, Target, ChevronLeft, ChevronRight, X, BarChart2, ChevronDown, Sun, Moon
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Target },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Deals", href: "/deals", icon: Briefcase },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [dark, toggleDark] = useDarkMode();

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
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">AC</span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 text-left">Acme Corp</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </button>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 mb-2 uppercase tracking-widest">
            Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.href}
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
            {!collapsed && item.label === "Notifications" && (
              <span className="bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                12
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
            <button
              onClick={(e) => { e.preventDefault(); signOut(); }}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </NavLink>
        )}

        <div className={cn("flex gap-1 mt-2", collapsed && "flex-col")}>
          <button
            onClick={toggleDark}
            className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {!collapsed && signOut && (
            <button
              onClick={signOut}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 transition-all duration-300 hidden lg:flex flex-col",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
