import { Check, CheckSquare, Pin, Trash2, X, Archive } from "lucide-react";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: "read" | "unread" | "archive" | "unarchive" | "pin" | "unpin" | "delete") => void;
}

export function BulkActionToolbar({ selectedCount, onClear, onAction }: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-center gap-4 bg-slate-900 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex-nowrap">
        {/* Count */}
        <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
          <button onClick={onClear} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold tracking-wider">{selectedCount} Selected</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAction("read")}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-805 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            title="Mark all read"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Mark Read</span>
          </button>

          <button
            onClick={() => onAction("unread")}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-805 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            title="Mark all unread"
          >
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Mark Unread</span>
          </button>

          <button
            onClick={() => onAction("archive")}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-805 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            title="Archive selected"
          >
            <Archive className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Archive</span>
          </button>

          <button
            onClick={() => onAction("pin")}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-805 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            title="Pin selected"
          >
            <Pin className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Pin</span>
          </button>

          <button
            onClick={() => onAction("delete")}
            className="flex items-center gap-1 px-3 py-1.5 hover:bg-rose-950/40 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
            title="Delete selected"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
