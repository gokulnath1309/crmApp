import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { ArrowUpRight } from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UpgradeDialog({
  open,
  onClose,
  title = "Upgrade Required",
  message = "You've reached the limit for the Free plan. Upgrade to a higher plan to unlock more workspaces and features.",
}: UpgradeDialogProps) {
  const navigate = useNavigate();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              onClose();
              navigate("/pricing");
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>
      </div>
    </Modal>
  );
}