import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Building, User, Briefcase, Mail, Phone, Globe, MapPin, 
  Tag, Info, Copy, Check, MessageSquare, ExternalLink, Pencil
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ContactInformationCardProps {
  lead: any;
}

export function ContactInformationCard({ lead }: ContactInformationCardProps) {
  const { toast } = useToast();
  const patchLeadMutation = useMutation(api.leads.patchLead);
  const currentUser = useQuery(api.users.getCurrentUser);

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Permission Logic
  const isAdminOrManager = currentUser?.role === "super_admin" || currentUser?.role === "admin" || currentUser?.role === "manager";
  const isAssignedToMe = lead.assignedTo === currentUser?._id;
  const isCreatedByMe = lead.createdBy === currentUser?._id;
  const canModify = isAdminOrManager || isAssignedToMe || isCreatedByMe;

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast("success", `Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startEditing = (field: string, currentVal: string) => {
    if (!canModify) return;
    setEditingField(field);
    setEditValue(currentVal || "");
  };

  const handleSave = async (field: string) => {
    if (!editingField) return;
    setEditingField(null);

    let val: any = editValue.trim();

    // Map fields back to DB schema
    let patchObj: Record<string, any> = {};
    if (field === "contactName") {
      const parts = val.split(" ");
      patchObj.firstName = parts[0] || "Unknown";
      patchObj.lastName = parts.slice(1).join(" ") || "Contact";
    } else if (field === "address") {
      patchObj.address = val;
    } else {
      patchObj[field] = val;
    }

    try {
      await patchLeadMutation({
        id: lead._id,
        patch: patchObj,
      });
      toast("success", `Field updated successfully`);
    } catch (err: any) {
      toast("error", err.message || "Failed to update field");
    }
  };

  const renderEditableRow = (
    label: string,
    field: string,
    value: string,
    icon: React.ReactNode,
    options?: { isLink?: boolean; linkHref?: string; isCopyable?: boolean }
  ) => {
    const isEditing = editingField === field;

    return (
      <div className="flex items-center justify-between group py-2.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0 text-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="text-slate-400 dark:text-slate-550 flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1 pr-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
              {label}
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(field);
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  autoFocus
                  className="w-full h-8 px-2 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleSave(field)}
                  className="h-8 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="h-8 px-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div 
                onDoubleClick={() => startEditing(field, value)}
                className="flex items-center gap-1.5 cursor-pointer min-w-0"
              >
                {options?.isLink && value ? (
                  <a
                    href={options.linkHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-indigo-650 dark:text-indigo-400 hover:underline truncate flex items-center gap-0.5"
                  >
                    {value}
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {value || <span className="text-slate-400 dark:text-slate-600 italic font-normal">Add value</span>}
                  </span>
                )}
                {canModify && (
                  <Pencil 
                    onClick={() => startEditing(field, value)}
                    className="w-3 h-3 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 ml-1 flex-shrink-0" 
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Copy button */}
        {options?.isCopyable && value && !isEditing && (
          <button
            onClick={() => handleCopy(value, label)}
            className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-805 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
          >
            {copiedField === label ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    );
  };

  const cleanPhone = lead.phone?.replace(/[^0-9+]/g, "") || "";
  const cleanWhatsApp = lead.whatsApp?.replace(/[^0-9+]/g, "") || cleanPhone;
  const encodedAddress = encodeURIComponent(`${lead.address || ""} ${lead.city || ""} ${lead.country || ""}`.trim());

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/40">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-505" /> Contact Details
        </h3>
        {canModify && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">
            Double Click to Edit
          </span>
        )}
      </div>

      <div className="space-y-1">
        {renderEditableRow("Company", "company", lead.company, <Building className="w-4 h-4" />, { isCopyable: true })}
        {renderEditableRow("Contact Name", "contactName", `${lead.firstName} ${lead.lastName}`, <User className="w-4 h-4" />, { isCopyable: true })}
        {renderEditableRow("Job Designation", "jobTitle", lead.jobTitle, <Briefcase className="w-4 h-4" />)}
        {renderEditableRow("Email ID", "email", lead.email, <Mail className="w-4 h-4" />, { isLink: true, linkHref: `mailto:${lead.email}`, isCopyable: true })}
        {renderEditableRow("Phone number", "phone", lead.phone, <Phone className="w-4 h-4" />, { isLink: true, linkHref: `tel:${lead.phone}`, isCopyable: true })}
        {renderEditableRow("WhatsApp", "whatsApp", lead.whatsApp || lead.phone, <MessageSquare className="w-4 h-4 text-emerald-500" />, { isLink: true, linkHref: cleanWhatsApp ? `https://wa.me/${cleanWhatsApp}` : undefined })}
        {renderEditableRow("Website URL", "website", lead.website, <Globe className="w-4 h-4" />, { isLink: true, linkHref: lead.website ? (lead.website.startsWith("http") ? lead.website : `https://${lead.website}`) : undefined })}
        {renderEditableRow("City", "city", lead.city, <MapPin className="w-4 h-4" />)}
        {renderEditableRow("Country", "country", lead.country, <Globe className="w-4 h-4" />)}
        {renderEditableRow("Street Address", "address", lead.address, <MapPin className="w-4 h-4" />, { isLink: true, linkHref: encodedAddress ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}` : undefined })}
        {renderEditableRow("Industry", "industry", lead.industry, <Tag className="w-4 h-4" />)}
        {renderEditableRow("Lead Source", "source", lead.source, <Info className="w-4 h-4" />)}
        
        {/* Render LinkedIn link if present in customFields */}
        {lead.customFields?.linkedinUrl && renderEditableRow("LinkedIn URL", "customFields.linkedinUrl", lead.customFields.linkedinUrl, <Globe className="w-4 h-4 text-blue-500" />, { isLink: true, linkHref: lead.customFields.linkedinUrl })}
      </div>
    </div>
  );
}
