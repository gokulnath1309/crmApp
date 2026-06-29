import { useState } from "react";
import { CheckCircle2, Play, AlertCircle } from "lucide-react";

interface PipelineProgressProps {
  lead: any;
  transitions: any[] | undefined;
  onTransitionClick: (targetStage: string) => void;
  onQuickMarkStatus: (targetStage: string) => void;
}

export function PipelineProgress({ lead, transitions = [], onTransitionClick, onQuickMarkStatus }: PipelineProgressProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  if (!lead) return null;

  const stages = ["New", "Contacted", "Qualified", "Converted"];
  const currentIdx = stages.indexOf(lead.status);

  // Calculate duration spent in each stage
  const calculateStageMetrics = (stage: string) => {
    // 1. Entering time
    let enterTime = lead.createdAt;
    let enterUser = "System";
    if (stage !== "New") {
      const enterTrans = transitions.find(t => t.toStage === stage);
      if (enterTrans) {
        enterTime = enterTrans.transitionedAt;
        enterUser = enterTrans.userName;
      } else {
        return null; // Not entered yet
      }
    }

    // 2. Exiting time
    let exitTime = Date.now();
    let isCurrent = lead.status === stage;
    const exitTrans = transitions.find(t => t.fromStage === stage);
    
    if (exitTrans) {
      exitTime = exitTrans.transitionedAt;
      isCurrent = false;
    } else if (!isCurrent) {
      return null; // Skipped or future stage
    }

    // 3. Difference in human readable duration
    const diffMs = exitTime - enterTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let durationStr = "";
    if (diffDays > 0) {
      durationStr = `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      durationStr = `${diffHours}h ${diffMins % 60}m`;
    } else {
      durationStr = `${Math.max(1, diffMins)}m`;
    }

    return {
      enteredAt: new Date(enterTime).toLocaleString(),
      duration: durationStr,
      completedBy: enterUser,
      isCurrent,
    };
  };

  const handleStageClick = (stage: string) => {
    if (stage === lead.status) return;
    
    const clickedIdx = stages.indexOf(stage);
    if (clickedIdx === -1) return;

    // Direct transition click (triggers full validation transition drawer)
    onTransitionClick(stage);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Sales Pipeline Path
        </span>
        <span className="text-xs text-slate-400 font-medium">
          Current stage: <strong className="text-indigo-650 dark:text-indigo-400 font-bold">{lead.status}</strong>
        </span>
      </div>

      {/* Chevron Pipeline list */}
      <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-1 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto select-none">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const metrics = calculateStageMetrics(stage);

          let stageBg = "bg-slate-200/55 dark:bg-slate-805/40 text-slate-400 hover:bg-slate-300/40";
          let stageBorder = "border-transparent";
          
          if (isCurrent) {
            stageBg = "bg-indigo-600 text-white shadow-md shadow-indigo-500/20";
            stageBorder = "border-indigo-600";
          } else if (isCompleted) {
            stageBg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100/55 dark:hover:bg-emerald-950/30";
            stageBorder = "border-emerald-200/50 dark:border-emerald-900/20";
          }

          return (
            <div
              key={stage}
              onClick={() => handleStageClick(stage)}
              onMouseEnter={() => setHoveredStage(stage)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`flex-1 w-full sm:w-auto h-10 px-3.5 rounded-xl border flex items-center justify-between sm:justify-center gap-2 cursor-pointer transition-all duration-150 relative ${stageBg} ${stageBorder}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : isCurrent ? (
                  <Play className="w-3.5 h-3.5 flex-shrink-0 fill-current" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-350 dark:border-slate-600 flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </div>
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                  {stage}
                </span>
              </div>

              {/* Stage duration badge inside Chevron */}
              {metrics && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                  isCurrent 
                    ? "bg-indigo-700 text-indigo-100" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-405 dark:text-slate-400"
                }`}>
                  {metrics.duration}
                </span>
              )}

              {/* Advanced stage hover tooltip */}
              {hoveredStage === stage && (
                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-64 bg-slate-950 text-slate-100 p-3.5 rounded-xl text-xs shadow-2xl z-30 border border-slate-800 pointer-events-none flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-400">{stage} Info</span>
                    {isCurrent && <span className="text-[8px] font-extrabold px-1 bg-indigo-500 text-white rounded-sm">ACTIVE</span>}
                  </div>
                  {metrics ? (
                    <>
                      <div className="flex justify-between mt-1 text-[10px]">
                        <span className="text-slate-400">Entered:</span>
                        <strong className="text-slate-200">{metrics.enteredAt}</strong>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Time Spent:</span>
                        <strong className="text-emerald-400">{metrics.duration}</strong>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Changed By:</span>
                        <strong className="text-slate-200">{metrics.completedBy}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-450 italic mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Stage not reached yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom actions: Mark Lost and Mark Unqualified */}
      {lead.status !== "Converted" && lead.status !== "Lost" && lead.status !== "Unqualified" && (
        <div className="flex gap-3 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/50">
          <button
            onClick={() => onQuickMarkStatus("Lost")}
            className="flex-1 h-9 rounded-xl border border-rose-250 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase tracking-wider hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-colors cursor-pointer"
          >
            ❌ Mark Lead Lost
          </button>
          <button
            onClick={() => onQuickMarkStatus("Unqualified")}
            className="flex-1 h-9 rounded-xl border border-slate-205 dark:border-slate-750 text-slate-655 dark:text-slate-350 text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-805 transition-colors cursor-pointer"
          >
            🚫 Mark Unqualified
          </button>
        </div>
      )}
    </div>
  );
}
