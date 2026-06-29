import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Briefcase, Star, X, Plus, Pencil 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/currency";

interface OpportunityCardProps {
  lead: any;
}

export function OpportunityCard({ lead }: OpportunityCardProps) {
  const { toast } = useToast();
  const patchLeadMutation = useMutation(api.leads.patchLead);
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [newTag, setNewTag] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  // Permission check
  const isAdminOrManager = currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "manager";
  const isAssignedToMe = lead.assignedTo === currentUser?._id;
  const isCreatedByMe = lead.createdBy === currentUser?._id;
  const canModify = isAdminOrManager || isAssignedToMe || isCreatedByMe;

  const startEditing = (field: string, currentVal: any) => {
    if (!canModify) return;
    setEditingField(field);
    setEditValue(String(currentVal || ""));
  };

  const handleSave = async (field: string) => {
    if (!editingField) return;
    setEditingField(null);

    let patchObj: Record<string, any> = {};
    const val = editValue.trim();

    if (field === "value") {
      patchObj.value = val ? Number(val) : undefined;
    } else if (field === "priority") {
      patchObj.priority = val;
    } else if (field === "interestLevel") {
      patchObj.customFields = {
        ...(lead.customFields || {}),
        interestLevel: val,
      };
    } else if (field === "probabilityOfSuccess") {
      patchObj.customFields = {
        ...(lead.customFields || {}),
        probabilityOfSuccess: val ? Number(val) : undefined,
      };
    } else if (field === "expectedClosingDate") {
      patchObj.customFields = {
        ...(lead.customFields || {}),
        expectedClosingDate: val || undefined,
      };
    }

    try {
      await patchLeadMutation({
        id: lead._id,
        patch: patchObj,
      });
      toast("success", `Opportunity details updated`);
    } catch (err: any) {
      toast("error", err.message || "Failed to update field");
    }
  };

  const handleInterestLevelClick = async (stars: number) => {
    if (!canModify) return;
    try {
      await patchLeadMutation({
        id: lead._id,
        patch: {
          customFields: {
            ...(lead.customFields || {}),
            interestLevel: String(stars),
          }
        }
      });
      toast("success", "Interest level updated");
    } catch (err: any) {
      toast("error", "Failed to update rating");
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    const currentTags = lead.customFields?.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast("error", "Tag already exists");
      return;
    }

    const updatedTags = [...currentTags, newTag.trim()];
    setNewTag("");
    setShowAddTag(false);

    try {
      await patchLeadMutation({
        id: lead._id,
        patch: {
          customFields: {
            ...(lead.customFields || {}),
            tags: updatedTags,
          }
        }
      });
      toast("success", "Tag added");
    } catch (err: any) {
      toast("error", "Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!canModify) return;
    const currentTags = lead.customFields?.tags || [];
    const updatedTags = currentTags.filter((t: string) => t !== tagToRemove);

    try {
      await patchLeadMutation({
        id: lead._id,
        patch: {
          customFields: {
            ...(lead.customFields || {}),
            tags: updatedTags,
          }
        }
      });
      toast("success", "Tag removed");
    } catch (err: any) {
      toast("error", "Failed to remove tag");
    }
  };

  // Forecast Category calculator
  const getForecastCategory = () => {
    const status = lead.status;
    if (status === "Won") return { label: "Commit (Won)", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" };
    if (status === "Negotiation") return { label: "Commit", color: "text-amber-600 bg-amber-50 dark:bg-amber-955/20" };
    if (status === "Proposal Sent") return { label: "Best Case", color: "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20" };
    if (status === "Lost" || status === "Unqualified") return { label: "Omitted", color: "text-slate-450 bg-slate-100 dark:bg-slate-800" };
    return { label: "Pipeline", color: "text-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-350" };
  };

  const forecast = getForecastCategory();
  const probVal = lead.customFields?.probabilityOfSuccess !== undefined 
    ? Number(lead.customFields.probabilityOfSuccess) 
    : 10;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/40">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-505" /> Opportunity Details
        </h3>
        {canModify && (
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider hidden sm:inline">
            Double Click to Edit
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Deal Value Inline */}
        <div className="flex justify-between items-center group py-1.5">
          <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">Est. Deal Value</span>
          {editingField === "value" ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave("value");
                  if (e.key === "Escape") setEditingField(null);
                }}
                className="w-32 h-8 px-2 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                autoFocus
              />
              <button onClick={() => handleSave("value")} className="h-8 w-8 bg-indigo-650 text-white rounded-lg text-xs font-bold cursor-pointer">✓</button>
            </div>
          ) : (
            <div 
              onDoubleClick={() => startEditing("value", lead.value || "")}
              className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {lead.value !== undefined ? formatCurrency(lead.value, lead.currency || "INR") : "—"}
              {canModify && <Pencil className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          )}
        </div>

        {/* Probability and Slider Progress */}
        <div className="py-1 border-b border-slate-50 dark:border-slate-800/40">
          <div className="flex justify-between items-center group py-1">
            <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">Probability of Success</span>
            {editingField === "probabilityOfSuccess" ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave("probabilityOfSuccess");
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  className="w-20 h-8 px-2 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  autoFocus
                />
                <button onClick={() => handleSave("probabilityOfSuccess")} className="h-8 w-8 bg-indigo-650 text-white rounded-lg text-xs font-bold cursor-pointer">✓</button>
              </div>
            ) : (
              <div 
                onDoubleClick={() => startEditing("probabilityOfSuccess", probVal)}
                className="flex items-center gap-1.5 font-extrabold text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {probVal}%
                {canModify && <Pencil className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            )}
          </div>
          {/* Progress Visualizer */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                probVal >= 70 ? "bg-emerald-500" : probVal >= 40 ? "bg-indigo-600" : "bg-amber-500"
              }`}
              style={{ width: `${probVal}%` }}
            />
          </div>
        </div>

        {/* Priority Dropdown Inline */}
        <div className="flex justify-between items-center group py-1.5 border-b border-slate-50 dark:border-slate-800/40">
          <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">Priority</span>
          {editingField === "priority" ? (
            <div className="flex items-center gap-1">
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSave("priority")}
                className="h-8 px-2 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                autoFocus
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          ) : (
            <div 
              onDoubleClick={() => startEditing("priority", lead.priority || "Medium")}
              className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {lead.priority || "Medium"}
              {canModify && <Pencil className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          )}
        </div>

        {/* Expected Close Date Inline */}
        <div className="flex justify-between items-center group py-1.5 border-b border-slate-50 dark:border-slate-800/40">
          <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">Expected Close</span>
          {editingField === "expectedClosingDate" ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave("expectedClosingDate");
                  if (e.key === "Escape") setEditingField(null);
                }}
                className="h-8 px-2 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                autoFocus
              />
              <button onClick={() => handleSave("expectedClosingDate")} className="h-8 w-8 bg-indigo-650 text-white rounded-lg text-xs font-bold cursor-pointer">✓</button>
            </div>
          ) : (
            <div 
              onDoubleClick={() => startEditing("expectedClosingDate", lead.customFields?.expectedClosingDate || "")}
              className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {lead.customFields?.expectedClosingDate 
                ? new Date(lead.customFields.expectedClosingDate).toLocaleDateString()
                : "Choose Date"}
              {canModify && <Pencil className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          )}
        </div>

        {/* Forecast Category Indicator */}
        <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
          <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">Forecast Category</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${forecast.color}`}>
            {forecast.label}
          </span>
        </div>

        {/* Interactive Interest Stars Rating */}
        <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800/40">
          <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">Interest Level</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((stars) => {
              const currentRating = Number(lead.customFields?.interestLevel || 0);
              const isActive = stars <= currentRating;
              return (
                <button
                  key={stars}
                  type="button"
                  disabled={!canModify}
                  onClick={() => handleInterestLevelClick(stars)}
                  className="p-0.5 hover:scale-125 transition-transform disabled:opacity-85 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Star 
                    className={`w-4 h-4 ${
                      isActive 
                        ? "text-amber-500 fill-amber-500" 
                        : "text-slate-300 dark:text-slate-600"
                    }`} 
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags Section */}
        <div className="py-1">
          <span className="text-xs text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block mb-2">Lead Tags</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {lead.customFields?.tags?.map((t: string) => (
              <span 
                key={t} 
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-md border border-indigo-100/30"
              >
                {t}
                {canModify && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="p-0.5 hover:bg-indigo-100 rounded-full text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))}

            {canModify && (
              <div className="relative">
                {showAddTag ? (
                  <form onSubmit={handleAddTag} className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="tag name..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="h-6 w-24 px-2 text-[10px] rounded border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                      autoFocus
                    />
                    <button type="submit" className="h-6 px-1.5 bg-indigo-650 text-white rounded text-[10px] font-bold cursor-pointer">Add</button>
                    <button type="button" onClick={() => setShowAddTag(false)} className="h-6 px-1.5 border border-slate-200 text-slate-500 rounded text-[10px] cursor-pointer">✕</button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddTag(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Tag
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
