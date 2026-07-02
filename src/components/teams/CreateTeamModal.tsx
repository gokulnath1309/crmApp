import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

const TEAM_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

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
      setTeamLeadId("");
      setSelectedMembers([]);
      setMemberSearch("");
      setErrors({});
    }
  }, [open]);

  const employeeOptions: SelectOption[] = (allEmployees ?? [])
    .filter((e: any) => e.isActive)
    .map((e: any) => ({
      value: e._id,
      label: e.name,
      searchString: `${e.name} ${e.email} ${e.department}`,
    }));

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
        icon: "Users",
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
    <Modal open={open} onClose={onClose} hideClose className="!p-0 max-w-[760px] w-[calc(100%-2rem)] sm:max-w-[680px] md:max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden rounded-[24px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-border bg-card sticky top-0 z-10">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Create Team</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create a team to organize employees and assign ownership.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150 active:scale-95 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
        {/* Team Name */}
        <div>
          <Input
            label="Team Name *"
            placeholder="e.g. Sales Squad"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
            error={errors.name}
            className="h-12 rounded-xl px-4"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team do?"
            className="flex w-full h-[100px] rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        {/* Department + Team Lead */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Department"
            placeholder="e.g. Sales, Marketing"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-12 rounded-xl px-4"
          />
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Team Lead</label>
            <Select
              options={employeeOptions}
              value={teamLeadId}
              onChange={setTeamLeadId}
              placeholder="Select team lead"
              triggerClassName="h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Color</label>
          <div className="flex gap-3 flex-wrap">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-10 h-10 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center",
                  color === c
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110"
                    : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Add Members</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search employees by name, email, or department..."
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border scrollbar-thin">
            {filteredEmployees.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                {memberSearch ? "No employees found" : "No employees available"}
              </div>
            ) : (
              filteredEmployees.map((emp: any) => {
                const isSelected = selectedMembers.includes(emp._id);
                return (
                  <div
                    key={emp._id}
                    onClick={() => toggleMember(emp._id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "hover:bg-accent border-l-2 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30 bg-transparent"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                      {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.department || emp.role}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedMembers.length > 0 && (
            <p className="text-xs text-muted-foreground">{selectedMembers.length} member(s) selected</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-card sticky bottom-0">
        <Button variant="ghost" onClick={onClose} className="h-12 rounded-xl px-5">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="h-12 rounded-xl px-5 gap-3">
          Create Team
        </Button>
      </div>
    </Modal>
  );
}