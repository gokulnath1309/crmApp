import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useAuth } from "@/features/auth/AuthProvider";

import {
  Search, Plus, Menu, ChevronRight, ChevronDown,
  Sun, Moon, User, Settings, Building2, Check
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { NotificationBell } from "@/components/NotificationBell";

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

      {/* Workspace Switcher */}
      <WorkspaceSwitcher />

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

        <NotificationBell />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-lg",
              userButtonTrigger: "hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 transition-colors",
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Action
              label="My Profile"
              labelIcon={<User className="w-4.5 h-4.5" />}
              onClick={() => navigate("/profile")}
            />
            <UserButton.Action
              label="Settings"
              labelIcon={<Settings className="w-4.5 h-4.5" />}
              onClick={() => navigate("/settings")}
            />
            <UserButton.Action label="signOut" />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </header>
  );
}

function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (workspaces.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
      >
        <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="font-medium truncate max-w-[140px]">{activeWorkspace?.workspaceName || "Workspace"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-900/10 py-1 z-50">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Switch Workspace
          </div>
          {workspaces.map((w) => (
            <button
              key={w.workspaceId}
              onClick={() => {
                setOpen(false);
                if (w.workspaceId !== activeWorkspace?.workspaceId) {
                  switchWorkspace(w.workspaceId);
                }
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                w.workspaceId === activeWorkspace?.workspaceId
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{w.workspaceName}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">{w.role?.replace(/_/g, " ")}</span>
              {w.workspaceId === activeWorkspace?.workspaceId && (
                <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

          <button
            onClick={() => {
              setOpen(false);
              navigate("/onboarding");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Create Workspace</span>
          </button>

          <button
            onClick={() => {
              setOpen(false);
              navigate("/onboarding?mode=join");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0 text-blue-500" />
            <span>Join Workspace</span>
          </button>

          {workspaces.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/settings?tab=workspaces");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Manage Workspaces</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
