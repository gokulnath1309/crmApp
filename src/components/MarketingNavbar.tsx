import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Menu, X } from "lucide-react";

export const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "Resources", path: "/resources" },
  { label: "Pricing", path: "/pricing" },
  { label: "Info", path: "/info" },
] as const;

export function MarketingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <motion.nav
      className="relative flex items-center justify-between py-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="flex items-center gap-[6px] text-2xl font-extrabold tracking-tight cursor-pointer"
        onClick={() => navigate("/")}
      >
        <Zap className="w-7 h-7" style={{ fill: "url(#lightning-gradient)" }} />
        <span className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent">
          CRMPro
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <a
              key={link.path}
              href="#"
              onClick={(e) => { e.preventDefault(); handleNav(link.path); }}
              className="text-[15px] font-medium no-underline transition-colors relative"
              style={{ color: isActive ? "var(--text-primary)" : "var(--nav-link)" }}
            >
              {link.label}
              {isActive && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]" />
              )}
            </a>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-5">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate("/signin"); }}
          className="text-[15px] font-medium no-underline transition-colors"
          style={{ color: "var(--nav-link)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--nav-link-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--nav-link)"}
        >
          Log in
        </a>
        <button
          onClick={() => navigate("/signup")}
          className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold px-6 py-2.5 rounded-full border-none cursor-pointer shadow-[0_4px_14px_rgba(139,92,246,0.25)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:-translate-y-0.5 transition-all"
        >
          Sign Up
        </button>
      </div>

      <button
        onClick={() => setMobileOpen((prev) => !prev)}
        className="md:hidden p-2 rounded-lg border-none cursor-pointer"
        style={{ color: "var(--text-primary)" }}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 md:hidden flex flex-col p-6 gap-3 shadow-xl rounded-2xl z-50 border"
            style={{
              background: "var(--bg-color)",
              borderColor: "var(--btn-outline-border)",
            }}
          >
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <a
                  key={link.path}
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleNav(link.path); }}
                  className="text-[15px] font-medium no-underline py-2 transition-colors"
                  style={{ color: isActive ? "var(--text-primary)" : "var(--nav-link)" }}
                >
                  {link.label}
                </a>
              );
            })}
            <hr className="border-t my-1" style={{ borderColor: "var(--btn-outline-border)" }} />
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate("/signin"); setMobileOpen(false); }}
              className="text-[15px] font-medium no-underline text-center py-2 transition-colors"
              style={{ color: "var(--nav-link)" }}
            >
              Log in
            </a>
            <button
              onClick={() => { navigate("/signup"); setMobileOpen(false); }}
              className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold px-6 py-3 rounded-full border-none cursor-pointer shadow-[0_4px_14px_rgba(139,92,246,0.25)] w-full"
            >
              Sign Up
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
