import { useState } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";

function Toggle({ on: controlledOn, onChange }: { on?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(controlledOn ?? false);
  const active = controlledOn !== undefined ? controlledOn : on;
  return (
    <button
      onClick={() => { const next = !active; setOn(next); onChange?.(next); }}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${active ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${active ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function SettingsPage() {
  const [dark, toggleDark] = useDarkMode();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  return (
    <div className="space-y-5 max-w-2xl pb-6 p-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Settings</h1>
      {[
        {
          title: "Appearance",
          rows: [{ label: "Dark Mode", desc: "Switch between light and dark interface", ctrl: <Toggle on={dark} onChange={toggleDark} /> }],
        },
        {
          title: "Notifications",
          rows: [
            { label: "Email Notifications", desc: "Receive deal and lead updates via email", ctrl: <Toggle on={emailNotif} onChange={setEmailNotif} /> },
            { label: "Push Notifications", desc: "Browser push notifications for real-time alerts", ctrl: <Toggle on={pushNotif} onChange={setPushNotif} /> },
            { label: "Weekly Reports", desc: "Pipeline summary delivered every Monday", ctrl: <Toggle on={weeklyReport} onChange={setWeeklyReport} /> },
          ],
        },
        {
          title: "Security",
          rows: [
            { label: "Two-Factor Authentication", desc: "Add an extra layer of security to your account", ctrl: <button className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Enable →</button> },
            { label: "Active Sessions", desc: "2 sessions active across devices", ctrl: <button className="text-sm text-red-500 font-semibold hover:underline">Revoke all</button> },
          ],
        },
      ].map(section => (
        <div key={section.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{section.title}</h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
            {section.rows.map(row => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{row.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.desc}</p>
                </div>
                {row.ctrl}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
