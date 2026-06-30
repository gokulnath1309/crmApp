import { UpgradeModal } from "@/components/UpgradeModal";

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UpgradeDialog({
  open,
  onClose,
}: UpgradeDialogProps) {
  return <UpgradeModal open={open} onClose={onClose} />;
}