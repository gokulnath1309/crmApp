import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  X, ChevronDown, ChevronUp, FileText, Paperclip, 
  AlertCircle, Sparkles, CheckCircle2, Info,
  Mic, Loader2
} from "lucide-react";
import { motion } from "motion/react";
import { InteractionEvidence, type EvidenceItem } from "./InteractionEvidence";

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}


interface AttachmentPayload {
  fileName: string;
  fileType: string;
  fileUrl: string;
  category: string;
  duration?: number;
  mimeType: string;
  storageId?: string;
  size?: number;
  stage?: string;
}

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  status: string;
  source: string;
  assignedTo?: string;
  value?: number;
  currency?: string;
  score?: number;
  priority?: string;
  customFields?: Record<string, any>;
}

interface LeadTransitionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  targetStage: string;
  onConfirm: (data: {
    transitionData: Record<string, any>;
    activityDetails: Record<string, any>;
    reminderDetails?: { title: string; dueDate: number };
    attachments?: AttachmentPayload[];
  }) => Promise<void>;
}

export function LeadTransitionDrawer({
  isOpen,
  onClose,
  lead,
  targetStage,
  onConfirm,
}: LeadTransitionDrawerProps) {
  const users = useQuery(api.users.list);
  const customFieldsConfig = useQuery(api.customFields.list);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Universal Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [attachments, setAttachments] = useState<EvidenceItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const generateUploadUrl = useMutation(api.leads.generateUploadUrl);
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  const handleFilesSelected = useCallback((files: Array<{ id: string; file: File }>) => {
    for (const { id, file } of files) {
      pendingFilesRef.current.set(id, file);
    }
  }, []);

  useEffect(() => {
    const currentIds = new Set(attachments.map(a => a.id));
    pendingFilesRef.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        pendingFilesRef.current.delete(id);
      }
    });
  }, [attachments]);

  // Accordion Sections
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    interaction: true,
    discussion: true,
    opportunity: false,
    nextsteps: false,
    customfields: true,
    attachments: false,
    preview: true,
  });

  const toggleSection = (sec: string) => {
    setActiveSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Filter custom fields applicable to this target stage
  const activeCustomFields = customFieldsConfig?.filter(
    (f) => f.stage === targetStage || f.stage === "All"
  ) || [];

  // Load Draft from LocalStorage
  useEffect(() => {
    if (isOpen && lead) {
      pendingFilesRef.current.clear();
      const draftKey = `crm_lead_agnostic_draft_${lead._id}_${targetStage}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData || {});
          setCustomFieldValues(parsed.customFieldValues || {});
          setAttachments(parsed.attachments || []);
        } catch (e) {
          initializeEmptyForm();
        }
      } else {
        initializeEmptyForm();
      }
    }
  }, [isOpen, lead, targetStage]);

  // Save Draft to LocalStorage
  useEffect(() => {
    if (isOpen && lead) {
      const draftKey = `crm_lead_agnostic_draft_${lead._id}_${targetStage}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({ formData, customFieldValues, attachments })
      );
    }
  }, [formData, customFieldValues, attachments, isOpen, lead, targetStage]);

  const clearDraft = () => {
    const draftKey = `crm_lead_agnostic_draft_${lead._id}_${targetStage}`;
    localStorage.removeItem(draftKey);
  };

  const initializeEmptyForm = () => {
    setValidationErrors({});
    setAttachments([]);
    setCustomFieldValues({});
    
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5);

    setFormData({
      activityType: "Phone Call",
      date: todayStr,
      time: timeStr,
      duration: "10",
      personContacted: `${lead.firstName} ${lead.lastName}`,
      role: lead.jobTitle || "",
      outcome: "Successful",
      summary: "",
      potentialDealValue: lead.value || "",
      priority: lead.priority || "Medium",
      interestLevel: "3",
      expectedClosingDate: "",
      probabilityOfSuccess: "50",
      customTags: "",
      nextAction: "Call Again",
      followUpDate: "",
      reminder: false,
      assignedUser: lead.assignedTo || "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === "checkbox") {
      val = (e.target as HTMLInputElement).checked;
    }
    setFormData(prev => ({ ...prev, [name]: val }));

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const cpy = { ...prev };
        delete cpy[name];
        return cpy;
      });
    }
  };

  // Custom Fields state handlers
  const handleCustomFieldChange = (fieldName: string, val: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldName]: val }));
    
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const cpy = { ...prev };
        delete cpy[fieldName];
        return cpy;
      });
    }
  };

  const handleCustomMultiSelectToggle = (fieldName: string, option: string) => {
    const current = customFieldValues[fieldName] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    handleCustomFieldChange(fieldName, updated);
  };

  // Base64 file parser for custom fields and general attachments
  const processFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCustomFileUpload = async (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Files must be smaller than 5 MB");
      return;
    }

    try {
      const base64 = await processFileBase64(file);
      handleCustomFieldChange(fieldName, {
        fileName: file.name,
        fileType: file.type,
        fileUrl: base64,
      });
    } catch (err) {
      alert("Failed to read file");
    }
  };

  // Validation Check
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // 1. Universal Fields Validations
    if (!formData.personContacted?.trim()) errors.personContacted = "Contacted person is required";
    if (!formData.summary?.trim()) errors.summary = "Discussion summary / notes is required";
    if (formData.reminder && !formData.followUpDate) errors.followUpDate = "Follow-up date is required for setting a reminder";
    
    if (formData.potentialDealValue && isNaN(Number(formData.potentialDealValue))) {
      errors.potentialDealValue = "Potential deal value must be a valid number";
    }
    if (formData.probabilityOfSuccess && (isNaN(Number(formData.probabilityOfSuccess)) || Number(formData.probabilityOfSuccess) < 0 || Number(formData.probabilityOfSuccess) > 100)) {
      errors.probabilityOfSuccess = "Probability must be a percentage between 0 and 100";
    }

    // 2. Custom Fields Validations
    activeCustomFields.forEach((field) => {
      const val = customFieldValues[field.name];
      if (field.required) {
        const isEmpty = val === undefined || val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === "object" && !Array.isArray(val) && !val.fileName); // File upload check
          
        if (isEmpty) {
          errors[field.name] = `Custom field "${field.label}" is required`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErr = Object.keys(validationErrors)[0];
      if (firstErr) {
        const el = document.getElementsByName(firstErr)[0];
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload any custom field files that are in base64 format (start with "data:")
      const updatedCustomFieldValues = { ...customFieldValues };
      for (const field of activeCustomFields) {
        const val = customFieldValues[field.name];
        if (field.type === "File Upload" && val?.fileUrl?.startsWith("data:")) {
          try {
            const blob = dataURLtoBlob(val.fileUrl);
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": val.fileType || blob.type },
              body: blob,
            });
            if (!result.ok) {
              const errText = await result.text();
              throw new Error(`Failed to upload custom file ${val.fileName}: ${errText}`);
            }
            const { storageId } = await result.json();
            updatedCustomFieldValues[field.name] = {
              fileName: val.fileName,
              fileType: val.fileType,
              fileUrl: "",
              storageId,
            };
          } catch (err: any) {
            throw new Error(`Failed to upload custom file ${val.fileName}: ${err.message}`);
          }
        }
      }

      // Build transitionData incorporating universal opportunity fields & custom field answers
      const transitionData: Record<string, any> = {
        expectedBudget: formData.potentialDealValue ? Number(formData.potentialDealValue) : undefined,
        priority: formData.priority,
        interestLevel: formData.interestLevel,
        expectedClosingDate: formData.expectedClosingDate || undefined,
        probabilityOfSuccess: formData.probabilityOfSuccess ? Number(formData.probabilityOfSuccess) : undefined,
        tags: formData.customTags ? formData.customTags.split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
        customFields: updatedCustomFieldValues, // Dynamic field answers key-value (with uploaded file storageIds)
      };

      // Formulate Activity details
      const summaryText = `${formData.activityType} (${formData.outcome}): ${formData.summary.slice(0, 100)}${formData.summary.length > 100 ? "..." : ""}`;
      
      const activityDetails = {
        activityType: formData.activityType,
        summary: summaryText,
        notes: formData.summary,
        duration: formData.duration || undefined,
        outcome: formData.outcome,
        date: formData.date,
        time: formData.time || undefined,
        nextAction: formData.nextAction,
      };

      // Formulate optional Reminder details
      let reminderDetails;
      if (formData.reminder && formData.followUpDate) {
        const epoch = new Date(`${formData.followUpDate}T09:00:00`).getTime();
        reminderDetails = {
          title: `Follow up: ${formData.nextAction} with ${lead.company}`,
          dueDate: epoch,
        };
      }

      // Upload files from pendingFilesRef to Convex Storage and build metadata-only payload
      const savedAttachments: AttachmentPayload[] = [];
      if (attachments.length > 0) {
        setUploadingFiles(true);
        for (const att of attachments) {
          const pendingFile = pendingFilesRef.current.get(att.id);
          if (pendingFile) {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": pendingFile.type },
              body: pendingFile,
            });
            if (!result.ok) {
              const errText = await result.text();
              throw new Error(`Failed to upload ${att.fileName}: ${errText}`);
            }
            const { storageId } = await result.json();
            savedAttachments.push({
              fileName: att.fileName,
              fileType: att.fileType,
              fileUrl: "",
              category: att.category,
              duration: att.duration,
              mimeType: att.mimeType,
              storageId,
              size: att.fileSize,
            });
            pendingFilesRef.current.delete(att.id);
          } else if (att.fileUrl && att.fileUrl.startsWith("data:")) {
            try {
              const blob = dataURLtoBlob(att.fileUrl);
              const uploadUrl = await generateUploadUrl();
              const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": att.mimeType || blob.type },
                body: blob,
              });
              if (!result.ok) {
                const errText = await result.text();
                throw new Error(`Failed to upload draft attachment ${att.fileName}: ${errText}`);
              }
              const { storageId } = await result.json();
              savedAttachments.push({
                fileName: att.fileName,
                fileType: att.fileType,
                fileUrl: "",
                category: att.category,
                duration: att.duration,
                mimeType: att.mimeType,
                storageId,
                size: att.fileSize,
              });
            } catch (err: any) {
              throw new Error(`Failed to upload draft attachment ${att.fileName}: ${err.message}`);
            }
          } else {
            savedAttachments.push({
              fileName: att.fileName,
              fileType: att.fileType,
              fileUrl: att.fileUrl,
              category: att.category,
              duration: att.duration,
              mimeType: att.mimeType,
              storageId: att.storageId,
              size: att.fileSize,
            });
          }
        }
        setUploadingFiles(false);
      }

      // Collect attachments (including files uploaded via custom file fields)
      const allAttachments = savedAttachments.map((ev) => ({
        fileName: ev.fileName,
        fileType: ev.fileType,
        fileUrl: ev.fileUrl,
        category: ev.category,
        duration: ev.duration,
        mimeType: ev.mimeType,
        storageId: ev.storageId,
        size: ev.size,
        stage: targetStage,
      }));
      activeCustomFields.forEach((field) => {
        const val = updatedCustomFieldValues[field.name];
        if (field.type === "File Upload" && val?.storageId) {
          allAttachments.push({
            fileName: `${field.label}: ${val.fileName}`,
            fileType: val.fileType,
            fileUrl: val.fileUrl || "",
            category: "other",
            duration: undefined,
            mimeType: val.fileType || "application/octet-stream",
            storageId: val.storageId,
            size: undefined,
            stage: targetStage,
          });
        }
      });

      await onConfirm({
        transitionData,
        activityDetails,
        reminderDetails,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
      });

      clearDraft();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to submit transition");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-100 dark:border-slate-700/50 flex flex-col"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-sm">
              Agnostic CRM Stage Transition
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Move Lead to <span className="text-indigo-600 dark:text-indigo-400">{targetStage}</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Complete the universal sections below to advance status.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {Object.keys(validationErrors).length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex gap-3 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Required Fields Missing</p>
                <ul className="list-disc pl-4 mt-1.5 space-y-1">
                  {Object.values(validationErrors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ─── SECTION 1: INTERACTION ─── */}
          <div className="border border-slate-100 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
            <button
              type="button"
              onClick={() => toggleSection("interaction")}
              className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>Section 1: Interaction Details</span>
              {activeSections.interaction ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSections.interaction && (
              <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/35 mt-1 bg-white dark:bg-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Activity Type *</label>
                  <select
                    name="activityType"
                    value={formData.activityType || "Phone Call"}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Phone Call">📞 Phone Call</option>
                    <option value="WhatsApp">💬 WhatsApp</option>
                    <option value="Email">📧 Email</option>
                    <option value="SMS">📱 SMS</option>
                    <option value="Meeting">🤝 Meeting</option>
                    <option value="Video Call">🎥 Video Call</option>
                    <option value="Office Visit">🏢 Office Visit</option>
                    <option value="Site Visit">📍 Site Visit</option>
                    <option value="Demo">💻 Demo</option>
                    <option value="Follow-up">🔁 Follow-up</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Outcome *</label>
                  <select
                    name="outcome"
                    value={formData.outcome || "Successful"}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Successful">Successful</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Busy</option>
                    <option value="Call Back">Call Back</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                    <option value="Information Shared">Information Shared</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Person Contacted *</label>
                  <input
                    type="text"
                    name="personContacted"
                    value={formData.personContacted || ""}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Role / Designation (optional)</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role || ""}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date || ""}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time || ""}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Duration (min)</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration || ""}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── SECTION 2: DISCUSSION SUMMARY ─── */}
          <div className="border border-slate-100 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
            <button
              type="button"
              onClick={() => toggleSection("discussion")}
              className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>Section 2: Discussion Summary</span>
              {activeSections.discussion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSections.discussion && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-700/35 mt-1 bg-white dark:bg-slate-800">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Discussion Summary & Notes (Requirements, concerns, expectations) *
                </label>
                <textarea
                  name="summary"
                  value={formData.summary || ""}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="- Customer requirements: ...&#10;- Customer concerns: ...&#10;- Agreements reached: ..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>
            )}
          </div>

          {/* ─── SECTION 3: BUSINESS OPPORTUNITY ─── */}
          <div className="border border-slate-100 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
            <button
              type="button"
              onClick={() => toggleSection("opportunity")}
              className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>Section 3: Business Opportunity (Optional)</span>
              {activeSections.opportunity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSections.opportunity && (
              <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/35 mt-1 bg-white dark:bg-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Potential Deal Value</label>
                  <input
                    type="number"
                    name="potentialDealValue"
                    value={formData.potentialDealValue || ""}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority || "Medium"}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Interest Level (1 - 5)</label>
                  <select
                    name="interestLevel"
                    value={formData.interestLevel || "3"}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="1">⭐ 1 (Cold)</option>
                    <option value="2">⭐⭐ 2 (Cool)</option>
                    <option value="3">⭐⭐⭐ 3 (Warm)</option>
                    <option value="4">⭐⭐⭐⭐ 4 (Hot)</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 (Extremely Hot)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Expected Closing Date</label>
                  <input
                    type="date"
                    name="expectedClosingDate"
                    value={formData.expectedClosingDate || ""}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Probability of Success (%)</label>
                  <input
                    type="number"
                    name="probabilityOfSuccess"
                    value={formData.probabilityOfSuccess || "50"}
                    min="0"
                    max="100"
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Custom Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="customTags"
                    value={formData.customTags || ""}
                    onChange={handleInputChange}
                    placeholder="e.g. enterprise, renewal"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── SECTION 4: NEXT STEPS ─── */}
          <div className="border border-slate-100 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
            <button
              type="button"
              onClick={() => toggleSection("nextsteps")}
              className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>Section 4: Next Steps</span>
              {activeSections.nextsteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSections.nextsteps && (
              <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/35 mt-1 bg-white dark:bg-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Required Next Action *</label>
                  <select
                    name="nextAction"
                    value={formData.nextAction || "Call Again"}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Call Again">📞 Call Again</option>
                    <option value="Send Information">📂 Send Information</option>
                    <option value="Prepare Proposal">📝 Prepare Proposal</option>
                    <option value="Schedule Meeting">🤝 Schedule Meeting</option>
                    <option value="Site Visit">📍 Site Visit</option>
                    <option value="Demo">💻 Demo</option>
                    <option value="Waiting for Customer">⏳ Waiting for Customer</option>
                    <option value="Customer Decision Pending">💭 Customer Decision Pending</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate || ""}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Assign Task To</label>
                  <select
                    name="assignedUser"
                    value={formData.assignedUser || ""}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="">Do Not Reassign</option>
                    {users?.filter((u): u is NonNullable<typeof u> => !!u).map((u) => (
                      <option key={u._id} value={u._id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    name="reminder"
                    checked={formData.reminder || false}
                    onChange={handleInputChange}
                    className="rounded text-indigo-650 border-slate-305 dark:border-slate-655 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Set Follow-up Reminder</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Logs a task to trigger overdue notices on dashboard.</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* ─── SECTION 5: CUSTOM FIELDS (DYNAMIC) ─── */}
          {activeCustomFields.length > 0 && (
            <div className="border border-indigo-100 dark:border-indigo-900/35 rounded-2xl overflow-hidden bg-indigo-50/5 dark:bg-indigo-950/5">
              <button
                type="button"
                onClick={() => toggleSection("customfields")}
                className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Stage Specific Fields
                </span>
                {activeSections.customfields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {activeSections.customfields && (
                <div className="px-5 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-indigo-100/50 dark:border-indigo-900/20 bg-white dark:bg-slate-800">
                  {activeCustomFields.map((field) => {
                    const isErr = !!validationErrors[field.name];
                    const val = customFieldValues[field.name];

                    return (
                      <div key={field.name} className={field.type === "Textarea" ? "col-span-1 md:col-span-2" : ""}>
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>

                        {/* Rendering dynamic custom fields based on configured type */}
                        {field.type === "Text" && (
                          <input
                            type="text"
                            name={field.name}
                            value={val || ""}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className={`w-full h-11 px-3 rounded-xl border bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                          />
                        )}

                        {field.type === "Textarea" && (
                          <textarea
                            name={field.name}
                            value={val || ""}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            rows={3}
                            className={`w-full p-3 rounded-xl border bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                          />
                        )}

                        {field.type === "Number" && (
                          <input
                            type="number"
                            name={field.name}
                            value={val || ""}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className={`w-full h-11 px-3 rounded-xl border bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                          />
                        )}

                        {field.type === "Currency" && (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              name={field.name}
                              value={val || ""}
                              onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                              className={`w-full h-11 pl-7 pr-3 rounded-xl border bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                            />
                          </div>
                        )}

                        {field.type === "Date" && (
                          <input
                            type="date"
                            name={field.name}
                            value={val || ""}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className={`w-full h-11 px-3 rounded-xl border bg-white dark:bg-slate-900 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                          />
                        )}

                        {field.type === "Checkbox" && (
                          <label className="flex items-center gap-2 cursor-pointer h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <input
                              type="checkbox"
                              name={field.name}
                              checked={!!val}
                              onChange={(e) => handleCustomFieldChange(field.name, e.target.checked)}
                              className="rounded text-indigo-650 border-slate-350 dark:border-slate-655 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-300">Yes / Checked</span>
                          </label>
                        )}

                        {field.type === "Dropdown" && (
                          <select
                            name={field.name}
                            value={val || ""}
                            onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                            className={`w-full h-11 px-3 border bg-white dark:bg-slate-900 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}
                          >
                            <option value="">Select Option</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {field.type === "Multi-select" && (
                          <div className={`p-3 bg-white dark:bg-slate-900 border rounded-xl space-y-1.5 ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}>
                            {field.options?.length === 0 ? (
                              <p className="text-[10px] text-slate-400">No options configured.</p>
                            ) : (
                              field.options?.map((opt) => {
                                const isChecked = val?.includes(opt);
                                return (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={!!isChecked}
                                      onChange={() => handleCustomMultiSelectToggle(field.name, opt)}
                                      className="rounded text-indigo-650 border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}

                        {field.type === "File Upload" && (
                          <div className={`p-3.5 bg-white dark:bg-slate-900 border rounded-xl flex items-center justify-between ${isErr ? "border-rose-500" : "border-slate-200 dark:border-slate-700"}`}>
                            {val?.fileName ? (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                  <span className="text-xs font-semibold text-slate-850 dark:text-slate-200 truncate">{val.fileName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCustomFieldChange(field.name, null)}
                                  className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 cursor-pointer w-full text-slate-400 hover:text-slate-600">
                                <Paperclip className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs">Choose document / recording</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleCustomFileUpload(field.name, e)}
                                />
                              </label>
                            )}
                          </div>
                        )}

                        {isErr && (
                          <p className="text-[10px] text-rose-500 mt-1">{validationErrors[field.name]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── SECTION 6: INTERACTION EVIDENCE ─── */}
          <div className="border border-slate-100 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
            <button
              type="button"
              onClick={() => toggleSection("attachments")}
              className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-violet-500" />
                <span>Section 5: Interaction Evidence</span>
              </span>
              {activeSections.attachments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSections.attachments && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-700/35 mt-1 bg-white dark:bg-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload supporting evidence collected during this customer interaction.
                </p>
                <InteractionEvidence
                  files={attachments}
                  onFilesChange={setAttachments}
                  onFilesSelected={handleFilesSelected}
                />
              </div>
            )}
          </div>

          {/* ─── SECTION 7: TIMELINE ENTRY PREVIEW ─── */}
          <div className="border border-slate-100 dark:border-slate-700/40 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
            <button
              type="button"
              onClick={() => toggleSection("preview")}
              className="w-full flex items-center justify-between px-5 py-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>Section 6: Timeline Entry Preview</span>
              {activeSections.preview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {activeSections.preview && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700/35 mt-1 bg-white dark:bg-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0 text-xs text-indigo-650 dark:text-indigo-400 font-bold">
                    PRE
                  </div>
                  <div className="flex-1 min-w-0 text-xs space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          {new Date(formData.date || Date.now()).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-xs">
                          {formData.activityType}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                        Interaction with {formData.personContacted || "Customer"} {formData.role && `(${formData.role})`}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formData.duration || "0"} min</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Outcome</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formData.outcome}</p>
                      </div>
                    </div>

                    {formData.summary && (
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Summary / Notes</p>
                        <p className="text-slate-650 dark:text-slate-350 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-100/40 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100/60 dark:border-slate-800/40">
                          {formData.summary}
                        </p>
                      </div>
                    )}

                    {/* Rendering dynamic fields in preview */}
                    {Object.keys(customFieldValues).length > 0 && (
                      <div>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Custom Field Entries</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 bg-indigo-50/20 dark:bg-indigo-950/10 p-2 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10">
                          {activeCustomFields.map((f) => {
                            const raw = customFieldValues[f.name];
                            if (raw === undefined || raw === null || raw === "") return null;
                            let displayVal = String(raw);
                            
                            if (f.type === "Checkbox") displayVal = raw ? "Checked" : "Unchecked";
                            if (f.type === "Multi-select" && Array.isArray(raw)) displayVal = raw.join(", ");
                            if (f.type === "File Upload" && raw?.fileName) displayVal = `📎 ${raw.fileName}`;

                            return (
                              <div key={f.name} className="min-w-0">
                                <span className="font-semibold text-slate-450 text-[10px] block truncate">{f.label}:</span>
                                <span className="font-bold text-slate-750 dark:text-slate-200 text-[11px] truncate block">{displayVal}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Next Action</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formData.nextAction} {formData.followUpDate && `on ${new Date(formData.followUpDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}`}
                        </p>
                      </div>
                      
                      {(attachments.length > 0) && (
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Attached Files</p>
                          <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{attachments.length} file(s)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </form>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-900/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-500 font-bold">
            <Info className="w-3.5 h-3.5" />
            <span>Auto-saving draft locally...</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-250 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFormSubmit}
              disabled={isSubmitting || uploadingFiles}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {uploadingFiles ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
                </>
              ) : isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save & Transition
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
