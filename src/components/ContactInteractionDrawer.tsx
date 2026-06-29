import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ChevronDown, ChevronUp, FileText, Paperclip,
  Phone, AlertCircle, CheckCircle2,
  Target, Building, Loader2, Save, Users, ClipboardList,
  Clock, CalendarCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  customFields?: Record<string, any>;
  industry?: string;
  companySize?: number;
}

interface ValidationState {
  interactionDetails: boolean;
  businessProfile: boolean;
  decisionInfo: boolean;
  businessNeeds: boolean;
  requirements: boolean;
  timelineBudget: boolean;
  followUp: boolean;
  notes: boolean;
}

interface ContactInteractionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onConfirm: (data: {
    transitionData: Record<string, any>;
    activityDetails: Record<string, any>;
    reminderDetails?: { title: string; dueDate: number };
    attachments?: AttachmentPayload[];
  }) => Promise<void>;
  onSaveDraft?: (data: Record<string, any>) => void;
}

const STEPS = ["Interaction", "Discovery", "Requirements", "Timeline", "Follow-up", "Notes"];

const INDUSTRIES = [
  "Technology", "Healthcare", "Manufacturing", "Retail", "Education",
  "Finance", "Insurance", "Construction", "Real Estate", "Logistics",
  "Hospitality", "Government", "Other",
];

const BUSINESS_TYPES = ["Startup", "SME", "Enterprise", "Government", "Non-Profit", "Individual"];

const BUYING_AUTHORITY = ["Decision Maker", "Influencer", "Evaluator", "End User", "Unknown"];

const URGENCY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const BUDGET_STATUS = ["Approved", "Planned", "Under Review", "Unknown"];

const TIMELINE_OPTIONS = [
  "Immediately", "Within 1 Month", "1–3 Months", "3–6 Months", "6+ Months", "Unknown",
];

const COMMUNICATION_OPTIONS = ["Email", "Phone", "WhatsApp", "Video Call", "In Person"];

