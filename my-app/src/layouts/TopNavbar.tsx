import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDarkMode } from "@/hooks/useDarkMode";

import {
  Search, Plus, Bell, User, Settings, LogOut, Menu, ChevronRight,
  Sun, Moon, ChevronDown
} from "lucide-react";

interface TopNavbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/contacts": "Contacts",
  "/deals": "Deals",
  "/tasks": "Tasks",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();


  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentTitle = pageTitles[location.pathname] || 
    (pathSegments[pathSegments.length - 1] 
      ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() + pathSegments[pathSegments.length - 1].slice(1)
      : "Dashboard");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-5 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-slate-400 dark:text-slate-500 hidden sm:block font-medium">CRM Pro</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hidden sm:block" />
        <span className="font-semibold text-slate-900 dark:text-white">{currentTitle}</span>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xs mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search anything…"
            className="w-full pl-9 pr-14 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-300 dark:shadow-indigo-900/30">
          <Plus className="w-3.5 h-3.5" /> Create
        </button>

        <button
          onClick={toggleDark}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {user && (
          <Dropdown
            trigger={
              <button className="flex items-center gap-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-1">
                <Avatar name={user.name} size="sm" />
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>
            }
            align="right"
          >
            <div className="px-4 py-3">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
            <DropdownDivider />
            <DropdownItem
              icon={<User className="w-4 h-4 text-slate-400" />}
              onClick={() => navigate("/profile")}
            >
              My Profile
            </DropdownItem>
            <DropdownItem
              icon={<Settings className="w-4 h-4 text-slate-400" />}
              onClick={() => navigate("/settings")}
            >
              Settings
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={<LogOut className="w-4 h-4 text-red-500" />}
              variant="danger"
              onClick={signOut}
            >
              Sign Out
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
