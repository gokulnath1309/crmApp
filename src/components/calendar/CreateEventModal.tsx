import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { cn } from "@/lib/cn";
import {
  Calendar, Phone, Repeat, CheckSquare, Monitor,
  MapPin, GraduationCap, User, Umbrella, MoreHorizontal,
  Info, Clock, Users, Link2, Bell, FileText, X,
  UserCircle, Loader2,
} from "lucide-react";

const EVENT_TYPES = [
  { value: "Meeting", label: "Meeting", icon: Calendar, color: "#4F46E5" },
  { value: "Call", label: "Call", icon: Phone, color: "#059669" },
  { value: "Follow-up", label: "Follow-up", icon: Repeat, color: "#D97706" },
  { value: "Task", label: "Task", icon: CheckSquare, color: "#DC2626" },
  { value: "Demo", label: "Demo", icon: Monitor, color: "#7C3AED" },
  { value: "Presentation", label: "Presentation", icon: Monitor, color: "#2563EB" },
  { value: "Site Visit", label: "Site Visit", icon: MapPin, color: "#0891B2" },
  { value: "Training", label: "Training", icon: GraduationCap, color: "#0D9488" },
  { value: "Personal", label: "Personal", icon: User, color: "#9333EA" },
  { value: "Holiday", label: "Holiday", icon: Umbrella, color: "#E11D48" },
  { value: "Other", label: "Other", icon: MoreHorizontal, color: "#64748B" },
];

const LOCATION_TYPES = [
  { value: "", label: "No location" },
  { value: "Office", label: "Office" },
  { value: "Customer Address", label: "Customer Address" },
  { value: "Hotel", label: "Hotel" },
  { value: "Online", label: "Online" },
  { value: "Custom", label: "Custom" },
];

const MEETING_PROVIDERS = [
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "custom", label: "Custom URL" },
];

const PRIORITIES = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const REMINDERS = [
  { value: "None", label: "None" },
  { value: "5 min", label: "5 minutes before" },
  { value: "10 min", label: "10 minutes before" },
  { value: "15 min", label: "15 minutes before" },
  { value: "30 min", label: "30 minutes before" },
  { value: "1 hour", label: "1 hour before" },
  { value: "2 hours", label: "2 hours before" },
  { value: "1 day", label: "1 day before" },
];

const REPEATS = [
  { value: "None", label: "Does not repeat" },
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" },
  { value: "Custom", label: "Custom" },
];

const STATUSES = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Missed", label: "Missed" },
  { value: "Rescheduled", label: "Rescheduled" },
];

const COLORS = [
  "#4F46E5", "#059669", "#D97706", "#DC2626", "#7C3AED",
  "#2563EB", "#0891B2", "#0D9488", "#9333EA", "#E11D48",
  "#F97316", "#14B8A6",
];

const RELATED_TYPES = [
  { value: "", label: "None" },
  { value: "lead", label: "Lead" },
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
];

