import { Inbox, Calendar, Pin, Archive, ChevronRight } from "lucide-react";

interface QuickFiltersProps {
  currentFilter: string;
  onChangeFilter: (filter: string) => void;
  counts: { unread: number } | undefined;
}

export function QuickFilters({ currentFilter, onChangeFilter, counts }: QuickFiltersProps) {
  const filters = [
    { key: "unread", label: "Unread", icon: Inbox, count: counts?.unread ?? 0 },
    { key: "today", label: "Today", icon: Calendar },
    { key: "week", label: "This Week", icon: Calendar },
    { key: "pinned", label: "Pinned", icon: Pin },
    { key: "archived", label: "Archived", icon: Archive },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
        Quick Filters
      </h4>
      <div className="space-y-1">
        {filters.map(item => {
          const Icon = item.icon;
          const isActive = currentFilter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChangeFilter(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {item.label}
              </span>
              <div className="flex items-center gap-1">
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold text-[9px]">
                    {item.count}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-350 dark:text-slate-550" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
