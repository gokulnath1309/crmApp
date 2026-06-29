import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { useNavigate } from "react-router-dom";
import { Search, X, UserPlus, Users, ArrowLeft } from "lucide-react";

interface AddMembersModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  teamName?: string;
}

export function AddMembersModal({ open, onClose, teamId, teamName }: AddMembersModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const availableEmployees = useQuery(api.teams.getAvailableEmployees, {});
  const addMembers = useMutation(api.teams.addMembers);

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch("");
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = (availableEmployees ?? []).filter((e: any) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      e.name.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.department?.toLowerCase().includes(term) ||
      e.role.toLowerCase().includes(term)
    );
  });

  const selectedData = (availableEmployees ?? []).filter((e: any) =>
    selected.includes(e._id)
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const removeChip = (id: string) => {
    setSelected((prev) => prev.filter((m) => m !== id));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast("error", "Please select at least one employee");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addMembers({
        teamId: teamId as any,
        employeeIds: selected as any,
      });
      toast(
        "success",
        `${result.added} ${result.added === 1 ? "employee" : "employees"} added successfully.`
      );
      onClose();
    } catch (err: any) {
      const msg = err.message ?? "Failed to add members";
      toast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const noData = availableEmployees !== undefined && availableEmployees.length === 0;

  return (
    <Modal open={open} onClose={onClose} title={`Add Members${teamName ? ` to ${teamName}` : ""}`} className="max-w-lg">
      {/* Empty state: all employees already assigned */}
      {noData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No Available Employees
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            All active employees are already assigned to a team. Invite a new employee or remove someone from an existing team before adding members.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/employees")}>
              <UserPlus className="w-4 h-4" />
              Go to Employees
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department, or role..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-outline-variant bg-surface-alt text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedData.map((emp: any) => (
                <span
                  key={emp._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  <span className="max-w-[100px] truncate">{emp.name}</span>
                  <button
                    onClick={() => removeChip(emp._id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Employee list */}
          <div className="max-h-72 overflow-y-auto border border-outline-variant rounded-xl divide-y divide-outline-variant/50">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {search ? "No employees match your search" : "No employees available"}
                </p>
              </div>
            ) : (
              filtered.map((emp: any) => {
                const isSelected = selected.includes(emp._id);
                return (
                  <label
                    key={emp._id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(emp._id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                    />
                    <Avatar name={emp.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {emp.name}
                        </p>
                        <Badge variant="default" size="sm">
                          {emp.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {emp.department && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {emp.department}
                          </span>
                        )}
                        {emp.department && emp.email && (
                          <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {emp.email}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <p className="text-xs text-slate-500">
            {selected.length > 0
              ? `${selected.length} ${selected.length === 1 ? "employee" : "employees"} selected`
              : "Select employees to add to this team"}
          </p>
        </div>
      )}

      {!noData && (
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/50">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={selected.length === 0}
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? "Adding..." : `Add ${selected.length > 0 ? `(${selected.length})` : "Members"}`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
