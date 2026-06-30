import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Check, Bell, Mail, Shield, CheckSquare, Target, DollarSign, Smartphone } from "lucide-react";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export function NotificationSettingsModal({ isOpen, onClose, currentUser }: NotificationSettingsModalProps) {
  const updateSettings = useMutation(api.notifications.updateSettings);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    taskNotifications: true,
    leadNotifications: true,
    dealNotifications: true,
    mentionNotifications: true,
    securityNotifications: true,
    billingNotifications: true,
    desktopNotifications: true,
    emailNotifications: true,
    pushNotifications: false,
    weeklySummary: true,
    dailyDigest: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.notificationSettings) {
      setSettings({
        ...settings,
        ...currentUser.notificationSettings,
      });
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ settings });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" /> Notification Settings
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Customize your notification and subscription preferences.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Channels */}
          <div>
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Delivery Channels</h4>
            <div className="space-y-3">
              {[
                { key: "desktopNotifications", label: "Desktop Notifications", desc: "Show system banners on your screen", icon: Bell },
                { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates via your email address", icon: Mail },
                { key: "pushNotifications", label: "Mobile Push Notifications", desc: "Push alerts to registered mobile apps", icon: Smartphone },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100/60 dark:border-slate-700/30 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{item.label}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(item.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings[item.key] ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${settings[item.key] ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Topic Categories</h4>
            <div className="space-y-3">
              {[
                { key: "taskNotifications", label: "Tasks & Assignments", desc: "When tasks are assigned, completed, or overdue", icon: CheckSquare },
                { key: "leadNotifications", label: "Lead Lifecycle updates", desc: "When new leads are assigned, status updates, or conversions", icon: Target },
                { key: "dealNotifications", label: "Deals & Pipelines", desc: "When deals change stages, are won, or closed lost", icon: DollarSign },
                { key: "securityNotifications", label: "Security & Audits", desc: "Role modifications, logins, or password resets", icon: Shield },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100/60 dark:border-slate-700/30 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{item.label}</p>
                        <p className="text-[10px] text-slate-405 dark:text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(item.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings[item.key] ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${settings[item.key] ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digests */}
          <div>
            <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Email Digest Frequency</h4>
            <div className="space-y-3">
              {[
                { key: "weeklySummary", label: "Weekly Summary", desc: "Full breakdown of team performance and pipeline metrics every Monday" },
                { key: "dailyDigest", label: "Daily Summary", desc: "A brief summary of tasks and calendar events every morning" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100/60 dark:border-slate-700/30 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-slate-750 dark:text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-405 dark:text-slate-500 font-medium">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(item.key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings[item.key] ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${settings[item.key] ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
          >
            {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
