import { useState } from "react";
import { cn } from "@/lib/cn";
import { Mail, BellRing, BarChart3 } from "lucide-react";

function Toggle({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-offset-slate-900",
        on ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          on ? "translate-x-[22px]" : "translate-x-1"
        )}
      />
    </button>
  );
}

function SettingRow({ icon: Icon, label, description, control }: {
  icon?: typeof Mail;
  label: string;
  description?: string;
  control?: React.ReactNode;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-3",
      "border-b border-slate-50 dark:border-slate-700/20 last:border-b-0"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

export function NotificationsSection() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage how you receive alerts</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-5">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/20">
            <SettingRow
              icon={Mail}
              label="Email Notifications"
              description="Receive deal and lead status updates"
              control={<Toggle on={emailNotif} onChange={setEmailNotif} />}
            />
            <SettingRow
              icon={BellRing}
              label="Push Notifications"
              description="Browser real-time alerts"
              control={<Toggle on={pushNotif} onChange={setPushNotif} />}
            />
            <SettingRow
              icon={BarChart3}
              label="Weekly Reports"
              description="Pipeline summaries delivered every Monday"
              control={<Toggle on={weeklyReport} onChange={setWeeklyReport} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
