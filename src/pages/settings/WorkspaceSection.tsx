import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Building, Pencil, Check, X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function WorkspaceSection() {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const company = useQuery(api.workspaces.getMyWorkspace);
  const updateWorkspace = useMutation(api.workspaces.updateWorkspace);

  const isSuperAdmin = user?.role === "super_admin";
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const startEdit = () => {
    if (company) {
      setName(company.name);
      setEditing(true);
    }
  };

  const saveName = async () => {
    if (!name.trim()) {
      toast("error", "Workspace name is required");
      return;
    }
    try {
      await updateWorkspace({ name: name.trim() });
      toast("success", "Workspace name updated");
      setEditing(false);
    } catch (err: any) {
      toast("error", err.message || "Failed to update workspace name");
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setName("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Workspace</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your organization settings</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Workspace Name</p>
              {editing ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 max-w-xs">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter workspace name"
                      className="h-9 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveName}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {company?.name || "Loading..."}
                </p>
              )}
            </div>
            {!editing && isSuperAdmin && (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-700/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Team Members</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage roles and permissions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-700/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Teams</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Organize employees into teams</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/teams")}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
