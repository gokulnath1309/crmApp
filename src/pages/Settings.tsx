import { useState } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { useToast } from "@/components/ui/Toast";
import { Trash2, Plus, Loader2, ShieldAlert, Sparkles, Layers, Asterisk } from "lucide-react";

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

  const { user } = useUser();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const customFields = useQuery(api.customFields.list);
  const createCustomField = useMutation(api.customFields.create);
  const removeCustomField = useMutation(api.customFields.remove);

  // New Custom Field Form State
  const [label, setLabel] = useState("");
  const [type, setType] = useState("Text");
  const [optionsStr, setOptionsStr] = useState("");
  const [stage, setStage] = useState("All");
  const [required, setRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast("error", "Field label is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const options = (type === "Dropdown" || type === "Multi-select") && optionsStr.trim()
        ? optionsStr.split(",").map((o) => o.trim()).filter((o) => o.length > 0)
        : undefined;

      await createCustomField({
        label: label.trim(),
        type,
        options,
        required,
        stage,
      });

      toast("success", "Custom field added successfully");
      setLabel("");
      setOptionsStr("");
      setType("Text");
      setStage("All");
      setRequired(false);
    } catch (err: any) {
      toast("error", err.message || "Failed to create custom field");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteField = async (id: any) => {
    if (!confirm("Are you sure you want to delete this custom field? This will stop it from displaying during future stage transitions.")) {
      return;
    }
    try {
      await removeCustomField({ id });
      toast("success", "Custom field removed");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete custom field");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12 p-6 mx-auto">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Settings
        </h1>
        <p className="text-xs text-slate-450 dark:text-slate-400">
          Configure appearance, notification preferences, and universal CRM attributes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: General Settings */}
        <div className="lg:col-span-1 space-y-6">
          {[
            {
              title: "Appearance",
              rows: [{ label: "Dark Mode", desc: "Switch interface styling", ctrl: <Toggle on={dark} onChange={toggleDark} /> }],
            },
            {
              title: "Notifications",
              rows: [
                { label: "Email Notifications", desc: "Receive deal/lead status updates", ctrl: <Toggle on={emailNotif} onChange={setEmailNotif} /> },
                { label: "Push Notifications", desc: "Browser real-time alerts", ctrl: <Toggle on={pushNotif} onChange={setPushNotif} /> },
                { label: "Weekly Reports", desc: "Pipeline summaries on Mondays", ctrl: <Toggle on={weeklyReport} onChange={setWeeklyReport} /> },
              ],
            },
            {
              title: "Security",
              rows: [
                { label: "2FA Authentication", desc: "Add secondary device login verification", ctrl: <button className="text-xs text-indigo-650 dark:text-indigo-400 font-bold hover:underline">Configure</button> },
                { label: "Sessions", desc: "Active device connections", ctrl: <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">2 active</span> },
              ],
            },
          ].map(section => (
            <div key={section.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/10">
                <h2 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/35">
                {section.rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{row.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{row.desc}</p>
                    </div>
                    {row.ctrl}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Custom CRM Fields Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-900/10 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Custom CRM Fields
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Define dynamic questions to prompt sales reps during workflow transitions.
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="p-6 space-y-6">
              {!isAdmin ? (
                <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-400 text-xs">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Admin Privileges Required</p>
                    <p className="mt-1 leading-relaxed">
                      Only workspace administrators can configure custom fields for lead stage transitions. Please request help from your workspace manager.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Create Field Form */}
                  <form onSubmit={handleAddField} className="space-y-4 bg-slate-50/40 dark:bg-slate-900/10 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/40 flex flex-col justify-between">
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Create Custom Field
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          Field Label *
                        </label>
                        <input
                          type="text"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          placeholder="e.g. Property Address"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            Field Type
                          </label>
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                          >
                            <option value="Text">📝 Short Text</option>
                            <option value="Textarea">📝 Long Textarea</option>
                            <option value="Number">🔢 Number</option>
                            <option value="Currency">💵 Currency</option>
                            <option value="Date">📅 Datepicker</option>
                            <option value="Checkbox">☑ Checkbox</option>
                            <option value="Dropdown">⬇ Dropdown Select</option>
                            <option value="Multi-select">🗂 Multi-select</option>
                            <option value="File Upload">📎 File Upload</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            Transition Stage
                          </label>
                          <select
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                          >
                            <option value="All">All Stages</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal Sent">Proposal Sent</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Won">Won</option>
                          </select>
                        </div>
                      </div>

                      {(type === "Dropdown" || type === "Multi-select") && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                            Options (comma-separated) *
                          </label>
                          <textarea
                            value={optionsStr}
                            onChange={(e) => setOptionsStr(e.target.value)}
                            placeholder="e.g. Apartment, House, Commercial"
                            rows={2}
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={required}
                          onChange={(e) => setRequired(e.target.checked)}
                          className="rounded text-indigo-600 border-slate-350 dark:border-slate-650 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-350">
                          Mark as Required Field
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-3 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Add Field
                        </>
                      )}
                    </button>
                  </form>

                  {/* Active Custom Fields List */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Active Workspace Fields
                    </h3>

                    {customFields === undefined ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                      </div>
                    ) : customFields.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-700/60 rounded-2xl">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          No custom fields created yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                        {customFields.map((field) => (
                          <div
                            key={field._id}
                            className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between shadow-xs hover:border-slate-200 dark:hover:border-slate-700/60 transition-colors"
                          >
                            <div className="min-w-0 pr-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <Asterisk className="w-3.5 h-3.5 text-rose-500" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 rounded-sm">
                                  {field.type}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-sm flex items-center gap-0.5">
                                  <Layers className="w-2.5 h-2.5" /> Stage: {field.stage}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteField(field._id)}
                              className="p-2 text-slate-350 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
