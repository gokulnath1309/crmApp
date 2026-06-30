import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function DangerZoneSection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const company = useQuery(api.workspaces.getMyWorkspace);
  const removeWorkspace = useMutation(api.workspaces.remove);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!company?._id) return;
    setDeleting(true);
    try {
      await removeWorkspace({ id: company._id as any });
      toast("success", "Workspace deleted successfully");
      await signOut();
      navigate("/signin");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete workspace");
      setDeleting(false);
    }
  };

  const workspaceName = company?.name || "this workspace";
  const canDelete = confirmText === workspaceName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Danger Zone</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Irreversible actions that affect your entire workspace
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Workspace</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Permanently delete <strong className="text-slate-700 dark:text-slate-300">{workspaceName}</strong> and all associated data. This action cannot be undone. All users will be removed and redirected.
              </p>

              <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Warning</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 leading-relaxed">
                    This will delete all deals, leads, contacts, tasks, and team data associated with this workspace. Make sure you have a backup of any important information before proceeding.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Type <span className="font-semibold text-slate-700 dark:text-slate-300">{workspaceName}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={workspaceName}
                  className="block w-full max-w-sm h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <button
                type="button"
                disabled={!canDelete || deleting}
                onClick={handleDelete}
                className={cn(
                  "mt-4 flex items-center justify-center gap-2 rounded-xl h-10 px-5 text-sm font-semibold text-white transition-all",
                  "bg-red-600 hover:bg-red-700 cursor-pointer",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                  "dark:focus-visible:ring-offset-slate-900"
                )}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Trash2 className="h-4 w-4" /> Delete Workspace</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
