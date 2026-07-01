import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";
import { useOrganizationList } from "@clerk/clerk-react";
import { useWorkspaceLimit } from "@/hooks/useWorkspaceLimit";
import { UpgradeModal } from "@/components/UpgradeModal";
import { NotificationBell } from "@/components/NotificationBell";

import {
  Search, Plus, Menu, ChevronDown, X, ArrowLeft,
  Settings, Building2, Users, Check, UserPlus,
  Sparkles, Briefcase, Loader2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface MobileHeaderProps {
  onMenuClick: () => void;
  title: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "W";
}


export function MobileHeader({ onMenuClick, title }: MobileHeaderProps) {
  const navigate = useNavigate();
  const { workspaces, activeWorkspace } = useWorkspace();
  const { setActive } = useOrganizationList();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const { atLimit, isLoading } = useWorkspaceLimit();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useQuery(
    api.search.globalSearch,
    { queryStr: debouncedSearch }
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchQuery) setSearchOpen(true);
  }, [searchQuery]);

  // Lock body scroll and handle Escape key when workspace sheet is open
  useEffect(() => {
    if (!workspaceOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWorkspaceOpen(false);
    };
    const onPopState = () => setWorkspaceOpen(false);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);
    window.history.pushState(null, "");
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
    };
  }, [workspaceOpen]);

  return (
    <>
      {/* Header Row */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
          <button
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate leading-tight">
              {title}
            </div>
          </div>
        </div>

        {/* Right: Workspace + Icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {workspaces.length > 0 && (
            <button
              onClick={() => setWorkspaceOpen(true)}
              className="flex items-center gap-1 h-9 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
                {activeWorkspace?.workspaceName ? getInitials(activeWorkspace.workspaceName) : "WS"}
              </span>
              <motion.div
                animate={{ rotate: workspaceOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </motion.div>
            </button>
          )}

          <button
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 flex items-center justify-center">
            <NotificationBell />
          </div>

          <div className="w-10 h-10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white dark:ring-slate-900">
              {currentUser?.name ? getInitials(currentUser.name) : "U"}
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 bg-white dark:bg-slate-900"
          >
            <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100 dark:border-slate-800 pt-[env(safe-area-inset-top)]">
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); setDebouncedSearch(""); }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything…"
                className="flex-1 h-10 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setDebouncedSearch(""); searchInputRef.current?.focus(); }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
              {!debouncedSearch.trim() ? (
                <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  Type to search across your workspace
                </div>
              ) : !searchResults ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Searching...</span>
                </div>
              ) : Object.values(searchResults).every((arr: any) => !arr || arr.length === 0) ? (
                <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No results found for <span className="font-semibold text-slate-600 dark:text-slate-300">"{debouncedSearch}"</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(searchResults as any).leads?.length > 0 && (
                    <div className="py-2">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1">Leads</div>
                      {(searchResults as any).leads.map((l: any) => (
                        <button key={l._id} onClick={() => { navigate(`/leads?leadId=${l._id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block">{l.name}</span>
                            <p className="text-[11px] text-slate-400 truncate">{l.company} • {l.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults as any).contacts?.length > 0 && (
                    <div className="py-2">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1">Contacts</div>
                      {(searchResults as any).contacts.map((c: any) => (
                        <button key={c._id} onClick={() => { navigate(`/contacts?contactId=${c._id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block">{c.name}</span>
                            <p className="text-[11px] text-slate-400 truncate">{c.company} • {c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults as any).deals?.length > 0 && (
                    <div className="py-2">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1">Deals</div>
                      {(searchResults as any).deals.map((d: any) => (
                        <button key={d._id} onClick={() => { navigate(`/deals?dealId=${d._id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block">{d.title}</span>
                            <p className="text-[11px] text-slate-400 truncate">{d.company} • {d.value}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults as any).companies?.length > 0 && (
                    <div className="py-2">
                      <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-1">Companies</div>
                      {(searchResults as any).companies.map((c: any) => (
                        <button key={c._id} onClick={() => { navigate(`/companies?companyId=${c._id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block">{c.name}</span>
                            <p className="text-[11px] text-slate-400 truncate">{c.domain}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Bottom Sheet (portaled to body to avoid parent clipping) */}
      {createPortal(
        <AnimatePresence>
          {workspaceOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                onClick={() => setWorkspaceOpen(false)}
              />

              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100) {
                    setWorkspaceOpen(false);
                  }
                }}
                className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white dark:bg-slate-900 z-10">
                  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Switch Workspace
                  </span>
                  <button
                    onClick={() => setWorkspaceOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                    aria-label="Close workspace menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Workspace List */}
                <div className="px-4 pt-3 pb-2 space-y-0.5">
                  {workspaces.map((w) => (
                    <button
                      key={w.workspaceId}
                      onClick={() => {
                        setWorkspaceOpen(false);
                        if (w.workspaceId !== activeWorkspace?.workspaceId) {
                          setActive?.({ organization: w.workspaceId });
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-sm text-left rounded-xl transition-colors cursor-pointer ${
                        w.workspaceId === activeWorkspace?.workspaceId
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(w.workspaceName)}
                      </div>
                      <span className="flex-1 truncate font-medium">{w.workspaceName}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{w.role?.replace(/_/g, " ")}</span>
                      {w.workspaceId === activeWorkspace?.workspaceId && (
                        <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 mx-4" />

                {/* Actions */}
                <div className="px-4 pt-3 pb-6 space-y-0.5">
                  <button
                    onClick={() => {
                      setWorkspaceOpen(false);
                      if (!isLoading && atLimit) {
                        setUpgradeOpen(true);
                      } else {
                        navigate("/onboarding");
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-medium">Create Workspace</span>
                  </button>

                  <button
                    onClick={() => {
                      setWorkspaceOpen(false);
                      navigate("/onboarding?mode=join");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium">Join Workspace</span>
                  </button>

                  {workspaces.length > 0 && (
                    <button
                      onClick={() => {
                        setWorkspaceOpen(false);
                        navigate("/settings?tab=workspaces");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="font-medium">Manage Workspaces</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}