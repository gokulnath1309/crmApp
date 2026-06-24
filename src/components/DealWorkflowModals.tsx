import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertCircle, CheckCircle2, FileText, Settings, UserPlus } from "lucide-react";

interface ClosedLostModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes?: string }) => void;
}

export function ClosedLostModal({ open, onClose, onConfirm }: ClosedLostModalProps) {
  const [reason, setReason] = useState("Price");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reasons = [
    "Price",
    "Competitor Selected",
    "Feature Gap",
    "No Decision",
    "Cancelled",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (reason === "Other" && !finalReason) {
      setError("Please specify the reason");
      return;
    }
    onConfirm({ reason: finalReason, notes: notes.trim() || undefined });
    onClose();
    // Reset state
    setReason("Price");
    setCustomReason("");
    setNotes("");
    setError("");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-450">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Mark Deal as Closed Lost</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Lost Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError("");
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {reason === "Other" && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Specify Reason *</label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter custom lost reason..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Lost Notes / Context (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide additional notes on competitor details or feedback..."
                  className="w-full h-24 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-305 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-red-650 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-red-500/10"
                >
                  Confirm Lost
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ClosedWonSuccessModalProps {
  open: boolean;
  onClose: () => void;
  dealTitle: string;
}

export function ClosedWonSuccessModal({ open, onClose, dealTitle }: ClosedWonSuccessModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden text-center"
          >
            {/* Celebration Decorative Circles */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />

            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-center text-emerald-500 mb-5"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              
              <h3 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Deal Won! 🎉
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Congratulations! The deal <strong>{dealTitle}</strong> has been successfully closed.
              </p>

              <div className="w-full mt-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-left space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Automated Tasks Generated</h4>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-805 dark:text-slate-205">Onboarding Task Created</h5>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal">Setup user access, files, and kickoff call (Due in 7 days).</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-805 dark:text-slate-205">Implementation Setup Created</h5>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal">Kick off developer setup and custom onboarding integration (Due in 14 days).</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-805 dark:text-slate-205">Invoice Placeholder Setup</h5>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-normal">Billing team notified to draft invoice for approval (Due in 3 days).</p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-6 h-12 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/15 active:scale-98"
              >
                Awesome, got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
