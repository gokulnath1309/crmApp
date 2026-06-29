import React, { useState } from "react";
import { Settings, BellOff, VolumeX, Mail, CheckSquare, ShieldCheck, ChevronRight } from "lucide-react";

interface QuickActionsProps {
  onOpenSettings: () => void;
  onMarkAllRead: () => void;
}

export function QuickActions({ onOpenSettings, onMarkAllRead }: QuickActionsProps) {
  const [dndActive, setDndActive] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
        Quick Actions
      </h4>
      <div className="space-y-2">
        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100/60 dark:border-slate-700/30 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-start gap-2.5">
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-indigo-650 transition-colors mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-205">Notification Settings</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">Configure delivery channels</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-350" />
        </button>

        {/* DND Toggle */}
        <button
          onClick={() => setDndActive(!dndActive)}
          className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100/60 dark:border-slate-700/30 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-start gap-2.5">
            <BellOff className={`w-4 h-4 transition-colors mt-0.5 ${dndActive ? "text-rose-500" : "text-slate-400 group-hover:text-indigo-650"}`} />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-205">Do Not Disturb</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">{dndActive ? "Notifications are paused" : "Pause workspace updates"}</p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${dndActive ? "bg-rose-500 animate-pulse" : "bg-slate-300 dark:bg-slate-650"}`} />
        </button>
      </div>
    </div>
  );
}
