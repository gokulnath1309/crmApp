import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import {
  Sparkles, Briefcase, Users, Building2, CheckSquare, Calendar, UserPlus,
} from "lucide-react";

// -- Shared QuickItem UI atom --
function QuickItem({ icon: Icon, label, desc, onClick }: { icon: React.ElementType; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors cursor-pointer group min-h-[48px]"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{label}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{desc}</div>
      </div>
    </button>
  );
}

// -- Create actions – defined ONCE for all presentation layers --
function CreateItems({ onSelect }: { onSelect: () => void }) {
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, {});

  return (
    <>
      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 py-2">
        Quick Create
      </div>

      {(currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "sales_rep") && (
        <QuickItem icon={Sparkles} label="New Lead" desc="Create a sales lead" onClick={() => { onSelect(); navigate("/leads?new=true"); }} />
      )}
      {(currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "sales_rep") && (
        <QuickItem icon={Briefcase} label="New Deal" desc="Add a pipeline deal" onClick={() => { onSelect(); navigate("/deals?new=true"); }} />
      )}
      {(currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "sales_rep") && (
        <QuickItem icon={Users} label="New Contact" desc="Add a contact person" onClick={() => { onSelect(); navigate("/contacts?new=true"); }} />
      )}
      {(currentUser?.role === "super_admin" || currentUser?.role === "admin") && (
        <QuickItem icon={Building2} label="New Company" desc="Register a company" onClick={() => { onSelect(); navigate("/companies?new=true"); }} />
      )}
      <QuickItem icon={CheckSquare} label="New Task" desc="Create a follow-up task" onClick={() => { onSelect(); navigate("/tasks?new=true"); }} />
      <QuickItem icon={Calendar} label="New Event" desc="Schedule an event" onClick={() => { onSelect(); navigate("/calendar?new=true"); }} />

      {(currentUser?.role === "super_admin" || currentUser?.role === "admin") && (
        <>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <QuickItem icon={UserPlus} label="New Employee" desc="Add a team member" onClick={() => { onSelect(); navigate("/employees?new=true"); }} />
          <QuickItem icon={Users} label="New Team" desc="Create a sales team" onClick={() => { onSelect(); navigate("/teams?new=true"); }} />
        </>
      )}
    </>
  );
}

// -- Bottom Sheet presentation for mobile / tablet --
function QuickCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sheetVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[24px] flex flex-col max-h-[80vh]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="overflow-y-auto px-4 pb-8 pt-2">
              <CreateItems onSelect={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isMobile ? "ml-0" : collapsed ? "lg:ml-16" : "lg:ml-[260px]",
        )}
      >
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* BottomNavBar (Mobile & Tablet) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 lg:hidden px-4 pb-[env(safe-area-inset-bottom)] bg-white/80 dark:bg-inverse-surface/80 backdrop-blur-xl border-t border-outline-variant dark:border-outline shadow-lg">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            cn(
              "rounded-full p-2 duration-200 transition-all flex items-center justify-center",
              isActive ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:text-primary"
            )
          }
        >
          <span className="material-symbols-outlined">dashboard</span>
        </NavLink>
        <NavLink
          to="/leads"
          className={({ isActive }) =>
            cn(
              "rounded-full p-2 duration-200 transition-all flex items-center justify-center",
              isActive ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:text-primary"
            )
          }
        >
          <span className="material-symbols-outlined">filter_list</span>
        </NavLink>
        <button
          onClick={() => setCreateOpen(true)}
          className="text-primary active:scale-90 duration-200 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[32px]">add_circle</span>
        </button>
        <NavLink
          to="/deals"
          className={({ isActive }) =>
            cn(
              "rounded-full p-2 duration-200 transition-all flex items-center justify-center",
              isActive ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:text-primary"
            )
          }
        >
          <span className="material-symbols-outlined">handshake</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "rounded-full p-2 duration-200 transition-all flex items-center justify-center",
              isActive ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:text-primary"
            )
          }
        >
          <span className="material-symbols-outlined">person</span>
        </NavLink>
      </nav>

      <QuickCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
