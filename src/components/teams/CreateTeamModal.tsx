import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const TEAM_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

const TEAM_ICONS = ["Users", "Target", "Briefcase", "Star", "Heart", "Zap", "Shield", "Globe"];

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTeamModal({ open, onClose, onSuccess }: CreateTeamModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [icon, setIcon] = useState(TEAM_ICONS[0]);
  const [teamLeadId, setTeamLeadId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allEmployees = useQuery(api.teams.getEmployees, {});
  const availableEmployees = useQuery(api.teams.getAvailableEmployees, {});
  const createTeam = useMutation(api.teams.create);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setDepartment("");
      setColor(TEAM_COLORS[0]);
      setIcon(TEAM_ICONS[0]);
      setTeamLeadId("");
      setSelectedMembers([]);
      setMemberSearch("");
      setErrors({});
    }
  }, [open]);

  // Team Lead dropdown shows all active employees
  const employeeOptions: SelectOption[] = (allEmployees ?? [])
    .filter((e: any) => e.isActive)
    .map((e: any) => ({
      value: e._id,
      label: e.name,
      searchString: `${e.name} ${e.email} ${e.department}`,
    }));

  // Member picker shows only employees not assigned to any team
  const filteredEmployees = (availableEmployees ?? []).filter((e: any) => {
    const term = memberSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.department?.toLowerCase().includes(term)
    );
  });

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length < 3) {
      newErrors.name = "Team name must be at least 3 characters";
    }
    if (name && name.trim().length > 50) {
      newErrors.name = "Team name must be 50 characters or less";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createTeam({
        name: name.trim(),
        description: description.trim() || undefined,
        department: department || undefined,
        color,
        icon,
        teamLeadId: (teamLeadId as any) || undefined,
        memberIds: selectedMembers.filter((m) => m !== teamLeadId) as any,
      });
      toast("success", `Team "${name.trim()}" created successfully`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast("error", err.message || "Failed to create team");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Team" className="max-w-2xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        <Input
          label="Team Name *"
          placeholder="e.g. Sales Squad"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
          error={errors.name}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#1E293B] dark:text-white">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team do?"
            rows={3}
            className="flex w-full rounded-xl border border-outline-variant bg-surface-alt px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Department"
            placeholder="e.g. Sales, Marketing"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#1E293B] dark:text-white">Team Lead</label>
            <Select
              options={employeeOptions}
              value={teamLeadId}
              onChange={setTeamLeadId}
              placeholder="Select team lead"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#1E293B] dark:text-white">Color</label>
          <div className="flex gap-2">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all cursor-pointer",
                  color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-4 h-4 text-white mx-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#1E293B] dark:text-white">Add Members</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-alt text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div className="max-h-40 overflow-y-auto border border-outline-variant rounded-xl divide-y divide-outline-variant/50">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                {memberSearch ? "No employees found" : "No employees available"}
              </div>
            ) : (
              filteredEmployees.map((emp: any) => (
                <label
                  key={emp._id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(emp._id)}
                    onChange={() => toggleMember(emp._id)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.department || emp.role}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedMembers.length > 0 && (
            <p className="text-xs text-slate-500">{selectedMembers.length} member(s) selected</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/50">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Create Team
        </Button>
      </div>
    </Modal>
  );
}
