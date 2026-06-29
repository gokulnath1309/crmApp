import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertCircle, Search, Sparkles } from "lucide-react";

interface UnqualifiedModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes?: string; reminderDate?: string }) => void;
}

export function UnqualifiedModal({ open, onClose, onConfirm }: UnqualifiedModalProps) {
  const [reason, setReason] = useState("No Budget");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [setReminder, setSetReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [error, setError] = useState("");

  const reasons = [
    "No Budget",
    "Wrong Industry",
    "No Decision Maker",
    "Outside Service Area",
    "Product Not Suitable",
    "Future Opportunity",
    "Student",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (reason === "Other" && !finalReason) {
      setError("Please specify the reason");
      return;
    }
    if (setReminder && !reminderDate) {
      setError("Please select a date for the reopen reminder");
      return;
    }

    onConfirm({
      reason: finalReason,
      notes: notes.trim() || undefined,
      reminderDate: setReminder ? reminderDate : undefined,
    });
    onClose();
    // Reset state
    setReason("No Budget");
    setCustomReason("");
    setNotes("");
    setSetReminder(false);
    setReminderDate("");
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
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
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
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context or details on why this lead is unqualified..."
                  className="w-full h-20 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Reopen Reminder Checkbox */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setReminder}
                    onChange={(e) => {
                      setSetReminder(e.target.checked);
                      setError("");
                    }}
                    className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Set Reopen Reminder (Optional)</span>
                </label>
                
                {setReminder && (
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => {
                      setReminderDate(e.target.value);
                      setError("");
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                )}
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-305 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-rose-500/10 cursor-pointer"
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
  onConfirm: (data: { reason: string; notes?: string; lostDate: number }) => void;
}

export function LostModal({ open, onClose, onConfirm }: LostModalProps) {
  const [reason, setReason] = useState("Competitor");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lostDateStr, setLostDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const reasons = [
    "Competitor",
    "Too Expensive",
    "No Response",
    "Cancelled",
    "Timing",
    "Other",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (reason === "Other" && !finalReason) {
      setError("Please specify the reason");
      return;
    }
    if (!lostDateStr) {
      setError("Please select the lost date");
      return;
    }

    onConfirm({
      reason: finalReason,
      notes: notes.trim() || undefined,
      lostDate: new Date(`${lostDateStr}T12:00:00`).getTime(),
    });
    onClose();
    // Reset state
    setReason("Competitor");
    setCustomReason("");
    setNotes("");
    setLostDateStr(new Date().toISOString().split("T")[0]);
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
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-455">
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
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
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
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Lost Date *</label>
                <input
                  type="date"
                  value={lostDateStr}
                  onChange={(e) => {
                    setLostDateStr(e.target.value);
                    setError("");
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context or details on why this lead was lost..."
                  className="w-full h-20 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-305 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-orange-605 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-orange-500/10 cursor-pointer"
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
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Reopen Lead</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-355 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Reopening Reason *</label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError("");
                  }}
                  placeholder="Explain why you are reopening this lead (e.g. customer re-engaged, budget approved, etc.)..."
                  className="w-full h-24 px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-305 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-705 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Confirm Reopen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface SpamModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; notes?: string }) => void;
}

export function SpamModal({ open, onClose, onConfirm }: SpamModalProps) {
  const [reason, setReason] = useState("Spam");
  const [notes, setNotes] = useState("");

  const reasons = ["Spam", "Bot", "Invalid Contact", "Fake Information"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ reason, notes: notes.trim() || undefined });
    onClose();
    // Reset state
    setReason("Spam");
    setNotes("");
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
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-650 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Mark Lead as Spam</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Spam Category *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Spam / Bot Details (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Details about spam/bot verification (e.g. fake domain name, repetitive bot entries)..."
                  className="w-full h-24 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-305 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-red-500/10 cursor-pointer"
                >
                  Confirm Spam
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface DuplicateModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    targetLeadId: string;
    mergeNotes: boolean;
    mergeActivities: boolean;
    mergeFiles: boolean;
    mergeTimeline: boolean;
    notes?: string;
  }) => void;
  leads: any[] | undefined;
  currentLeadId: string;
}

export function DuplicateModal({ open, onClose, onConfirm, leads = [], currentLeadId }: DuplicateModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [mergeNotes, setMergeNotes] = useState(true);
  const [mergeActivities, setMergeActivities] = useState(true);
  const [mergeFiles, setMergeFiles] = useState(true);
  const [mergeTimeline, setMergeTimeline] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const otherLeads = leads.filter(
    (l) => l._id !== currentLeadId && l.status !== "Duplicate" && l.status !== "Spam"
  );

  const filteredLeads = searchQuery.trim()
    ? otherLeads.filter(
        (l) =>
          l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (l.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setError("Please select the target lead to merge into");
      return;
    }

    onConfirm({
      targetLeadId: selectedLeadId,
      mergeNotes,
      mergeActivities,
      mergeFiles,
      mergeTimeline,
      notes: notes.trim() || undefined,
    });
    onClose();
    // Reset state
    setSearchQuery("");
    setSelectedLeadId("");
    setMergeNotes(true);
    setMergeActivities(true);
    setMergeFiles(true);
    setMergeTimeline(true);
    setNotes("");
    setError("");
  };

  const selectedLeadDetails = otherLeads.find((l) => l._id === selectedLeadId);

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
            className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Merge Duplicate Lead</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2 scrollbar-thin">
              {/* Search Lead */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Search Lead to Merge Into *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company name, contact, email..."
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                
                {/* Search Results */}
                {searchQuery && (
                  <div className="border border-slate-100 dark:border-slate-700 rounded-xl max-h-36 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLeads.length === 0 ? (
                      <p className="text-[11px] italic text-slate-400 p-3 text-center">No matching leads found.</p>
                    ) : (
                      filteredLeads.map((l) => (
                        <div
                          key={l._id}
                          onClick={() => handleSelectLead(l._id)}
                          className={`p-2.5 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                            selectedLeadId === l._id
                              ? "bg-indigo-600 text-white font-bold"
                              : "hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <p className="font-semibold text-xs">{l.company}</p>
                          <p className={`text-[10px] ${selectedLeadId === l._id ? "text-indigo-200" : "text-slate-400"}`}>
                            {l.firstName} {l.lastName} • {l.email}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Lead details */}
              {selectedLeadDetails && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-indigo-700 dark:text-indigo-400 text-xs">Target Record Selected:</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedLeadDetails.company}</p>
                  <p className="text-slate-500 dark:text-slate-400">{selectedLeadDetails.firstName} {selectedLeadDetails.lastName} • {selectedLeadDetails.email}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Current Stage: {selectedLeadDetails.status}</p>
                </div>
              )}

              {/* Merge details options */}
              <div className="space-y-2 bg-slate-50/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Merge Settings</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={mergeNotes}
                      onChange={(e) => setMergeNotes(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Merge Notes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={mergeActivities}
                      onChange={(e) => setMergeActivities(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                    />
                    <span>Merge Activities</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={mergeFiles}
                      onChange={(e) => setMergeFiles(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                    />
                    <span>Merge Files</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={mergeTimeline}
                      onChange={(e) => setMergeTimeline(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                    />
                    <span>Merge Stage Transitions</span>
                  </label>
                </div>
              </div>

              {/* Merge Notes Text */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Merge Audit Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Context on why these records are merged (e.g. duplicate online submission, existing enterprise account contact)..."
                  className="w-full h-16 px-3.5 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

              <div className="flex gap-3 pt-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-305 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-705 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Archive Duplicate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
