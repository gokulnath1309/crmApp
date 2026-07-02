import { useState } from "react";
import { Settings, BellOff, ChevronRight } from "lucide-react";

interface QuickActionsProps {
  onOpenSettings: () => void;
  onMarkAllRead: () => void;
}

export function QuickActions({ onOpenSettings }: QuickActionsProps) {
  const [dndActive, setDndActive] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
      <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-3">
        Quick Actions
      </h4>
      <div className="space-y-2">
        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-3 bg-muted border border-border rounded-xl text-left hover:bg-accent transition-all group"
        >
          <div className="flex items-start gap-2.5">
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-indigo-650 transition-colors mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Notification Settings</p>
              <p className="text-[9px] text-muted-foreground">Configure delivery channels</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* DND Toggle */}
        <button
          onClick={() => setDndActive(!dndActive)}
          className="w-full flex items-center justify-between p-3 bg-muted border border-border rounded-xl text-left hover:bg-accent transition-all group"
        >
          <div className="flex items-start gap-2.5">
            <BellOff className={`w-4 h-4 transition-colors mt-0.5 ${dndActive ? "text-rose-500" : "text-muted-foreground group-hover:text-indigo-650"}`} />
            <div>
              <p className="text-xs font-bold text-foreground">Do Not Disturb</p>
              <p className="text-[9px] text-muted-foreground">{dndActive ? "Notifications are paused" : "Pause workspace updates"}</p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${dndActive ? "bg-rose-500 animate-pulse" : "bg-muted-foreground/30"}`} />
        </button>
      </div>
    </div>
  );
}