const NOTIFICATION_TYPES = [
  { value: "email", label: "Email" },
  { value: "browser", label: "Browser" },
  { value: "sms", label: "SMS", disabled: true },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (UTC-5)" },
  { value: "America/Chicago", label: "Central Time (UTC-6)" },
  { value: "America/Denver", label: "Mountain Time (UTC-7)" },
  { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Europe/Berlin", label: "CET (UTC+1)" },
  { value: "Asia/Dubai", label: "GST (UTC+4)" },
  { value: "Asia/Kolkata", label: "IST (UTC+5:30)" },
  { value: "Asia/Singapore", label: "SGT (UTC+8)" },
  { value: "Asia/Tokyo", label: "JST (UTC+9)" },
  { value: "Australia/Sydney", label: "AEDT (UTC+11)" },
  { value: "Pacific/Auckland", label: "NZDT (UTC+13)" },
];

function toDateStr(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
}

function toTimeStr(ts: number) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function toTimestamp(dateStr: string, timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

function getDefaultTime(offsetHours: number) {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface UserSelectOption {
  _id: string;
  name: string;
  email: string;
}

// ─── Section Card ────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, children, className }: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50 dark:border-slate-700/30">
        <Icon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

// ─── Field Label ─────────────────────────────────────────────────────
function FieldLabel({ label, required, children }: { label: string; required?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Related Record Chip ─────────────────────────────────────────────
const RELATED_ICONS: Record<string, string> = {
  lead: "\u{1F464}", contact: "\u{1F464}", company: "\u{1F3E2}", deal: "\u{1F4B0}",
};

// ─── Main Modal ──────────────────────────────────────────────────────
interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  event?: any;
  defaultDate?: number;
  users: UserSelectOption[];
}

export function CreateEventModal({ open, onClose, onSave, event, defaultDate, users }: CreateEventModalProps) {
  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const leads = useQuery(api.leads.list, {});
  const contacts = useQuery(api.contacts.list, {});
  const companies = useQuery(api.companies.list, {});
  const deals = useQuery(api.deals.list, {});

  const isEdit = !!event;

  // ── State ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("Meeting");
  const [relatedType, setRelatedType] = useState("");
  const [relatedId, setRelatedId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingProvider, setMeetingProvider] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [reminder, setReminder] = useState("None");
  const [repeat, setRepeat] = useState("None");
  const [color, setColor] = useState("#4F46E5");
  const [status, setStatus] = useState("Scheduled");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Future-ready placeholders
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York");
  const [notifType, setNotifType] = useState("email");
  const [onlineMeeting, setOnlineMeeting] = useState(false);

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  // ── Init from event / defaults ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventType(event.eventType || "Meeting");
      setRelatedType(event.relatedType || "");
      setRelatedId(event.relatedId || "");
      setAssignedTo(event.assignedTo || "");
      const startTimestamp = event.start || event.startTime;
      const endTimestamp = event.end || event.endTime;
      setStartDate(toDateStr(startTimestamp));
      setStartTime(toTimeStr(startTimestamp));
      setEndDate(toDateStr(endTimestamp));
      setEndTime(toTimeStr(endTimestamp));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setLocationType(event.locationType || "");
      setMeetingLink(event.meetingLink || "");
      setMeetingProvider(event.meetingProvider || "");
      setPriority(event.priority || "Medium");
      setReminder(event.reminder || "None");
      setRepeat(event.repeat || "None");
      setColor(event.color || "#4F46E5");
      setStatus(event.status || "Scheduled");
      setGuests(event.guests?.join(", ") || "");
      setNotes(event.notes || "");
    } else {
      const now = new Date();
      const today = toDateStr(now.getTime());
      setTitle("");
      setDescription("");
      setEventType("Meeting");
      setRelatedType("");
      setRelatedId("");
      setAssignedTo("");
      setAllDay(false);
      setLocation("");
      setLocationType("");
      setMeetingLink("");
      setMeetingProvider("");
      setPriority("Medium");
      setReminder("None");
      setRepeat("None");
      setColor("#4F46E5");
      setStatus("Scheduled");
      setGuests("");
      setNotes("");

      if (defaultDate) {
        setStartDate(toDateStr(defaultDate));
        setEndDate(toDateStr(defaultDate));
        setStartTime(getDefaultTime(1));
        setEndTime(getDefaultTime(2));
      } else {
        setStartDate(today);
        setEndDate(today);
        setStartTime(getDefaultTime(1));
        setEndTime(getDefaultTime(2));
      }
    }
    setErrors({});
  }, [open, event, defaultDate]);

  // ── Related record helpers ─────────────────────────────────────────
  const relatedLabel = useMemo(() => {
    if (!relatedType || !relatedId) return null;
    let items: any[] = [];
    if (relatedType === "lead") items = leads || [];
    else if (relatedType === "contact") items = contacts || [];
    else if (relatedType === "company") items = companies || [];
    else if (relatedType === "deal") items = deals || [];
    const item = items.find((i: any) => i._id === relatedId);
    if (!item) return null;
    let label = "";
    if (relatedType === "lead") label = `${item.firstName || ""} ${item.lastName || ""}`.trim();
    else if (relatedType === "contact") label = `${item.firstName || ""} ${item.lastName || ""}`.trim();
    else if (relatedType === "company") label = item.name || "";
    else if (relatedType === "deal") label = item.title || "";
    return { icon: RELATED_ICONS[relatedType], label };
  }, [relatedType, relatedId, leads, contacts, companies, deals]);

  function getRelatedOptions() {
    if (!relatedType) return [];
    let items: any[] = [];
    if (relatedType === "lead") items = (leads || []).map((l: any) => ({ value: l._id, label: `${l.firstName} ${l.lastName}` }));
    if (relatedType === "contact") items = (contacts || []).map((c: any) => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }));
    if (relatedType === "company") items = (companies || []).map((c: any) => ({ value: c._id, label: c.name }));
    if (relatedType === "deal") items = (deals || []).map((d: any) => ({ value: d._id, label: d.title }));
    return items;
  }

  // ── Validation ─────────────────────────────────────────────────────
  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!startDate) errs.startDate = "Start date is required";
    if (!allDay && !startTime) errs.startTime = "Start time is required";
    if (!endDate) errs.endDate = "End date is required";
    if (!allDay && !endTime) errs.endTime = "End time is required";

    if (startDate && endDate) {
      const start = allDay
        ? new Date(startDate).getTime()
        : startTime ? toTimestamp(startDate, startTime) : 0;
      const end = allDay
        ? new Date(endDate).getTime() + 86400000
        : endTime ? toTimestamp(endDate, endTime) : 0;
      if (end <= start) {
        errs.endDate = "End must be after start";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ───────────────────────────────────────────────────────────
  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const start = allDay ? new Date(startDate).getTime() : toTimestamp(startDate, startTime);
      const end = allDay
        ? new Date(endDate || startDate).getTime() + 86400000
        : toTimestamp(endDate || startDate, endTime);

      const payload: any = {
        title: title.trim(),
        description: description || undefined,
        eventType,
        relatedType: relatedType || undefined,
        relatedId: relatedId || undefined,
        assignedTo: assignedTo || undefined,
        start, end,
        allDay: allDay || undefined,
        location: location || undefined,
        locationType: locationType || undefined,
        meetingLink: meetingLink || undefined,
        meetingProvider: meetingProvider || undefined,
        priority: priority || undefined,
        reminder: reminder === "None" ? undefined : reminder,
        repeat: repeat === "None" ? undefined : repeat,
        color: color || undefined,
        guests: guests ? guests.split(",").map(g => g.trim()).filter(Boolean) : undefined,
        notes: notes || undefined,
      };

      if (isEdit) {
        await updateEvent({ id: event._id, ...payload });
        toast("success", "Event updated successfully");
      } else {
        await createEvent(payload);
        toast("success", "Event created successfully");
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast("error", err.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  const userOptions = (users || []).map(u => ({ value: u._id, label: u.name || u.email || "Unknown" }));
  const EventTypeIcon = EVENT_TYPES.find(t => t.value === eventType)?.icon || Calendar;
  const inputClass = "w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
  const inputErrorClass = "border-red-300 focus:border-red-500 focus:ring-red-500/20";

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Modal open={open} onClose={onClose} className="max-w-[900px] p-0 max-h-[90vh] flex flex-col">
      <form ref={formRef} onSubmit={handleSave} className="flex flex-col max-h-[90vh]">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: color + "18" }}
            >
              <EventTypeIcon className="h-5 w-5" style={{ color }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEdit ? "Edit Event" : "Create Event"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Schedule a new event</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Color picker */}
            <div className="hidden sm:flex items-center gap-1">
              {COLORS.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-5 w-5 rounded-full transition-all",
                    color === c ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800 scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Set color ${c}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ── Section: General Information ── */}
            <SectionCard icon={Info} title="General Information" className="lg:col-span-2">
              <div>
                <FieldLabel label="Event Title" required />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Review with Client"
                  className={cn(inputClass, errors.title && inputErrorClass)}
                  autoFocus
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <FieldLabel label="Description" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FieldLabel label="Event Type" />
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className={inputClass}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Status" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Priority" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={inputClass}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* ── Section: Scheduling ── */}
            <SectionCard icon={Clock} title="Scheduling">
              <div className="flex items-center justify-between">
                <FieldLabel label="All Day Event" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={allDay}
                  onClick={() => setAllDay(!allDay)}
                  className={cn(
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                    allDay ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    allDay ? "translate-x-[18px]" : "translate-x-1"
                  )} />
                </button>
              </div>

              <div>
                <FieldLabel label="Date" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={cn(inputClass, errors.startDate && inputErrorClass)}
                    />
                    {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={cn(inputClass, errors.endDate && inputErrorClass)}
                    />
                    {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-center -mt-1 mb-1">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Start &nbsp;→&nbsp; End
                  </span>
                </div>
              </div>

              {!allDay && (
                <div>
                  <FieldLabel label="Time" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={cn(inputClass, errors.startTime && inputErrorClass)}
                      />
                      {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
                    </div>
                    <div>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className={cn(inputClass, errors.endTime && inputErrorClass)}
                      />
                      {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Timezone" />
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className={inputClass}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Repeat" />
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value)}
                    className={inputClass}
                  >
                    {REPEATS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* ── Section: Participants ── */}
            <SectionCard icon={Users} title="Participants">
              <div>
                <FieldLabel label="Assigned To" />
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Myself</option>
                  {userOptions.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel label="Guests" />
                <input
                  type="text"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="Enter email addresses, separated by commas"
                  className={inputClass}
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              {guests.trim() && (
                <div className="flex flex-wrap gap-1.5">
                  {guests.split(",").map((g, i) => {
                    const email = g.trim();
                    if (!email) return null;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
                      >
                        <UserCircle className="h-3 w-3" />
                        {email}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="opacity-50 pointer-events-none">
                <FieldLabel label="Team (coming soon)" />
                <select disabled className={inputClass}>
                  <option value="">Select a team</option>
                </select>
              </div>
            </SectionCard>

            {/* ── Section: CRM Linking ── */}
            <SectionCard icon={Link2} title="CRM Linking">
              <div>
                <FieldLabel label="Related Record Type" />
                <select
                  value={relatedType}
                  onChange={(e) => { setRelatedType(e.target.value); setRelatedId(""); }}
                  className={inputClass}
                >
                  {RELATED_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {relatedType && (
                <div>
                  <FieldLabel label={`Search ${relatedType}`} />
                  <select
                    value={relatedId}
                    onChange={(e) => setRelatedId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a {relatedType}...</option>
                    {getRelatedOptions().map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {relatedLabel && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 px-3 py-2">
                  <span className="text-sm">{relatedLabel.icon}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{relatedLabel.label}</span>
                  <button
                    type="button"
                    onClick={() => { setRelatedType(""); setRelatedId(""); }}
                    className="ml-auto p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </SectionCard>

            {/* ── Section: Notifications ── */}
            <SectionCard icon={Bell} title="Notifications">
              <div>
                <FieldLabel label="Reminder" />
                <select
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  className={inputClass}
                >
                  {REMINDERS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel label="Notification Type" />
                <div className="flex gap-2">
                  {NOTIFICATION_TYPES.map((n) => (
                    <button
                      key={n.value}
                      type="button"
                      disabled={n.disabled}
                      onClick={() => setNotifType(n.value)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                        notifType === n.value && !n.disabled
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                          : n.disabled
                            ? "border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      {n.label}
                      {n.disabled && <span className="ml-1 text-[9px] opacity-60">Soon</span>}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* ── Section: Location ── */}
            <SectionCard icon={MapPin} title="Location" className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Location Type" />
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className={inputClass}
                  >
                    {LOCATION_TYPES.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Location / Address" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. 123 Main St, Conference Room B"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/30 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Online Meeting</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={onlineMeeting}
                    onClick={() => setOnlineMeeting(!onlineMeeting)}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                      onlineMeeting ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                      onlineMeeting ? "translate-x-[18px]" : "translate-x-1"
                    )} />
                  </button>
                </div>

                {onlineMeeting && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div>
                      <FieldLabel label="Provider" />
                      <select
                        value={meetingProvider}
                        onChange={(e) => setMeetingProvider(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select provider</option>
                        {MEETING_PROVIDERS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Meeting Link" />
                      <input
                        type="url"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {!onlineMeeting && meetingProvider && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Meeting provider "{MEETING_PROVIDERS.find(p => p.value === meetingProvider)?.label}" will not be used. Toggle Online Meeting on to include it.
                  </p>
                )}
              </div>
            </SectionCard>

            {/* ── Section: Notes ── */}
            <SectionCard icon={FileText} title="Notes & Attachments" className="lg:col-span-2">
              <div>
                <FieldLabel label="Notes" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes, agenda items, or follow-up instructions..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Markdown formatting supported
                </p>
              </div>

              <div>
                <FieldLabel label="Attachments" />
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-6">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Loader2 className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Drag & drop files or <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" onClick={() => toast("success", "File upload coming soon")}>browse</button>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      PDF, images, documents — up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

          </div>
        </div>

        {/* ── Sticky Footer ────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-900 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all",
              "bg-indigo-600 hover:bg-indigo-700 cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
              "dark:focus-visible:ring-offset-slate-900"
            )}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              isEdit ? "Update Event" : "Save Event"
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
}
