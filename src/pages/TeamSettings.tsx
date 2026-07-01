import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/features/auth/UserProvider";
import { getPermissions } from "@/lib/permissions";
import { Check, ArrowLeft, Archive, Trash2 } from "lucide-react";

const TEAM_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

export function TeamSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const permissions = getPermissions(user);

  const team = useQuery(api.teams.getById, { teamId: id as any });
  const employees = useQuery(api.teams.getEmployees, {});
  const updateTeam = useMutation(api.teams.update);
  const archiveTeam = useMutation(api.teams.archive);
  const deleteTeam = useMutation(api.teams.remove);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [color, setColor] = useState("");
  const [teamLeadId, setTeamLeadId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || "");
      setDepartment(team.department || "");
      setColor(team.color || TEAM_COLORS[0]);
      setTeamLeadId(team.teamLeadId || "");
    }
  }, [team]);

  if (team === undefined || employees === undefined) {
    return (
      <div className="px-4 pt-4 pb-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <h2 className="text-lg font-semibold">Team Not Found</h2>
        </Card>
      </div>
    );
  }

  const canManage = permissions.canManageTeams;
  const canArchive = permissions.canArchiveTeam;
  const canDelete = permissions.canDeleteTeam;

  const employeeOptions: SelectOption[] = (employees ?? [])
    .filter((e: any) => e.isActive)
    .map((e: any) => ({
      value: e._id,
      label: e.name,
      searchString: `${e.name} ${e.email}`,
    }));

  const handleSave = async () => {
    if (!name || name.trim().length < 3) {
      toast("error", "Team name must be at least 3 characters");
      return;
    }
    setSaving(true);
    try {
      await updateTeam({
        teamId: id as any,
        name: name.trim(),
        description: description.trim() || undefined,
        department: department || undefined,
        color: color || undefined,
        teamLeadId: (teamLeadId as any) || undefined,
      });
      toast("success", "Team settings updated");
    } catch (err: any) {
      toast("error", err.message || "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    const action = team.archived ? "unarchive" : "archive";
    if (!confirm(`Are you sure you want to ${action} "${team.name}"?`)) return;
    try {
      await archiveTeam({ teamId: id as any, archived: !team.archived });
      toast("success", `Team ${action}d successfully`);
    } catch (err: any) {
      toast("error", err.message || `Failed to ${action} team`);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${team.name}"? This cannot be undone.`)) return;
    if (!confirm(`Really delete "${team.name}"? All team associations will be removed.`)) return;
    try {
      await deleteTeam({ teamId: id as any });
      toast("success", "Team deleted permanently");
      navigate("/teams");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete team");
    }
  };

  return (
    <div className="px-4 pt-4 pb-6 space-y-5 max-w-3xl">
      <div>
        <button
          onClick={() => navigate(`/teams/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {team.name}
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Team Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage team configuration and preferences
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">General</h2>
        <div className="space-y-4">
          <Input
            label="Team Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManage}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#1E293B] dark:text-white">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={!canManage}
              className="flex w-full rounded-xl border border-outline-variant bg-surface-alt px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={!canManage}
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
                  className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${
                    color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  disabled={!canManage}
                >
                  {color === c && <Check className="w-4 h-4 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          {canManage && (
            <div className="pt-2">
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      {(canArchive || canDelete) && (
        <Card className="border-red-200 dark:border-red-900/50">
          <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
          <div className="space-y-3">
            {canArchive && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {team.archived ? "Unarchive Team" : "Archive Team"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {team.archived
                      ? "Restore this team to active status"
                      : "Archive this team to hide it from active views"}
                  </p>
                </div>
                <Button variant={team.archived ? "secondary" : "danger"} size="sm" onClick={handleArchive}>
                  <Archive className="w-4 h-4" />
                  {team.archived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            )}

            {canDelete && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Delete Team</p>
                  <p className="text-xs text-slate-500">Permanently delete this team and all member associations</p>
                </div>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
