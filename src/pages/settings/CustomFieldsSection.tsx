import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import {
  Database, Search, Plus, Trash2, Loader2, ShieldAlert,
  Pencil, Copy, Check, Asterisk, ArrowUpDown,
} from "lucide-react";

function SortHeader({ label, active, direction, onClick }: {
  label: string;
  active: boolean;
  direction: "asc" | "desc" | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset rounded",
        active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
      )}
    >
      {label}
      <ArrowUpDown className={cn(
        "h-3 w-3 transition-transform",
        direction === "asc" && "rotate-180 text-indigo-600 dark:text-indigo-400",
        direction === "desc" && "text-indigo-600 dark:text-indigo-400",
        !active && "opacity-40"
      )} />
    </button>
  );
}

export function CustomFieldsSection() {
  const { user } = useUser();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const customFields = useQuery(api.customFields.list);
  const createCustomField = useMutation(api.customFields.create);
  const removeCustomField = useMutation(api.customFields.remove);

  const [label, setLabel] = useState("");
  const [type, setType] = useState("Text");
  const [optionsStr, setOptionsStr] = useState("");
  const [stage, setStage] = useState("All");
  const [required, setRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"label" | "type" | "required" | "stage" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

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
      await createCustomField({ label: label.trim(), type, options, required, stage });
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
    if (!confirm("Are you sure you want to delete this custom field?")) return;
    try {
      await removeCustomField({ id });
      toast("success", "Custom field removed");
    } catch (err: any) {
      toast("error", err.message || "Failed to delete custom field");
    }
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      if (sortDir === "asc") { setSortDir("desc"); }
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
      else { setSortDir("asc"); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredAndSortedFields = useMemo(() => {
    if (!customFields) return [];
    let result = [...customFields];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((f) => f.label.toLowerCase().includes(q));
    }
    if (sortKey) {
      result.sort((a, b) => {
        let cmp = 0;
        if (sortKey === "required") {
          cmp = (a.required === b.required) ? 0 : a.required ? -1 : 1;
        } else {
          const av = String(a[sortKey] ?? "").toLowerCase();
          const bv = String(b[sortKey] ?? "").toLowerCase();
          cmp = av < bv ? -1 : av > bv ? 1 : 0;
        }
        return sortDir === "desc" ? -cmp : cmp;
      });
    }
    return result;
  }, [customFields, searchTerm, sortKey, sortDir]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">CRM Fields</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Define dynamic questions to prompt sales reps during workflow transitions
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-5">
          {!isAdmin ? (
            <div className="flex gap-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 p-5 text-xs text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Admin Privileges Required</p>
                <p className="mt-1 leading-relaxed">
                  Only workspace administrators can configure custom fields for lead stage transitions. Please request help from your workspace manager.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
              <form onSubmit={handleAddField} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Create New Field</h3>

                <div>
                  <label htmlFor="field-label" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Field Label
                  </label>
                  <input
                    id="field-label"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Property Address"
                    className="block w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-type" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                      Field Type
                    </label>
                    <select
                      id="field-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="block w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Text">Short Text</option>
                      <option value="Textarea">Long Textarea</option>
                      <option value="Number">Number</option>
                      <option value="Currency">Currency</option>
                      <option value="Date">Datepicker</option>
                      <option value="Checkbox">Checkbox</option>
                      <option value="Dropdown">Dropdown Select</option>
                      <option value="Multi-select">Multi-select</option>
                      <option value="File Upload">File Upload</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="field-stage" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                      Transition Stage
                    </label>
                    <select
                      id="field-stage"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="block w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                    <label htmlFor="field-options" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                      Options (comma-separated)
                    </label>
                    <textarea
                      id="field-options"
                      value={optionsStr}
                      onChange={(e) => setOptionsStr(e.target.value)}
                      placeholder="e.g. Apartment, House, Commercial"
                      rows={2}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mark as Required Field
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl h-10 text-sm font-semibold text-white transition-all",
                    "bg-indigo-600 hover:bg-indigo-700 cursor-pointer",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                    "dark:focus-visible:ring-offset-slate-900"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Plus className="h-4 w-4" /> Add Field</>
                  )}
                </button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Workspace Fields
                    {customFields && (
                      <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                        ({customFields.length})
                      </span>
                    )}
                  </h3>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search fields..."
                    className="block w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {customFields === undefined ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300 dark:text-slate-600" />
                  </div>
                ) : filteredAndSortedFields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Database className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {searchTerm ? "No fields match your search" : "No custom fields created yet"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {searchTerm ? "Try a different search term" : "Use the form to add your first field"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50">
                          <th className="px-4 py-3 text-left">
                            <SortHeader
                              label="Field Name"
                              active={sortKey === "label"}
                              direction={sortKey === "label" ? sortDir : null}
                              onClick={() => handleSort("label")}
                            />
                          </th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">
                            <SortHeader
                              label="Type"
                              active={sortKey === "type"}
                              direction={sortKey === "type" ? sortDir : null}
                              onClick={() => handleSort("type")}
                            />
                          </th>
                          <th className="px-4 py-3 text-center hidden sm:table-cell">
                            <SortHeader
                              label="Required"
                              active={sortKey === "required"}
                              direction={sortKey === "required" ? sortDir : null}
                              onClick={() => handleSort("required")}
                            />
                          </th>
                          <th className="px-4 py-3 text-left hidden md:table-cell">
                            <SortHeader
                              label="Stage"
                              active={sortKey === "stage"}
                              direction={sortKey === "stage" ? sortDir : null}
                              onClick={() => handleSort("stage")}
                            />
                          </th>
                          <th className="px-4 py-3 text-right">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Actions
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filteredAndSortedFields.map((field: any) => (
                          <tr key={field._id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  {field.label}
                                </span>
                                {field.required && (
                                  <Asterisk className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" aria-label="Required" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 hidden sm:table-cell">
                              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                {field.type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                              {field.required ? (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-50 dark:bg-rose-950/30">
                                  <Check className="h-3 w-3 text-rose-500" />
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                {field.stage === "All" ? "All Stages" : field.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => toast("success", "Edit functionality coming soon")}
                                  className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                  aria-label={`Edit ${field.label}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toast("success", "Duplicate functionality coming soon")}
                                  className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                  aria-label={`Duplicate ${field.label}`}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(field._id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                  aria-label={`Delete ${field.label}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
