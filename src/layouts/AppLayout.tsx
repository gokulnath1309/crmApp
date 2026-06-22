import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
          "flex flex-1 flex-col overflow-hidden transition-all duration-300 pb-16 md:pb-0",
          isMobile ? "ml-0" : collapsed ? "lg:ml-16" : "lg:ml-[280px]",
        )}
      >
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* BottomNavBar (Shared Component Logic - Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 md:hidden px-4 bg-white/80 dark:bg-inverse-surface/80 backdrop-blur-xl border-t border-outline-variant dark:border-outline shadow-lg">
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
        <button className="text-primary active:scale-90 duration-200 flex items-center justify-center">
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
    </div>
  );
}
