import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Phone, Mail, MessageSquare, Video, FileText,
  Sparkles, Loader2 
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface QuickActionsProps {
  lead: any;
}

export function QuickActions({ lead }: QuickActionsProps) {
  const { toast } = useToast();

  // Mutations
  const createActivityMutation = useMutation(api.leads.transitionStage); // We can repurpose activity logging by using transitionStage with fromStage == toStage, or we can write a dedicated mutation. Let's see: leads.ts transitionStage mutation takes transitionData and activityDetails. Wait, do we have a direct activity logging mutation?
  // Wait, let's check if leads.ts has a simple activity logging mutation, or if we can write one. We have listLeadActivities. Let's check leads.ts for logActivity or insertActivity.
  // Wait, does leads.ts have createActivity or logActivity? Let's check!
  // Let's do a search for mutation in leads.ts that inserts into leadActivities.
  // Ah! transitionStage mutation inserts into leadActivities! But wait! Can we add a simple createActivity mutation to leads.ts to make it extremely easy to log phone calls, WhatsApp messages, emails, and notes directly from Quick Actions?
  // Yes, let's do that! Let's check if we can add createActivity mutation to convex/leads.ts.
  // Let's add it. It's so much cleaner than reusing transitionStage.
  
  // States for Modals
  const [activeModal, setActiveModal] = useState<"call" | "email" | "meeting" | "proposal" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [callOutcome, setCallOutcome] = useState("Successful");
  const [callDuration, setCallDuration] = useState("10");
  const [callNotes, setCallNotes] = useState("");

  const [emailTo, setEmailTo] = useState(lead?.email || "");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Mutations from Convex
  const sendEmailMutation = useMutation(api.emails.send);
  const scheduleMeetingMutation = useMutation(api.meetings.schedule);
  const uploadAttachmentMutation = useMutation(api.leads.uploadAttachment);

  if (!lead) return null;

  // Phone Call Logger
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotes.trim()) return;

    setIsSubmitting(true);
    try {
      const now = Date.now();
      // Directly log phone call using transitionStage by sending empty transitionData
      // and targetStage = lead.status (no stage change, just logs activity!)
      await createActivityMutation({
        leadId: lead._id,
        toStage: lead.status, // keep current stage
        transitionData: {},
        activityDetails: {
          activityType: "Phone Call",
          summary: `Call (${callOutcome}): ${callNotes.slice(0, 50)}...`,
          notes: `Duration: ${callDuration} min. Outcome: ${callOutcome}.\n\nNotes: ${callNotes}`,
          duration: callDuration,
          outcome: callOutcome,
          date: new Date(now).toLocaleDateString(),
          time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
          nextAction: "None",
        }
      });

      setCallNotes("");
      setActiveModal(null);
      toast("success", "Phone Call activity logged successfully!");
    } catch (err: any) {
      toast("error", err.message || "Failed to log phone call");
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Sender
  const handleWhatsAppClick = async () => {
    const cleanPhone = lead.phone?.replace(/[^0-9+]/g, "") || "";
    if (!cleanPhone) {
      toast("error", "No phone number available for WhatsApp");
      return;
    }

    // Log Activity
    try {
      const now = Date.now();
      await createActivityMutation({
        leadId: lead._id,
        toStage: lead.status,
        transitionData: {},
        activityDetails: {
          activityType: "WhatsApp",
          summary: `WhatsApp message initiated`,
          notes: `Opened WhatsApp chat with client phone: ${cleanPhone}`,
          date: new Date(now).toLocaleDateString(),
          time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
          nextAction: "Follow up",
        }
      });
      
      window.open(`https://wa.me/${cleanPhone}`, "_blank");
      toast("success", "WhatsApp chat opened and activity logged!");
    } catch (err: any) {
      toast("error", "Failed to log WhatsApp activity");
    }
  };

  // Email Sender
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) return;

    setIsSubmitting(true);
    try {
      await sendEmailMutation({
        leadId: lead._id,
        to: [emailTo],
        subject: emailSubject,
        body: emailBody,
      });

      setEmailSubject("");
      setEmailBody("");
      setActiveModal(null);
      toast("success", `Email sent successfully to ${emailTo}!`);
    } catch (err: any) {
      toast("error", err.message || "Failed to send email");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Meeting Scheduler
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingDate) return;

    setIsSubmitting(true);
    try {
      const startEpoch = new Date(`${meetingDate}T${meetingTime}:00`).getTime();
      const endEpoch = startEpoch + Number(meetingDuration) * 60 * 1000;

      await scheduleMeetingMutation({
        leadId: lead._id,
        title: meetingTitle.trim(),
        description: meetingNotes.trim() || undefined,
        startTime: startEpoch,
        endTime: endEpoch,
        location: "Video Conference",
      });

      setMeetingTitle("");
      setMeetingDate("");
      setMeetingTime("10:00");
      setMeetingNotes("");
      setActiveModal(null);
      toast("success", "Meeting scheduled and logged!");
    } catch (err: any) {
      toast("error", err.message || "Failed to schedule meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-Generate Proposal Document
  const handleGenerateProposal = async () => {
    setIsSubmitting(true);
    try {
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString();
      
      // Auto-generate proposal mock text content
      const proposalContent = `
=========================================
COMMERCIAL SALES PROPOSAL
Date: ${dateStr}
Prepared For: ${lead.company}
Lead Contact: ${lead.firstName} ${lead.lastName}
Status stage: ${lead.status}
Estimated value: ${lead.value || 0} INR
=========================================

1. PROJECT UNDERSTANDING
Based on sales discussions, client has indicated interest level ${lead.customFields?.interestLevel || "Medium"}.

2. FINANCIAL INVESTMENT
Proposed commercial contract value: ${lead.value || 0} INR.

3. NEXT STEPS
Transition to Won stage will trigger onboarding tasks and service contract initialization.
      `;

      // Convert proposal content to Base64
      const base64Content = "data:text/plain;base64," + btoa(proposalContent);
      const fileName = `Proposal_${lead.company.replace(/\s+/g, "_")}_${now}.txt`;

      // Upload file to vault
      await uploadAttachmentMutation({
        leadId: lead._id,
        fileName,
        fileType: "text/plain",
        fileUrl: base64Content,
      });

      // Log activity
      await createActivityMutation({
        leadId: lead._id,
        toStage: lead.status,
        transitionData: {},
        activityDetails: {
          activityType: "Proposal",
          summary: `Proposal Auto-Generated: ${fileName}`,
          notes: `CRM proposal document compiled dynamically. Saved in Vault.`,
          date: new Date(now).toLocaleDateString(),
          time: new Date(now).toTimeString().split(" ")[0].slice(0, 5),
        }
      });

      toast("success", "Proposal PDF/Text generated and uploaded to File Vault! 📄");
    } catch (err: any) {
      toast("error", err.message || "Failed to generate proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
      <h3 className="font-bold text-slate-850 dark:text-white text-sm pb-2.5 border-b border-slate-100 dark:border-slate-800/40 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-505" /> Workspace Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Phone Call */}
        <button
          onClick={() => setActiveModal("call")}
          className="h-10 px-3.5 bg-slate-50 dark:bg-slate-905 hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border border-slate-100 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-500" /> Log Phone Call
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className="h-10 px-3.5 bg-slate-50 dark:bg-slate-905 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 border border-slate-100 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Chat
        </button>

        {/* Email */}
        <button
          onClick={() => setActiveModal("email")}
          className="h-10 px-3.5 bg-slate-50 dark:bg-slate-905 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 border border-slate-100 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5 text-blue-500" /> Send Email
        </button>

        {/* Meeting */}
        <button
          onClick={() => setActiveModal("meeting")}
          className="h-10 px-3.5 bg-slate-50 dark:bg-slate-905 hover:bg-amber-50 hover:text-amber-705 dark:hover:bg-amber-955/20 dark:hover:text-amber-400 border border-slate-100 dark:border-slate-800 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Video className="w-3.5 h-3.5 text-amber-500" /> Schedule Meeting
        </button>

        {/* Auto Proposal */}
        <button
          onClick={handleGenerateProposal}
          disabled={isSubmitting}
          className="col-span-2 h-10 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          Compile Sales Proposal
        </button>
      </div>

      {/* ─── MODALS ─── */}

      {/* 1. Call Logger Modal */}
      {activeModal === "call" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700 shadow-2xl space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 border-b pb-2">
              📞 Log Client Phone Call
            </h4>
            <form onSubmit={handleLogCall} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Outcome</label>
                  <select 
                    value={callOutcome} 
                    onChange={e => setCallOutcome(e.target.value)} 
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                  >
                    <option value="Successful">Successful</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Busy">Busy</option>
                    <option value="Wrong Number">Wrong Number</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Duration (mins)</label>
                  <input 
                    type="number" 
                    value={callDuration} 
                    onChange={e => setCallDuration(e.target.value)} 
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Call Conversation Notes</label>
                <textarea
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  rows={4}
                  placeholder="What was discussed?"
                  className="w-full p-2.5 rounded-xl border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="h-8 px-4 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-lg text-xs cursor-pointer">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Log"}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="h-8 px-4 border border-slate-205 text-slate-500 rounded-lg text-xs cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Email Sender Modal */}
      {activeModal === "email" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-700 shadow-2xl space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 border-b pb-2">
              ✉️ Send Email Composer
            </h4>
            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">To</label>
                <input 
                  type="email" 
                  value={emailTo} 
                  onChange={e => setEmailTo(e.target.value)} 
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Subject</label>
                <input 
                  type="text" 
                  value={emailSubject} 
                  onChange={e => setEmailSubject(e.target.value)} 
                  placeholder="Proposal Follow up, Product details..."
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-805"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Body</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={6}
                  placeholder="Write your email body..."
                  className="w-full p-2.5 rounded-xl border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-805 outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="h-8 px-4 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-lg text-xs cursor-pointer">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Email"}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="h-8 px-4 border border-slate-205 text-slate-500 rounded-lg text-xs cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Schedule Meeting Modal */}
      {activeModal === "meeting" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700 shadow-2xl space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 border-b pb-2">
              🗓️ Schedule Meeting
            </h4>
            <form onSubmit={handleScheduleMeeting} className="space-y-3.5">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Meeting Title</label>
                <input 
                  type="text" 
                  value={meetingTitle} 
                  onChange={e => setMeetingTitle(e.target.value)} 
                  placeholder="e.g. Discovery call, Demo session"
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Date</label>
                  <input 
                    type="date" 
                    value={meetingDate} 
                    onChange={e => setMeetingDate(e.target.value)} 
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Time</label>
                  <input 
                    type="time" 
                    value={meetingTime} 
                    onChange={e => setMeetingTime(e.target.value)} 
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Duration (mins)</label>
                <select
                  value={meetingDuration}
                  onChange={e => setMeetingDuration(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800"
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase">Description / Agenda</label>
                <textarea
                  value={meetingNotes}
                  onChange={e => setMeetingNotes(e.target.value)}
                  rows={3}
                  placeholder="Meeting agenda..."
                  className="w-full p-2.5 rounded-xl border border-slate-205 dark:border-slate-700 text-xs bg-transparent text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="submit" disabled={isSubmitting} className="h-8 px-4 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-lg text-xs cursor-pointer">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Meeting"}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="h-8 px-4 border border-slate-205 text-slate-505 rounded-lg text-xs cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default QuickActions;
