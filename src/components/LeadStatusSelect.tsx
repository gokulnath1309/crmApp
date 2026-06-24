import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StatusOption {
  value: string;
  label: string;
  emoji: string;
  color: "neutral" | "green" | "blue" | "orange" | "red" | "purple";
  description: string;
}

const statusOptions: StatusOption[] = [
  { value: "New", label: "New", emoji: "🆕", color: "blue", description: "Fresh lead recently created" },
  { value: "Contacted", label: "Contacted", emoji: "📞", color: "neutral", description: "Initial contact established" },
  { value: "Qualified", label: "Qualified", emoji: "✅", color: "green", description: "Meets qualification criteria" },
  { value: "Proposal Sent", label: "Proposal Sent", emoji: "📄", color: "purple", description: "Proposal sent to prospect" },
  { value: "Negotiation", label: "Negotiation", emoji: "🤝", color: "orange", description: "Terms/pricing being negotiated" },
  { value: "Won", label: "Won", emoji: "🎉", color: "green", description: "Closed Won - Converted to customer" },
  { value: "Lost", label: "Lost", emoji: "❌", color: "red", description: "Closed Lost - Lead is lost" },
  { value: "Unqualified", label: "Unqualified", emoji: "🚫", color: "red", description: "Unqualified - Lead is archived" },
];

const allowedTransitions: Record<string, string[]> = {
  New: ["Contacted", "Unqualified"],
  Contacted: ["Qualified", "Unqualified", "Lost"],
  Qualified: ["Proposal Sent", "Unqualified", "Lost"],
  "Proposal Sent": ["Negotiation", "Lost"],
  Negotiation: ["Won", "Lost"],
  Won: [],
  Lost: ["New"],
  Unqualified: ["New"],
};

interface LeadStatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  currentStatus?: string; // If provided, limits transitions
  isNewLead?: boolean; // If true, allows selecting any status initially
  className?: string;
  disabled?: boolean;
}

export function LeadStatusSelect({
  value,
  onChange,
  currentStatus,
  isNewLead = false,
  className,
  disabled = false,
}: LeadStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = statusOptions.find((o) => o.value === value) || statusOptions[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isTransitionAllowed = (targetValue: string) => {
    if (targetValue === currentStatus) return true;
    if (isNewLead || !currentStatus) return true;
    const allowed = allowedTransitions[currentStatus];
    return allowed?.includes(targetValue) || false;
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full h-11 items-center justify-between px-3.5 rounded-xl border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          open ? "border-indigo-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]" : "border-slate-200 dark:border-slate-700"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base flex-shrink-0">{selectedOption.emoji}</span>
          <span className="font-medium text-slate-950 dark:text-slate-50">{selectedOption.label}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 right-0">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 mb-1">
            {isNewLead || !currentStatus ? "Select Status" : `Allowed Transitions from ${currentStatus}`}
          </div>
          <div className="max-h-[280px] overflow-y-auto space-y-0.5 scrollbar-thin">
            {statusOptions.map((o) => {
              const allowed = isTransitionAllowed(o.value);
              const isSelected = o.value === value;

              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={!allowed}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed",
                    isSelected
                      ? "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-750"
                      : "border border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/40"
                  )}
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{o.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-xs font-bold",
                        isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
                      )}>
                        {o.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                      {!allowed && (
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1 rounded-sm">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{o.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
