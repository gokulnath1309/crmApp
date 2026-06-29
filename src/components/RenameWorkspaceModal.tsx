import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";

interface RenameWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  currentName: string;
}

export function RenameWorkspaceModal({ open, onClose, currentName }: RenameWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const updateWorkspace = useMutation(api.workspaces.updateWorkspace);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError("");
    }
  }, [open, currentName]);

  function validate(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "Workspace name is required";
    if (trimmed.length < 3) return "Workspace name must be at least 3 characters";
    if (trimmed.length > 100) return "Workspace name must be under 100 characters";
    return "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    if (error) {
      const err = validate(v);
      if (err) setError(err);
      else setError("");
    }
  }

  function handleBlur() {
    setError(validate(name));
  }

  async function handleSave() {
    const err = validate(name);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    try {
      await updateWorkspace({ name: name.trim() });
      toast("success", "Workspace renamed successfully.");
      onClose();
    } catch (e: any) {
      toast("error", e?.message || "Unable to rename workspace.\nPlease try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !saving) {
      handleSave();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Rename Workspace">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter workspace name"
            maxLength={100}
            disabled={saving}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all disabled:opacity-60"
          />
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
