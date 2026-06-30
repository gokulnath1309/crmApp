import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Crown, Check, X, Sparkles, Users, BarChart3, Zap, Sliders, Columns, HeadphonesIcon, HardDrive } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const BENEFITS = [
  { icon: Check, label: "Unlimited Workspaces", color: "text-indigo-600" },
  { icon: Users, label: "Team Collaboration", color: "text-blue-600" },
  { icon: BarChart3, label: "Advanced Reports", color: "text-emerald-600" },
  { icon: Zap, label: "Automation", color: "text-amber-600" },
  { icon: Sliders, label: "Workflow Rules", color: "text-violet-600" },
  { icon: Columns, label: "Custom Fields", color: "text-rose-600" },
  { icon: HeadphonesIcon, label: "Priority Support", color: "text-cyan-600" },
  { icon: HardDrive, label: "More Storage", color: "text-sky-600" },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" onClick={onClose} />
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative w-full max-w-[600px] bg-white rounded-[20px] border border-[#E8EAF3] shadow-[0_20px_60px_rgba(15,23,42,0.12)] overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-10 pt-10 pb-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-200">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Upgrade Your Workspace
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                You've reached the maximum number of workspaces included in your current plan.
                Upgrade to create additional workspaces and unlock premium CRM features.
              </p>
            </div>

            <div className="px-10 pb-2">
              <div className="rounded-2xl border border-[#E8EAF3] bg-slate-50/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Current Plan</p>
                    <p className="text-base font-bold text-slate-900">Basic</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Workspace Limit</p>
                    <p className="text-sm font-semibold text-slate-700">1 / 1 Used</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                </div>
              </div>
            </div>

            <div className="px-10 pb-2">
              <div className="rounded-2xl border border-[#E8EAF3] bg-gradient-to-br from-indigo-50 to-violet-50/50 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Upgrade To</p>
                    <p className="text-base font-bold text-slate-900">Professional</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Includes</p>
                    <p className="text-sm font-bold text-indigo-600">Unlimited Workspaces</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 pb-2">
              <div className="grid grid-cols-2 gap-2">
                {BENEFITS.map((benefit) => (
                  <div key={benefit.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#EEF1F7] bg-white">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <benefit.icon className={`w-3.5 h-3.5 ${benefit.color}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{benefit.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-10 pb-6 pt-2 space-y-3">
              <button
                onClick={() => {
                  onClose();
                  navigate("/pricing");
                }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
              >
                Upgrade Plan
              </button>
              <button
                onClick={onClose}
                className="w-full h-12 rounded-xl border border-[#D8DCE6] text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate("/pricing");
                }}
                className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                Compare Plans
              </button>
            </div>

            <div className="px-10 py-4 border-t border-[#EEF1F7] text-center">
              <p className="text-xs text-slate-400">
                Need help choosing a plan?{" "}
                <a href="mailto:sales@crmpro.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Contact Sales
                </a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
