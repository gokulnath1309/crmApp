import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useToast } from "../ui/Toast";
import {
  Calendar, Phone, Repeat, CheckSquare, Monitor,
  MapPin, GraduationCap, User, Umbrella, MoreHorizontal,
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

function toDateStr(ts: number) {
  const d = new Date(ts);
  return d.toISOString().split("T")[0];
}

function toTimeStr(ts: number) {
  const d = new Date(ts);
  return d.toTimeString().split(":").slice(0, 2).join(":");
}

function toTimestamp(dateStr: string, timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(dateStr);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
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

  const leads = useQuery(api.leads.list, {});
  const contacts = useQuery(api.contacts.list, {});
  const companies = useQuery(api.companies.list, {});
  const deals = useQuery(api.deals.list, {});

  const isEdit = !!event;

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

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventType(event.eventType || "Meeting");
      setRelatedType(event.relatedType || "");
      setRelatedId(event.relatedId || "");
      setAssignedTo(event.assignedTo || "");
      setStartDate(toDateStr(event.start));
      setStartTime(toTimeStr(event.start));
      setEndDate(toDateStr(event.end));
      setEndTime(toTimeStr(event.end));
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

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!startDate) errs.startDate = "Start date is required";
    if (!allDay && !startTime) errs.startTime = "Start time is required";
    if (!endDate) errs.endDate = "End date is required";
    if (!allDay && !endTime) errs.endTime = "End time is required";

    if (startDate && endDate && !errors.startDate && !errors.endDate) {
      const start = allDay
        ? new Date(startDate).getTime()
        : startTime
          ? toTimestamp(startDate, startTime)
          : 0;
      const end = allDay
        ? new Date(endDate).getTime() + 86400000
        : endTime
          ? toTimestamp(endDate, endTime)
          : 0;
      if (end <= start) {
        errs.endDate = "End must be after start";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const start = allDay
        ? new Date(startDate).getTime()
        : toTimestamp(startDate, startTime);
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
        start,
        end,
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

  function getRelatedOptions() {
    if (!relatedType) return [];
    let items: any[] = [];
    if (relatedType === "lead") items = (leads || []).map((l: any) => ({ value: l._id, label: `${l.firstName} ${l.lastName}` }));
    if (relatedType === "contact") items = (contacts || []).map((c: any) => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }));
    if (relatedType === "company") items = (companies || []).map((c: any) => ({ value: c._id, label: c.name }));
    if (relatedType === "deal") items = (deals || []).map((d: any) => ({ value: d._id, label: d.title }));
    return items;
  }

  const userOptions = (users || []).map(u => ({
    value: u._id,
    label: u.name || u.email || "Unknown",
  }));

  const EventTypeIcon = EVENT_TYPES.find(t => t.value === eventType)?.icon || Calendar;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Event" : "Create Event"} className="max-w-2xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
            <EventTypeIcon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Event title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Event Type</label>
            <Select
              options={EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
              value={eventType}
              onChange={setEventType}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Status</label>
            <Select options={STATUSES} value={status} onChange={setStatus} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Related Record</label>
          <div className="grid grid-cols-2 gap-3">
            <Select options={RELATED_TYPES} value={relatedType} onChange={(v) => { setRelatedType(v); setRelatedId(""); }} />
            {relatedType && (
              <Select
                options={getRelatedOptions()}
                value={relatedId}
                onChange={setRelatedId}
                placeholder={`Search ${relatedType}...`}
                searchPlaceholder={`Search ${relatedType}...`}
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Assigned To</label>
          <Select
            options={[{ value: "", label: "Myself" }, ...userOptions]}
            value={assignedTo}
            onChange={setAssignedTo}
            placeholder="Myself"
            searchPlaceholder="Search users..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1E293B]">Date & Time</label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              All Day
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            {!allDay && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                />
                {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
              />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
            {!allDay && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                />
                {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Location Type</label>
            <Select options={LOCATION_TYPES} value={locationType} onChange={setLocationType} placeholder="Select location type" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Location</label>
            <Input
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Meeting Provider</label>
            <Select options={MEETING_PROVIDERS} value={meetingProvider} onChange={setMeetingProvider} placeholder="Select provider" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Meeting Link</label>
            <Input
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Priority</label>
            <Select options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Reminder</label>
            <Select options={REMINDERS} value={reminder} onChange={setReminder} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Repeat</label>
            <Select options={REPEATS} value={repeat} onChange={setRepeat} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-xl transition-all ${color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Guests</label>
          <Input
            placeholder="Enter email addresses, separated by commas"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            hint="Separate multiple emails with commas"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>
          {isEdit ? "Update Event" : "Save Event"}
        </Button>
      </div>
    </Modal>
  );
}
