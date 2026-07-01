import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWorkspaceLimit } from "@/hooks/useWorkspaceLimit";
import { UpgradeModal } from "@/components/UpgradeModal";

import {
  Search, Plus, ChevronRight, ChevronDown,
  Sun, Moon, User, Settings, Building2, Check, UserPlus,
  Sparkles, Users, Briefcase, Calendar, Loader2,
  CheckSquare,
} from "lucide-react";
import { UserButton, useOrganizationList } from "@clerk/clerk-react";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileHeader } from "@/layouts/MobileHeader";
import { AnimatePresence, motion } from "motion/react";

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
  "/companies": "Companies",
  "/calendar": "Calendar",
  "/employees": "Employees",
  "/teams": "Teams",
  "/billing": "Billing",
  "/reports": "Reports",
};

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Create menu click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query database using Convex
  const searchResults = useQuery(
    api.search.globalSearch,
    { queryStr: debouncedSearch }
  );

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentTitle = pageTitles[location.pathname] || 
    (pathSegments[pathSegments.length - 1] 
      ? pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() + pathSegments[pathSegments.length - 1].slice(1)
      : "Dashboard");


  return (
    <header className="sticky top-0 z-30 flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 pt-[env(safe-area-inset-top)]">
      {/* Desktop (lg+) */}
      <div className="hidden lg:flex items-center gap-3 px-6 h-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm shrink-0">
          <span className="text-slate-400 dark:text-slate-500 font-medium">CRM Pro</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        </div>

        {/* Page Title */}
        <span className="font-semibold text-slate-900 dark:text-white text-lg truncate min-w-0">{currentTitle}</span>

        {/* Workspace Switcher */}
        <div className="shrink-0">
          <WorkspaceSwitcher />
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-sm mx-auto relative min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search anything (⌘K)…"
              className="w-full pl-9 pr-14 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md pointer-events-none">⌘K</kbd>
          </div>

          {/* Command Palette Popover */}
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[min(90vw,450px)] mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-900/15 max-h-[min(70vh,450px)] overflow-y-auto z-50 p-2 space-y-3">
              {!debouncedSearch.trim() ? (
                <div className="p-2 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                    Quick Navigation
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => { navigate("/leads"); setIsOpen(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /></div>
                      <span className="font-medium">Leads</span>
                    </button>
                    <button onClick={() => { navigate("/contacts"); setIsOpen(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0"><Users className="w-3.5 h-3.5 text-blue-500" /></div>
                      <span className="font-medium">Contacts</span>
                    </button>
                    <button onClick={() => { navigate("/deals"); setIsOpen(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0"><Briefcase className="w-3.5 h-3.5 text-emerald-500" /></div>
                      <span className="font-medium">Deals</span>
                    </button>
                    <button onClick={() => { navigate("/companies"); setIsOpen(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0"><Building2 className="w-3.5 h-3.5 text-purple-500" /></div>
                      <span className="font-medium">Companies</span>
                    </button>
                    <button onClick={() => { navigate("/calendar"); setIsOpen(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0"><Calendar className="w-3.5 h-3.5 text-amber-500" /></div>
                      <span className="font-medium">Calendar</span>
                    </button>
                    <button onClick={() => { navigate("/tasks"); setIsOpen(false); }}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-sm transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-rose-500" /></div>
                      <span className="font-medium">Tasks</span>
                    </button>
                  </div>
                </div>
              ) : !searchResults ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Searching CRM database...</span>
                </div>
              ) : Object.values(searchResults).every((arr: any) => Array.isArray(arr) && arr.length === 0) ? (
                <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No results found for <span className="font-semibold text-slate-600 dark:text-slate-300">"{debouncedSearch}"</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(searchResults as any).leads?.length > 0 && (
                    <div className="py-2 px-1">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1 flex items-center justify-between">
                        <span>Leads</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{(searchResults as any).leads.length}</span>
                      </div>
                      {(searchResults as any).leads.map((l: any) => (
                        <button key={l._id} onClick={() => { navigate(`/leads?leadId=${l._id}`); setIsOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{l.name}</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full shrink-0">{l.status}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{l.company} • {l.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults as any).contacts?.length > 0 && (
                    <div className="py-2 px-1">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1 flex items-center justify-between">
                        <span>Contacts</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{(searchResults as any).contacts.length}</span>
                      </div>
                      {(searchResults as any).contacts.map((c: any) => (
                        <button key={c._id} onClick={() => { navigate(`/contacts?contactId=${c._id}`); setIsOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 mt-0.5"><Users className="w-3.5 h-3.5 text-blue-500" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{c.name}</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full shrink-0">{c.status}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{c.company} • {c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults as any).deals?.length > 0 && (
                    <div className="py-2 px-1">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1 flex items-center justify-between">
                        <span>Deals</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{(searchResults as any).deals.length}</span>
                      </div>
                      {(searchResults as any).deals.map((d: any) => (
                        <button key={d._id} onClick={() => { navigate(`/deals?dealId=${d._id}`); setIsOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 mt-0.5"><Briefcase className="w-3.5 h-3.5 text-emerald-500" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">{d.title}</span>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">{d.currency} {d.value?.toLocaleString()}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{d.company || "No Company"} • {d.stage}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults as any).companies?.length > 0 && (
                    <div className="py-2 px-1">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1 flex items-center justify-between">
                        <span>Companies</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">{(searchResults as any).companies.length}</span>
                      </div>
                      {(searchResults as any).companies.map((c: any) => (
                        <button key={c._id} onClick={() => { navigate(`/companies?companyId=${c._id}`); setIsOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0 mt-0.5"><Building2 className="w-3.5 h-3.5 text-purple-500" /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors block truncate">{c.name}</span>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{c.domain || "No domain"} • {c.industry || "No industry"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* Create button */}
          <div ref={createRef} className="relative">
            <button
              onClick={() => setCreateOpen(!createOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all shadow-sm cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300 dark:shadow-indigo-900/30"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>

            <AnimatePresence>
              {createOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-900/15 z-50 p-1.5"
                >
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 py-1.5">
                    Quick Create
                  </div>

                  {(currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "sales_rep") && (
                    <QuickItem icon={Sparkles} label="New Lead" desc="Create a sales lead" onClick={() => { setCreateOpen(false); navigate("/leads?new=true"); }} />
                  )}
                  {(currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "sales_rep") && (
                    <QuickItem icon={Briefcase} label="New Deal" desc="Add a pipeline deal" onClick={() => { setCreateOpen(false); navigate("/deals?new=true"); }} />
                  )}
                  {(currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "sales_rep") && (
                    <QuickItem icon={Users} label="New Contact" desc="Add a contact person" onClick={() => { setCreateOpen(false); navigate("/contacts?new=true"); }} />
                  )}
                  {(currentUser?.role === "super_admin" || currentUser?.role === "admin") && (
                    <QuickItem icon={Building2} label="New Company" desc="Register a company" onClick={() => { setCreateOpen(false); navigate("/companies?new=true"); }} />
                  )}
                  <QuickItem icon={CheckSquare} label="New Task" desc="Create a follow-up task" onClick={() => { setCreateOpen(false); navigate("/tasks?new=true"); }} />
                  <QuickItem icon={Calendar} label="New Event" desc="Schedule an event" onClick={() => { setCreateOpen(false); navigate("/calendar?new=true"); }} />

                  {(currentUser?.role === "super_admin" || currentUser?.role === "admin") && (
                    <>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 py-1.5">
                        Administration
                      </div>
                      <QuickItem icon={UserPlus} label="New Employee" desc="Add a team member" onClick={() => { setCreateOpen(false); navigate("/employees?new=true"); }} />
                      <QuickItem icon={Users} label="New Team" desc="Create a sales team" onClick={() => { setCreateOpen(false); navigate("/teams?new=true"); }} />
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <NotificationBell />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 rounded-full",
                userButtonTrigger: "hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1 transition-colors",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action label="My Profile" labelIcon={<User className="w-4.5 h-4.5" />} onClick={() => navigate("/profile")} />
              <UserButton.Action label="Settings" labelIcon={<Settings className="w-4.5 h-4.5" />} onClick={() => navigate("/settings")} />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>

      {/* Mobile & Tablet (<1024px) */}
      <div className="lg:hidden">
        <MobileHeader onMenuClick={onMenuClick} title={currentTitle} />
      </div>
    </header>
  );
}

function QuickItem({ icon: Icon, label, desc, onClick }: { icon: any; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
    >
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{desc}</div>
      </div>
    </button>
  );
}

function WorkspaceSwitcher({ expanded }: { expanded?: boolean }) {
  const { workspaces, activeWorkspace } = useWorkspace();
  const { setActive } = useOrganizationList();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { atLimit, isLoading } = useWorkspaceLimit();

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
    <div ref={ref} className={`relative ${expanded ? "flex justify-center" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer ${
          expanded
            ? "inline-flex min-h-[44px] px-3 py-3"
            : "px-2.5 py-1.5"
        }`}
      >
        <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
        <span className={`font-medium truncate ${expanded ? "max-w-[70vw]" : "max-w-[140px]"}`}>{activeWorkspace?.workspaceName || "Unnamed Workspace"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className={`absolute top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-900/10 py-1 z-50 ${expanded ? "left-0 right-0" : "left-0 w-60"}`}>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Switch Workspace
          </div>
          {workspaces.map((w) => (
            <button
              key={w.workspaceId}
              onClick={() => {
                setOpen(false);
                if (w.workspaceId !== activeWorkspace?.workspaceId) {
                  setActive?.({ organization: w.workspaceId });
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
              if (!isLoading && atLimit) {
                setUpgradeOpen(true);
              } else {
                navigate("/onboarding");
              }
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
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}