export function ContactInteractionDrawer({
  isOpen,
  onClose,
  lead,
  onConfirm,
  onSaveDraft,
}: ContactInteractionDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Record<string, any>>({
    activityType: "Call",
    outcome: "",
    personContacted: "",
    personRole: "",
    contactDate: new Date().toISOString().split("T")[0],
    contactTime: new Date().toTimeString().split(" ")[0].slice(0, 5),
    duration: "15",
    businessType: "",
    industry: lead?.industry || "",
    companySize: lead?.companySize || "",
    decisionMaker: "",
    decisionMakerName: "",
    decisionMakerRole: "",
    buyingAuthority: "",
    currentSituation: "",
    businessChallenges: "",
    goalsObjectives: "",
    currentProcess: "",
    painPoints: "",
    requirementsSummary: "",
    expectedOutcome: "",
    competitors: "",
    urgency: "",
    budgetStatus: "",
    timeline: "",
    preferredCommunication: "Email",
    preferredContactTime: "",
    preferredFollowUpMethod: "",
    conversationSummary: "",
    additionalNotes: "",
    nextFollowUpDate: "",
    meetingScheduled: false,
  });
  const [attachments, setAttachments] = useState<EvidenceItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
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

  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    interaction: true,
    businessProfile: false,
    decisionInfo: false,
    businessNeeds: false,
    requirements: false,
    timelineBudget: false,
    followUp: false,
    evidence: false,
    notes: false,
  });

  const toggleSection = (sec: string) => {
    setActiveSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsaved(true);
  };

  useEffect(() => {
    if (isOpen && lead) {
      pendingFilesRef.current.clear();
      const draftKey = `crm_contact_interaction_draft_${lead._id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          setAttachments(parsed.attachments || []);
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen, lead]);

  useEffect(() => {
    if (isOpen && lead) {
      const draftKey = `crm_contact_interaction_draft_${lead._id}`;
      localStorage.setItem(draftKey, JSON.stringify({ formData, attachments }));
    }
  }, [formData, attachments, isOpen, lead]);

  const clearDraft = () => {
    const draftKey = `crm_contact_interaction_draft_${lead._id}`;
    localStorage.removeItem(draftKey);
  };

  const handleSaveDraft = () => {
    const draftKey = `crm_contact_interaction_draft_${lead._id}`;
    localStorage.setItem(draftKey, JSON.stringify({ formData, attachments }));
    setHasUnsaved(false);
    onSaveDraft?.(formData);
  };

  const validation: ValidationState = {
    interactionDetails: !!(
      formData.activityType && formData.personContacted && formData.contactDate
    ),
    businessProfile: !!(formData.businessType || formData.industry),
    decisionInfo: !!(formData.decisionMaker || formData.buyingAuthority),
    businessNeeds: !!(formData.currentSituation || formData.businessChallenges || formData.painPoints),
    requirements: !!(formData.requirementsSummary || formData.expectedOutcome),
    timelineBudget: !!(formData.urgency || formData.timeline || formData.budgetStatus),
    followUp: !!(formData.nextFollowUpDate || formData.meetingScheduled || formData.preferredFollowUpMethod),
    notes: !!formData.conversationSummary,
  };

  const completedCount = Object.values(validation).filter(Boolean).length;
  const totalRequired = 8;
  const progressPercent = Math.round((completedCount / totalRequired) * 100);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.personContacted) errors.personContacted = "Person contacted is required";
    if (!formData.contactDate) errors.contactDate = "Contact date is required";
    if (!formData.conversationSummary) errors.conversationSummary = "Conversation summary is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const contactDate = formData.contactDate || new Date().toISOString().split("T")[0];
      const contactTime = formData.contactTime || new Date().toTimeString().split(" ")[0].slice(0, 5);

      const activitySummary = formData.conversationSummary
        ? formData.conversationSummary.slice(0, 80) + (formData.conversationSummary.length > 80 ? "..." : "")
        : `Contacted ${formData.personContacted}`;

      let reminderDetails: { title: string; dueDate: number } | undefined;
      if (formData.nextFollowUpDate) {
        reminderDetails = {
          title: `Follow-up: ${lead.company}`,
          dueDate: new Date(formData.nextFollowUpDate).getTime(),
        };
      }

      let decisionMakerVal: boolean | undefined;
      if (formData.decisionMaker === "yes") decisionMakerVal = true;
      else if (formData.decisionMaker === "no") decisionMakerVal = false;

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

      await onConfirm({
        attachments: savedAttachments.length > 0 ? savedAttachments : undefined,
        transitionData: {
          businessType: formData.businessType,
          industry: formData.industry,
          companySize: formData.companySize ? Number(formData.companySize) : undefined,
          decisionMaker: decisionMakerVal,
          decisionMakerName: formData.decisionMakerName,
          decisionMakerRole: formData.decisionMakerRole,
          buyingAuthority: formData.buyingAuthority,
          currentSituation: formData.currentSituation,
          businessChallenges: formData.businessChallenges,
          goalsObjectives: formData.goalsObjectives,
          currentProcess: formData.currentProcess,
          painPoints: formData.painPoints,
          requirementsSummary: formData.requirementsSummary,
          expectedOutcome: formData.expectedOutcome,
          competitors: formData.competitors,
          urgency: formData.urgency,
          budgetStatus: formData.budgetStatus,
          timeline: formData.timeline,
          preferredCommunication: formData.preferredCommunication,
          preferredContactTime: formData.preferredContactTime,
          preferredFollowUpMethod: formData.preferredFollowUpMethod,
          conversationSummary: formData.conversationSummary,
          additionalNotes: formData.additionalNotes,
          nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).getTime() : undefined,
          meetingScheduled: formData.meetingScheduled,
        },
        activityDetails: {
          activityType: formData.activityType || "Call",
          summary: activitySummary,
          notes: formData.conversationSummary,
          outcome: formData.outcome,
          duration: formData.duration || "15",
          date: contactDate,
          time: contactTime,
          nextAction: formData.meetingScheduled ? "Meeting Scheduled" : formData.nextFollowUpDate ? "Follow-up Scheduled" : undefined,
          personContacted: formData.personContacted,
          personRole: formData.personRole,
        },
        reminderDetails,
      });
      clearDraft();
    } catch (err: any) {
      setValidationErrors(prev => ({ ...prev, submit: err.message || "Failed to submit" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionClass = (isActive: boolean) =>
    `border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors ${
      isActive ? "shadow-sm" : ""
    }`;

  const sectionHeader = (section: string, label: string, icon: React.ReactNode, isValid: boolean) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{label}</span>
        {isValid ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-gray-400" />
        )}
      </div>
      {activeSections[section] ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Contact Interaction
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lead.firstName} {lead.lastName} — {lead.company}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Qualification Progress
                </span>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {completedCount}/{totalRequired} complete
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {STEPS.map((step, i) => {
                  const keys = Object.keys(validation);
                  const isComplete = validation[keys[i] as keyof ValidationState];
                  return (
                    <span
                      key={step}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isComplete
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {validationErrors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {validationErrors.submit}
                </div>
              )}

              {/* Section 1: Interaction Details */}
              <div className={sectionClass(activeSections.interaction)}>
                {sectionHeader("interaction", "Interaction Details", <Phone className="w-4 h-4 text-indigo-500" />, validation.interactionDetails)}
                {activeSections.interaction && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Activity Type</label>
                        <select
                          value={formData.activityType || "Call"}
                          onChange={e => updateField("activityType", e.target.value)}
                          className={inputClass}
                        >
                          <option value="Call">Call</option>
                          <option value="Email">Email</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Video Call">Video Call</option>
                          <option value="Site Visit">Site Visit</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Outcome</label>
                        <select
                          value={formData.outcome}
                          onChange={e => updateField("outcome", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select outcome</option>
                          <option value="Interested">Interested</option>
                          <option value="Not Interested">Not Interested</option>
                          <option value="Need Follow-up">Need Follow-up</option>
                          <option value="Meeting Scheduled">Meeting Scheduled</option>
                          <option value="No Response">No Response</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Person Contacted *</label>
                        <input
                          type="text"
                          value={formData.personContacted}
                          onChange={e => updateField("personContacted", e.target.value)}
                          className={`${inputClass} ${validationErrors.personContacted ? "border-red-500" : ""}`}
                          placeholder="Full name"
                        />
                        {validationErrors.personContacted && <p className={errorClass}>{validationErrors.personContacted}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Role / Title</label>
                        <input
                          type="text"
                          value={formData.personRole}
                          onChange={e => updateField("personRole", e.target.value)}
                          className={inputClass}
                          placeholder="e.g. CEO, Manager"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Date *</label>
                        <input
                          type="date"
                          value={formData.contactDate}
                          onChange={e => updateField("contactDate", e.target.value)}
                          className={`${inputClass} ${validationErrors.contactDate ? "border-red-500" : ""}`}
                        />
                        {validationErrors.contactDate && <p className={errorClass}>{validationErrors.contactDate}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Time</label>
                        <input
                          type="time"
                          value={formData.contactTime}
                          onChange={e => updateField("contactTime", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Duration (min)</label>
                        <select
                          value={formData.duration || "15"}
                          onChange={e => updateField("duration", e.target.value)}
                          className={inputClass}
                        >
                          {[5, 10, 15, 30, 45, 60, 90, 120].map(m => (
                            <option key={m} value={m}>{m} min</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Business Profile */}
              <div className={sectionClass(activeSections.businessProfile)}>
                {sectionHeader("businessProfile", "Business Profile", <Building className="w-4 h-4 text-indigo-500" />, validation.businessProfile)}
                {activeSections.businessProfile && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Business Type</label>
                        <select
                          value={formData.businessType}
                          onChange={e => updateField("businessType", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select type</option>
                          {BUSINESS_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Industry</label>
                        <select
                          value={formData.industry}
                          onChange={e => updateField("industry", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select industry</option>
                          {INDUSTRIES.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Company Size (employees)</label>
                      <input
                        type="number"
                        value={formData.companySize}
                        onChange={e => updateField("companySize", e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 50"
                        min={1}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Decision Information */}
              <div className={sectionClass(activeSections.decisionInfo)}>
                {sectionHeader("decisionInfo", "Decision Information", <Users className="w-4 h-4 text-indigo-500" />, validation.decisionInfo)}
                {activeSections.decisionInfo && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Decision Maker</label>
                        <select
                          value={formData.decisionMaker}
                          onChange={e => updateField("decisionMaker", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Not sure yet</option>
                          <option value="yes">Yes, contacted</option>
                          <option value="no">No, gatekeeper only</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Buying Authority</label>
                        <select
                          value={formData.buyingAuthority}
                          onChange={e => updateField("buyingAuthority", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select authority</option>
                          {BUYING_AUTHORITY.map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(formData.decisionMaker === "yes") && (
                      <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                        <div>
                          <label className={labelClass}>Decision Maker Name</label>
                          <input
                            type="text"
                            value={formData.decisionMakerName}
                            onChange={e => updateField("decisionMakerName", e.target.value)}
                            className={inputClass}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Decision Maker Role</label>
                          <input
                            type="text"
                            value={formData.decisionMakerRole}
                            onChange={e => updateField("decisionMakerRole", e.target.value)}
                            className={inputClass}
                            placeholder="e.g. VP of Sales"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Business Needs */}
              <div className={sectionClass(activeSections.businessNeeds)}>
                {sectionHeader("businessNeeds", "Business Needs", <Target className="w-4 h-4 text-indigo-500" />, validation.businessNeeds)}
                {activeSections.businessNeeds && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className={labelClass}>Current Situation</label>
                      <textarea
                        value={formData.currentSituation}
                        onChange={e => updateField("currentSituation", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="Describe their current setup and context..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Business Challenges</label>
                      <textarea
                        value={formData.businessChallenges}
                        onChange={e => updateField("businessChallenges", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="What challenges are they facing?"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Goals / Objectives</label>
                      <textarea
                        value={formData.goalsObjectives}
                        onChange={e => updateField("goalsObjectives", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="What are they hoping to achieve?"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Current Process</label>
                      <textarea
                        value={formData.currentProcess}
                        onChange={e => updateField("currentProcess", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="How do they currently handle this?"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pain Points</label>
                      <textarea
                        value={formData.painPoints}
                        onChange={e => updateField("painPoints", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="Specific issues or frustrations..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Requirements */}
              <div className={sectionClass(activeSections.requirements)}>
                {sectionHeader("requirements", "Requirements", <ClipboardList className="w-4 h-4 text-indigo-500" />, validation.requirements)}
                {activeSections.requirements && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className={labelClass}>Requirements Summary</label>
                      <textarea
                        value={formData.requirementsSummary}
                        onChange={e => updateField("requirementsSummary", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="What are their key requirements?"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Expected Outcome</label>
                      <textarea
                        value={formData.expectedOutcome}
                        onChange={e => updateField("expectedOutcome", e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="What outcome do they expect?"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Competitors Being Considered</label>
                      <input
                        type="text"
                        value={formData.competitors}
                        onChange={e => updateField("competitors", e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Competitor A, Competitor B"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Timeline & Budget */}
              <div className={sectionClass(activeSections.timelineBudget)}>
                {sectionHeader("timelineBudget", "Timeline & Budget", <Clock className="w-4 h-4 text-indigo-500" />, validation.timelineBudget)}
                {activeSections.timelineBudget && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Urgency</label>
                        <select
                          value={formData.urgency}
                          onChange={e => updateField("urgency", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select urgency</option>
                          {URGENCY_OPTIONS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Budget Status</label>
                        <select
                          value={formData.budgetStatus}
                          onChange={e => updateField("budgetStatus", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select status</option>
                          {BUDGET_STATUS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Timeline</label>
                        <select
                          value={formData.timeline}
                          onChange={e => updateField("timeline", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select timeline</option>
                          {TIMELINE_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 7: Follow-up */}
              <div className={sectionClass(activeSections.followUp)}>
                {sectionHeader("followUp", "Follow-up", <CalendarCheck className="w-4 h-4 text-indigo-500" />, validation.followUp)}
                {activeSections.followUp && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Preferred Communication</label>
                        <select
                          value={formData.preferredCommunication}
                          onChange={e => updateField("preferredCommunication", e.target.value)}
                          className={inputClass}
                        >
                          {COMMUNICATION_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Preferred Contact Time</label>
                        <select
                          value={formData.preferredContactTime}
                          onChange={e => updateField("preferredContactTime", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Not specified</option>
                          <option value="Morning">Morning (9-12)</option>
                          <option value="Afternoon">Afternoon (12-5)</option>
                          <option value="Evening">Evening (5-8)</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Follow-up Method</label>
                        <select
                          value={formData.preferredFollowUpMethod}
                          onChange={e => updateField("preferredFollowUpMethod", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select method</option>
                          {COMMUNICATION_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Follow-up Date</label>
                        <input
                          type="date"
                          value={formData.nextFollowUpDate}
                          onChange={e => updateField("nextFollowUpDate", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.meetingScheduled}
                            onChange={e => updateField("meetingScheduled", e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Meeting scheduled</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 8: Evidence Upload */}
              <div className={sectionClass(activeSections.evidence)}>
                {sectionHeader("evidence", "Interaction Evidence", <Paperclip className="w-4 h-4 text-indigo-500" />, attachments.length > 0)}
                {activeSections.evidence && (
                  <div className="p-4">
                    <InteractionEvidence
                      files={attachments}
                      onFilesChange={setAttachments}
                      onFilesSelected={handleFilesSelected}
                      targetStage="Contacted"
                    />
                  </div>
                )}
              </div>

              {/* Section 9: Notes */}
              <div className={sectionClass(activeSections.notes)}>
                {sectionHeader("notes", "Notes", <FileText className="w-4 h-4 text-indigo-500" />, validation.notes)}
                {activeSections.notes && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className={labelClass}>Conversation Summary *</label>
                      <textarea
                        value={formData.conversationSummary}
                        onChange={e => updateField("conversationSummary", e.target.value)}
                        className={`${inputClass} ${validationErrors.conversationSummary ? "border-red-500" : ""}`}
                        rows={4}
                        placeholder="Summarize the key points from the conversation..."
                      />
                      {validationErrors.conversationSummary && <p className={errorClass}>{validationErrors.conversationSummary}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Additional Notes</label>
                      <textarea
                        value={formData.additionalNotes}
                        onChange={e => updateField("additionalNotes", e.target.value)}
                        className={inputClass}
                        rows={3}
                        placeholder="Any other relevant information..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasUnsaved && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Save className="w-3 h-3" /> Unsaved changes
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveDraft}
                    disabled={!hasUnsaved || isSubmitting || uploadingFiles}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting || uploadingFiles ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Draft"
                    )}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || uploadingFiles}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {uploadingFiles ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
                      </span>
                    ) : isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </span>
                    ) : (
                      "Save & Continue"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
