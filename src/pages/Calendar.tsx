import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreateEventModal } from "../components/calendar/CreateEventModal";
import { EventDetailsDrawer } from "../components/calendar/EventDetailsDrawer";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, Users, Plus, Search, X,
  Phone, Repeat, CheckSquare, Monitor,
  GraduationCap, User, Umbrella, MoreHorizontal,
  Filter, Loader2,
} from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days: (number | null)[] = Array(startPad).fill(null);
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i);
  }
  return days;
}

function isToday(year: number, month: number, day: number) {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function isSameDay(epoch: number, year: number, month: number, day: number) {
  const d = new Date(epoch);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function formatTime(epoch: number) {
  return new Date(epoch).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatTimeShort(epoch: number) {
  return new Date(epoch).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const EVENT_TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  Meeting: { icon: Users, color: "#4F46E5" },
  Call: { icon: Phone, color: "#059669" },
  "Follow-up": { icon: Repeat, color: "#D97706" },
  Task: { icon: CheckSquare, color: "#DC2626" },
  Demo: { icon: Monitor, color: "#7C3AED" },
  Presentation: { icon: Monitor, color: "#2563EB" },
  "Site Visit": { icon: MapPin, color: "#0891B2" },
  Training: { icon: GraduationCap, color: "#0D9488" },
  Personal: { icon: User, color: "#9333EA" },
  Holiday: { icon: Umbrella, color: "#E11D48" },
  Other: { icon: MoreHorizontal, color: "#64748B" },
};

const QUICK_FILTERS = [
  { value: "", label: "All Events" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const EVENT_TYPES_FILTER = [
  { value: "", label: "All Types" },
  ...Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: k })),
];

const PRIORITY_FILTER = [
  { value: "", label: "All Priorities" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const STATUS_FILTER = [
  { value: "", label: "All Status" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Missed", label: "Missed" },
  { value: "Rescheduled", label: "Rescheduled" },
];

function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<number | undefined>(undefined);
  const [viewEvent, setViewEvent] = useState<any>(null);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [duplicateEvent, setDuplicateEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [draggedEvent, setDraggedEvent] = useState<any>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const { toast } = useToast();
  const moveEvent = useMutation(api.events.move);

  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).getTime();

  const calendarData = useQuery(api.calendar.getEvents, { startDate: monthStart, endDate: monthEnd });
  const users = useQuery(api.users.list);
  const upcoming = useQuery(api.events.getUpcoming, { limit: 10 });

  const meetings = calendarData?.meetings ?? [];
  const tasks = calendarData?.tasks ?? [];
  const events = calendarData?.events ?? [];

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else { setMonth(m => m - 1); }
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else { setMonth(m => m + 1); }
  }, [month]);

  const goToday = useCallback(() => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }, []);

  const openCreateModal = useCallback((date?: number) => {
    setEditEvent(null);
    setDuplicateEvent(null);
    setDefaultDate(date ?? new Date().getTime());
    setCreateOpen(true);
  }, []);

  const openEditModal = useCallback((ev: any) => {
    setEditEvent(ev);
    setDuplicateEvent(null);
    setDefaultDate(undefined);
    setCreateOpen(true);
  }, []);

  const openDuplicateModal = useCallback((ev: any) => {
    setDuplicateEvent(ev);
    setEditEvent(null);
    setDefaultDate(undefined);
    setCreateOpen(true);
  }, []);

  const onSave = useCallback(() => {
    setEditEvent(null);
    setDuplicateEvent(null);
  }, []);

  const onEventClick = useCallback((ev: any) => {
    setViewEvent(ev);
  }, []);

  const onDayClick = useCallback((day: number | null) => {
    if (day === null) return;
    const d = new Date(year, month, day);
    openCreateModal(d.getTime());
  }, [year, month, openCreateModal]);

  const onDayDoubleClick = useCallback((day: number | null) => {
    if (day === null) return;
    const d = new Date(year, month, day);
    openCreateModal(d.getTime());
  }, [year, month, openCreateModal]);

  const userMap = useMemo(() => {
    const map: Record<string, { name: string; email: string }> = {};
    (users || []).forEach((u: any) => { map[u._id] = { name: u.name || "Unknown", email: u.email || "" }; });
    return map;
  }, [users]);

  const filteredUpcoming = useMemo(() => {
    return (upcoming || []).slice(0, 10);
  }, [upcoming]);

  const handleDragStart = useCallback((ev: any, e: React.DragEvent) => {
    setDraggedEvent(ev);
    e.dataTransfer.setData("text/plain", ev._id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, day: number | null) => {
    e.preventDefault();
    if (day !== null) setDragOverDay(day);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, day: number | null) => {
    e.preventDefault();
    if (!draggedEvent || day === null) return;
    const d = new Date(year, month, day);
    const newStart = new Date(draggedEvent.start);
    newStart.setFullYear(year, month, day);
    const duration = draggedEvent.end - draggedEvent.start;
    try {
      await moveEvent({ id: draggedEvent._id, start: newStart.getTime(), end: newStart.getTime() + duration });
      toast("success", "Event moved");
    } catch (err: any) {
      toast("error", err.message || "Failed to move event");
    }
    setDraggedEvent(null);
    setDragOverDay(null);
  }, [draggedEvent, year, month, moveEvent, toast]);

  const userOptions = (users || []).map((u: any) => ({ value: u._id, label: u.name || u.email || "Unknown" }));

  return (
    <div className="space-y-5 pb-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Meetings, tasks, and follow-ups</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={() => openCreateModal()}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 px-4 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold border transition-colors ${
            showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
        {QUICK_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setQuickFilter(quickFilter === f.value ? "" : f.value)}
            className={`px-3 h-9 rounded-xl text-xs font-semibold border transition-colors ${
              quickFilter === f.value
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/70">
          <div className="w-40">
            <Select options={EVENT_TYPES_FILTER} value={filterType} onChange={setFilterType} placeholder="All Types" />
          </div>
          <div className="w-40">
            <Select options={[{ value: "", label: "All Owners" }, ...userOptions]} value={filterOwner} onChange={setFilterOwner} placeholder="All Owners" />
          </div>
          <div className="w-40">
            <Select options={PRIORITY_FILTER} value={filterPriority} onChange={setFilterPriority} placeholder="All Priorities" />
          </div>
          <div className="w-40">
            <Select options={STATUS_FILTER} value={filterStatus} onChange={setFilterStatus} placeholder="All Status" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors"
            >
              Today
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700/70">
            {DAYS.map(d => (
              <div key={d} className="px-2 py-2.5 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const isTodayDay = day !== null && isToday(year, month, day);

              const dayEvents = [
                ...events.filter((e: any) => isSameDay(e.start, year, month, day!)),
                ...meetings.filter((m: any) => isSameDay(m.startTime, year, month, day!)),
                ...tasks.filter((t: any) => isSameDay(t.startTime, year, month, day!)),
              ];

              const isDragOver = dragOverDay === day && day !== null;

              return (
                <div
                  key={i}
                  onClick={() => onDayClick(day)}
                  onDoubleClick={() => onDayDoubleClick(day)}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                  className={`min-h-[100px] border-b border-r border-slate-50 dark:border-slate-700/40 p-1.5 cursor-pointer transition-colors ${
                    day === null ? "bg-slate-50/50 dark:bg-slate-800/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-700/20"
                  } ${isTodayDay ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""} ${isDragOver ? "bg-indigo-100/50 dark:bg-indigo-900/30" : ""}`}
                >
                  {day !== null && (
                    <>
                      <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isTodayDay ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev: any, idx: number) => {
                          const color = ev.color || (ev.eventType ? EVENT_TYPE_CONFIG[ev.eventType]?.color : "#64748B") || "#64748B";
                          const evType = ev.eventType || ev.type;
                          const iconDef = ev.eventType ? EVENT_TYPE_CONFIG[ev.eventType] : ev.type === "meeting" ? { icon: Users, color: "#4F46E5" } : { icon: CheckSquare, color: "#D97706" };
                          const Icon = iconDef?.icon || CalendarIcon;
                          const startTime = ev.start || ev.startTime;

                          return (
                            <div
                              key={`${evType}-${ev._id || idx}`}
                              onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                              draggable
                              onDragStart={(e) => handleDragStart(ev, e)}
                              className="group relative rounded-md px-1.5 py-1 text-white font-medium cursor-grab active:cursor-grabbing transition-all hover:opacity-90 hover:shadow-md"
                              style={{ backgroundColor: color }}
                              title={`${ev.title}${startTime ? ` - ${formatTimeShort(startTime)}` : ""}`}
                            >
                              <div className="flex items-center gap-1">
                                <Icon className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                <span className="text-[10px] leading-tight truncate flex-1">{ev.title}</span>
                                {startTime && !ev.allDay && (
                                  <span className="text-[9px] opacity-80 shrink-0">{formatTimeShort(startTime)}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-slate-400 font-semibold px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Upcoming Events */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
              Upcoming Events
            </h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
            {upcoming === undefined ? (
              <div className="p-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
              </div>
            ) : filteredUpcoming.length === 0 ? (
              <div className="p-6 text-center">
                <CalendarIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No upcoming events</p>
                <button
                  onClick={() => openCreateModal()}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Create your first event
                </button>
              </div>
            ) : (
              filteredUpcoming.map((ev: any, idx: number) => {
                const config = EVENT_TYPE_CONFIG[ev.eventType] || EVENT_TYPE_CONFIG.Other;
                const Icon = config.icon;
                const color = ev.color || config.color;
                const owner = userMap[ev.ownerId];

                return (
                  <div
                    key={ev._id || idx}
                    onClick={() => setViewEvent(ev)}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color + "20" }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {ev.allDay ? formatDate(ev.start) : formatTime(ev.start)}
                        </span>
                        {ev.relatedType && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            {ev.relatedType}
                          </span>
                        )}
                        {owner && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                            {owner.name}
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[10px] font-semibold mt-1"
                        style={{ color }}
                      >
                        {ev.eventType}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateEventModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditEvent(null); setDuplicateEvent(null); }}
        onSave={onSave}
        event={editEvent || (duplicateEvent ? { ...duplicateEvent, _id: undefined, title: `${duplicateEvent.title} (Copy)` } : undefined)}
        defaultDate={defaultDate}
        users={users || []}
      />

      {/* Event Details Drawer */}
      {viewEvent && (
        <EventDetailsDrawer
          event={viewEvent}
          users={users || []}
          onClose={() => setViewEvent(null)}
          onEdit={(ev) => { setViewEvent(null); openEditModal(ev); }}
          onDelete={() => setViewEvent(null)}
          onDuplicate={(ev) => { setViewEvent(null); openDuplicateModal(ev); }}
        />
      )}
    </div>
  );
}

export { CalendarPage };
