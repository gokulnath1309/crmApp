import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertCircle } from "lucide-react";

interface UnqualifiedModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes?: string }) => void;
}

export function UnqualifiedModal({ open, onClose, onConfirm }: UnqualifiedModalProps) {
  const [reason, setReason] = useState("No Budget");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reasons = [
    "No Budget",
    "No Need",
    "Wrong Contact",
    "Duplicate",
    "Competitor Won",
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
    setReason("No Budget");
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
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-450">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Mark Lead as Unqualified</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Reason *</label>
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
                    placeholder="Enter custom reason..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context or details on why this lead is unqualified..."
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
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-705 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-rose-500/10"
                >
                  Confirm Archive
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface LostModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes?: string }) => void;
}

export function LostModal({ open, onClose, onConfirm }: LostModalProps) {
  const [reason, setReason] = useState("Price");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reasons = [
    "Price",
    "Competitor Won",
    "No Decision / Budget",
    "Cancelled / Postponed",
    "No Response / Ghosted",
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
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-450">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Mark Lead as Lost</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Reason *</label>
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
                    placeholder="Enter custom reason..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context or details on why this lead was lost..."
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
                  className="flex-1 h-11 bg-orange-605 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-orange-500/10"
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

interface RequalifyModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string }) => void;
}

export function RequalifyModal({ open, onClose, onConfirm }: RequalifyModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please explain the reason for requalifying this lead");
      return;
    }
    onConfirm({ reason: reason.trim() });
    onClose();
    setReason("");
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
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Requalify / Reopen Lead</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Requalification Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError("");
                  }}
                  placeholder="Explain why you are reopening this lead (e.g. customer contacted us again, budget approved, etc.)..."
                  className="w-full h-24 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 resize-none"
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-705 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/10"
                >
                  Confirm Requalify
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
