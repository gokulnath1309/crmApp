import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Crown, Check, X, Sparkles, Users, BarChart3, Zap, Sliders, Columns, HeadphonesIcon, HardDrive } from "lucide-react";
import { cn } from "@/lib/cn";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: Check, label: "Unlimited Workspaces" },
  { icon: Users, label: "Team Collaboration" },
  { icon: BarChart3, label: "Advanced Reports" },
  { icon: Zap, label: "Automation Rules" },
  { icon: Sliders, label: "Workflow Builder" },
  { icon: Columns, label: "Custom Fields" },
  { icon: HeadphonesIcon, label: "Priority Support" },
  { icon: HardDrive, label: "Unlimited Storage" },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open && modalRef.current) {
      const activeEl = document.activeElement as HTMLElement | null;
      const firstFocusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
      return () => {
        activeEl?.focus();
      };
    }
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[rgba(15,23,42,0.55)]"
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative bg-white flex flex-col overflow-hidden",
              "w-full sm:w-[min(900px,92vw)] max-h-[90vh]",
              "rounded-none sm:rounded-[20px]",
              "border-0 sm:border sm:border-[#E8ECF5]",
              "shadow-[0_30px_80px_rgba(15,23,42,0.18)]",
              "sm:h-auto h-full"
            )}
          >
            {/* Fixed Header */}
            <div className="shrink-0 p-8 border-b border-[#EEF2F7]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Upgrade Your Workspace
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      You've reached your plan's workspace limit. Upgrade to create additional workspaces and unlock premium features.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 ml-4 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Current Plan Usage */}
              <div className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-slate-50 border border-[#EEF2F7]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/70 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">BAS</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Current Plan</p>
                    <p className="text-sm font-semibold text-slate-800">Basic</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">Workspaces</p>
                  <p className="text-sm font-semibold text-slate-800">1 / 1</p>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="rounded-2xl border border-[#E8ECF5] overflow-hidden">
                <div className="px-6 pt-6 pb-5 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2.5">
                        <Sparkles className="w-3 h-3" />
                        Recommended
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Professional</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-extrabold text-slate-900">₹499</span>
                        <span className="text-sm text-slate-500">/month per workspace</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Everything your team needs to scale — unlimited workspaces, advanced reporting, automation, and priority support. Perfect for growing businesses.
                  </p>

                  <div className="space-y-1">
                    {FEATURES.slice(0, 4).map((f) => (
                      <div key={f.label} className="flex items-center gap-3 h-12">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="border-t border-[#EEF2F7] pt-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Everything included
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FEATURES.map((f) => (
                        <div
                          key={f.label}
                          className="flex items-center gap-3 h-12 px-3.5 rounded-xl border border-[#EEF2F7] bg-white"
                        >
                          <f.icon className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-sm font-medium text-slate-700">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-6 border-t border-[#EEF2F7] bg-white flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="h-12 px-5 rounded-xl border border-[#D8DCE6] text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate("/billing");
                }}
                className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all active:scale-[0.99] cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
