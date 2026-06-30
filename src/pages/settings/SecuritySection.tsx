import { useToast } from "@/components/ui/Toast";

function SecurityRow({ label, detail, action }: { label: string; detail: string; action: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/20 last:border-b-0">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail}</p>
      </div>
      <button
        type="button"
        onClick={action.onClick}
        className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
      >
        {action.label}
      </button>
    </div>
  );
}

export function SecuritySection() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Protect your account and data</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-5">
          <SecurityRow
            label="Two-Factor Authentication"
            detail="Add an extra layer of security"
            action={{ label: "Configure", onClick: () => toast("success", "2FA configuration coming soon") }}
          />
          <SecurityRow
            label="Active Sessions"
            detail="2 devices currently active"
            action={{ label: "Manage", onClick: () => toast("success", "Session management coming soon") }}
          />
          <SecurityRow
            label="Password"
            detail="Last changed 3 months ago"
            action={{ label: "Change", onClick: () => toast("success", "Password change coming soon") }}
          />
          <SecurityRow
            label="Trusted Devices"
            detail="3 devices authorized"
            action={{ label: "View", onClick: () => toast("success", "Device management coming soon") }}
          />
        </div>
      </div>
    </div>
  );
}
