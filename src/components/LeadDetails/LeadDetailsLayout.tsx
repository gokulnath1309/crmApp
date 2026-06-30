import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  ArrowLeft, FileText, History, Info, Paperclip, CheckCircle, 
  BellRing, Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useNavigate } from "react-router-dom";

// Import Reusable Sub-components
import { LeadHeader } from "./LeadHeader";
import { LeadOverviewCards } from "./LeadOverviewCards";
import { PipelineProgress } from "./PipelineProgress";
import { ContactInformationCard } from "./ContactInformationCard";
import { OpportunityCard } from "./OpportunityCard";
import { ActivityTimeline } from "./ActivityTimeline";
import { NotesCard } from "./NotesCard";
import { FilesCard } from "./FilesCard";
import { TasksCard } from "./TasksCard";
import { RemindersCard } from "./RemindersCard";
import { QuickActions } from "./QuickActions";
import { RightActionPanel } from "./RightActionPanel";

// Import workflow modals and drawers
import { ContactInteractionDrawer } from "@/components/ContactInteractionDrawer";
import { LeadTransitionDrawer } from "@/components/LeadTransitionDrawer";
import { UnqualifiedModal, LostModal, RequalifyModal, SpamModal, DuplicateModal } from "@/components/StatusWorkflowModals";
import { ConvertToDealModal } from "@/components/ConvertToDealModal";

interface LeadDetailsLayoutProps {
  leadId: string;
  onBack: () => void;
  onLeadDelete?: () => void;
}

export function LeadDetailsLayout({ leadId, onBack, onLeadDelete }: LeadDetailsLayoutProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Realtime Subscriptions
  const lead = useQuery(api.leads.get, { id: leadId as any });
  const transitions = useQuery(api.leads.listTransitions, { leadId: leadId as any });
  const activities = useQuery(api.leads.listLeadActivities, { leadId: leadId as any });
  const reminders = useQuery(api.leads.listLeadReminders, { leadId: leadId as any });
  const allLeads = useQuery(api.leads.list, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Mutations
  const transitionLeadMutation = useMutation(api.leads.transitionStage);
  const changeStatusMutation = useMutation(api.leads.changeStatus);
  const contactInteractionMutation = useMutation(api.leads.contactInteraction);
  const setContactedDataMutation = useMutation(api.leads.setContactedData);
  const convertToDealMutation = useMutation(api.leads.convertToDeal);
  const deleteLeadMutation = useMutation(api.leads.softDelete);
  const mergeMutation = useMutation(api.leads.mergeLeads);
  const createReminderMutation = useMutation(api.leads.createReminder);

  // States
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "notes" | "files" | "tasks" | "reminders">("overview");
  
  // Workflow Dialog States
  const [isTransitionDrawerOpen, setIsTransitionDrawerOpen] = useState(false);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [isContactQualifyMode, setIsContactQualifyMode] = useState(false);
  const [transitionTargetStage, setTransitionTargetStage] = useState("");
  const [isUnqualifiedModalOpen, setIsUnqualifiedModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isRequalifyModalOpen, setIsRequalifyModalOpen] = useState(false);
  const [isSpamModalOpen, setIsSpamModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isConvertDealOpen, setIsConvertDealOpen] = useState(false);
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);

  const [pendingStatusChange, setPendingStatusChange] = useState<{
    targetStatus: string;
    onConfirm: (extraFields: Record<string, any>) => void;
    onCancel?: () => void;
  } | null>(null);

  const handleConvertToDeal = async () => {
    if (isCreatingDeal) return;
    setIsCreatingDeal(true);
    try {
      const result = await convertToDealMutation({ leadId: lead?._id });
      toast("success", "Lead converted to deal successfully");
      if (result?.dealId) {
        navigate("/deals");
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to convert lead");
    } finally {
      setIsCreatingDeal(false);
    }
  };

  if (lead === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-650" />
        <p className="text-sm font-semibold">Loading Lead Workspace...</p>
      </div>
    );
  }

  if (lead === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Lead Not Found</h3>
        <p className="text-xs">The lead may have been deleted or moved.</p>
        <button 
          onClick={onBack} 
          className="mt-2 h-9 px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Return to Leads
        </button>
      </div>
    );
  }

  const lastActivity = activities && activities.length > 0 ? activities[0] : null;
  const nextReminder = reminders && reminders.filter(r => !r.isCompleted).length > 0
    ? reminders.filter(r => !r.isCompleted).sort((a, b) => a.dueDate - b.dueDate)[0]
    : null;

  const handlePipelineStatusRequest = (targetStage: string) => {
    const isLeadClosed = ["Lost", "Unqualified", "Spam", "Duplicate"].includes(lead.status) || lead.isClosed;

    if (targetStage === "Lost") {
      setPendingStatusChange({
        targetStatus: targetStage,
        onConfirm: async (fields) => {
          try {
            await changeStatusMutation({
              leadId: lead._id,
              status: "Lost",
              lostReason: fields.lostReason,
              lostNotes: fields.lostNotes || "",
              lostDate: fields.lostDate,
            });
            toast("success", "Lead status updated to Lost");
          } catch (err: any) {
            toast("error", err.message || "Failed to update lead status");
          }
        }
      });
      setIsLostModalOpen(true);
    } else if (targetStage === "Unqualified") {
      setPendingStatusChange({
        targetStatus: targetStage,
        onConfirm: async (fields) => {
          try {
            await changeStatusMutation({
              leadId: lead._id,
              status: "Unqualified",
              unqualifiedReason: fields.unqualifiedReason,
              unqualifiedNotes: fields.unqualifiedNotes || "",
            });
            if (fields.reminderDate) {
              await createReminderMutation({
                leadId: lead._id,
                title: `Review unqualified lead: ${lead.company}`,
                dueDate: new Date(fields.reminderDate).getTime(),
              });
            }
            toast("success", "Lead status updated to Unqualified");
          } catch (err: any) {
            toast("error", err.message || "Failed to update lead status");
          }
        }
      });
      setIsUnqualifiedModalOpen(true);
    } else if (targetStage === "Spam") {
      setPendingStatusChange({
        targetStatus: targetStage,
        onConfirm: async (fields) => {
          try {
            await changeStatusMutation({
              leadId: lead._id,
              status: "Spam",
              spamReason: fields.spamReason,
              spamNotes: fields.spamNotes || "",
            });
            toast("success", "Lead marked as Spam");
          } catch (err: any) {
            toast("error", err.message || "Failed to mark lead as spam");
          }
        }
      });
      setIsSpamModalOpen(true);
    } else if (targetStage === "Duplicate") {
      setPendingStatusChange({
        targetStatus: targetStage,
        onConfirm: async (_fields) => {
          // Confirm callback handled in DuplicateModal below
        }
      });
      setIsDuplicateModalOpen(true);
    } else if (isLeadClosed && targetStage === "Contacted") {
      setPendingStatusChange({
        targetStatus: targetStage,
        onConfirm: async (fields) => {
          try {
            await changeStatusMutation({
              leadId: lead._id,
              status: "Contacted",
              requalificationReason: fields.requalificationReason,
            });
            toast("success", "Lead reopened successfully");
          } catch (err: any) {
            toast("error", err.message || "Failed to reopen lead");
          }
        }
      });
      setIsRequalifyModalOpen(true);
    } else if (targetStage === "Contacted" && lead.status === "New") {
      setIsContactQualifyMode(false);
      setIsContactDrawerOpen(true);
    } else if (targetStage === "Qualified" && lead.status === "Contacted") {
      setIsContactQualifyMode(true);
      setIsContactDrawerOpen(true);
    } else if (targetStage === "Converted" && lead.status === "Qualified") {
      setIsConvertDealOpen(true);
      setConvertDealValue("");
    } else {
      setTransitionTargetStage(targetStage);
      setIsTransitionDrawerOpen(true);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm(`Delete "${lead.company}"? This record will be moved to Trash and can be restored later.`)) return;
    try {
      await deleteLeadMutation({ id: lead._id });
      toast("success", "Lead moved to trash");
      if (onLeadDelete) onLeadDelete();
      onBack();
    } catch (err: any) {
      toast("error", err.message || "Failed to delete lead");
    }
  };

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Info className="w-3.5 h-3.5" /> },
    { id: "timeline", label: "Timeline", icon: <History className="w-3.5 h-3.5" /> },
    { id: "notes", label: "Notes", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "files", label: "Files", icon: <Paperclip className="w-3.5 h-3.5" /> },
    { id: "tasks", label: "Tasks", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { id: "reminders", label: "Reminders", icon: <BellRing className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12 select-none">
      
      {/* ─── Back to list Header ─── */}
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-4 py-2.5 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads Table
        </button>
      </div>

      {/* ─── Lead Identity Header ─── */}
      <LeadHeader 
        lead={lead} 
        onEdit={() => {}} // Edit handled from Leads.tsx
        onDelete={handleDeleteLead}
        onStatusChangeClick={() => {}}
      />

      {/* ─── Quick overview metrics ─── */}
      <LeadOverviewCards 
        lead={lead} 
        lastActivity={lastActivity} 
        nextReminder={nextReminder}
      />

      {/* ─── Horizontal Stage Pipeline ─── */}
      <PipelineProgress 
        lead={lead}
        transitions={transitions}
        onTransitionClick={handlePipelineStatusRequest}
        onQuickMarkStatus={handlePipelineStatusRequest}
        onReopenClick={() => handlePipelineStatusRequest("Contacted")}
        isCreatingDeal={isCreatingDeal}
        onConvertToDeal={handleConvertToDeal}
        currentUserRole={currentUser?.role}
      />

      {/* ─── Tabs and Sub-layout Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side Tab Container (2/3 width) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
          
          {/* Tab selector */}
          <div className="flex border-b border-slate-200 dark:border-slate-700/50 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 pb-0.5">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 h-10 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    isActive 
                      ? "border-indigo-600 text-indigo-650 dark:text-indigo-400" 
                      : "border-transparent text-slate-400 hover:text-slate-650"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sub-tab Rendering */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <ContactInformationCard lead={lead} />
                <NotesCard lead={lead} />
                <div className="md:col-span-2">
                  <ActivityTimeline lead={lead} activities={activities} transitions={transitions} />
                </div>
              </div>
            )}
            
            {activeTab === "timeline" && (
              <ActivityTimeline lead={lead} activities={activities} transitions={transitions} />
            )}

            {activeTab === "notes" && (
              <NotesCard lead={lead} />
            )}

            {activeTab === "files" && (
              <FilesCard lead={lead} />
            )}

            {activeTab === "tasks" && (
              <TasksCard lead={lead} />
            )}

            {activeTab === "reminders" && (
              <RemindersCard lead={lead} />
            )}
          </div>
        </div>

        {/* Right Side Control Panel (1/3 width) */}
        <div className="space-y-6">
          <QuickActions lead={lead} />
          <OpportunityCard lead={lead} />
          <RightActionPanel lead={lead} />
        </div>
      </div>

      {/* ─── WORKFLOW MODALS AND DRAWERS ─── */}

      {/* Contact Interaction Drawer (New→Contacted / Contacted→Qualified) */}
      <ContactInteractionDrawer
        isOpen={isContactDrawerOpen}
        onClose={() => {
          setIsContactDrawerOpen(false);
          setIsContactQualifyMode(false);
        }}
        lead={lead as any}
        onConfirm={async (data) => {
          try {
            if (isContactQualifyMode) {
              await setContactedDataMutation({
                leadId: lead._id,
                businessType: data.transitionData.businessType,
                buyingAuthority: data.transitionData.buyingAuthority,
                currentSituation: data.transitionData.currentSituation,
                businessChallenges: data.transitionData.businessChallenges,
                goalsObjectives: data.transitionData.goalsObjectives,
                currentProcess: data.transitionData.currentProcess,
                painPoints: data.transitionData.painPoints,
                requirementsSummary: data.transitionData.requirementsSummary,
                expectedOutcome: data.transitionData.expectedOutcome,
                competitors: data.transitionData.competitors,
                urgency: data.transitionData.urgency,
                budgetStatus: data.transitionData.budgetStatus,
                timeline: data.transitionData.timeline,
                decisionMaker: data.transitionData.decisionMaker,
                decisionMakerName: data.transitionData.decisionMakerName,
                decisionMakerRole: data.transitionData.decisionMakerRole,
                preferredCommunication: data.transitionData.preferredCommunication,
                preferredContactTime: data.transitionData.preferredContactTime,
                preferredFollowUpMethod: data.transitionData.preferredFollowUpMethod,
                conversationSummary: data.transitionData.conversationSummary,
                nextFollowUpDate: data.transitionData.nextFollowUpDate,
                meetingScheduled: data.transitionData.meetingScheduled,
                notes: data.transitionData.additionalNotes,
                isQualified: true,
                attachments: data.attachments as any,
              });
              toast("success", "Lead qualified successfully");
            } else {
              await contactInteractionMutation({
                leadId: lead._id,
                businessType: data.transitionData.businessType,
                buyingAuthority: data.transitionData.buyingAuthority,
                currentSituation: data.transitionData.currentSituation,
                businessChallenges: data.transitionData.businessChallenges,
                goalsObjectives: data.transitionData.goalsObjectives,
                currentProcess: data.transitionData.currentProcess,
                painPoints: data.transitionData.painPoints,
                requirementsSummary: data.transitionData.requirementsSummary,
                expectedOutcome: data.transitionData.expectedOutcome,
                competitors: data.transitionData.competitors,
                urgency: data.transitionData.urgency,
                budgetStatus: data.transitionData.budgetStatus,
                timeline: data.transitionData.timeline,
                decisionMaker: data.transitionData.decisionMaker,
                decisionMakerName: data.transitionData.decisionMakerName,
                decisionMakerRole: data.transitionData.decisionMakerRole,
                preferredCommunication: data.transitionData.preferredCommunication,
                preferredContactTime: data.transitionData.preferredContactTime,
                preferredFollowUpMethod: data.transitionData.preferredFollowUpMethod,
                conversationSummary: data.transitionData.conversationSummary,
                nextFollowUpDate: data.transitionData.nextFollowUpDate,
                meetingScheduled: data.transitionData.meetingScheduled,
                notes: data.transitionData.additionalNotes,
                status: "Contacted",
                attachments: data.attachments as any,
              });
              toast("success", "Lead moved to Contacted stage");
            }
          } catch (err: any) {
            toast("error", err.message || "Failed to process interaction");
          }
        }}
      />

      {/* Lead Transition Drawer (fallback for other stages) */}
      <LeadTransitionDrawer
        isOpen={isTransitionDrawerOpen}
        onClose={() => {
          setIsTransitionDrawerOpen(false);
          setTransitionTargetStage("");
        }}
        lead={lead as any}
        targetStage={transitionTargetStage}
        onConfirm={async (data) => {
          try {
            await transitionLeadMutation({
              leadId: lead._id,
              toStage: transitionTargetStage,
              transitionData: data.transitionData,
              activityDetails: data.activityDetails as any,
              reminderDetails: data.reminderDetails,
              attachments: data.attachments as any,
            });
            toast("success", `Lead transitioned to ${transitionTargetStage}`);
          } catch (err: any) {
            toast("error", err.message || "Failed to transition lead");
          }
        }}
      />

      <ConvertToDealModal
        open={isConvertDealOpen}
        onClose={() => setIsConvertDealOpen(false)}
        lead={{
          _id: lead._id,
          company: lead.company,
          firstName: lead.firstName,
          lastName: lead.lastName,
          value: lead.value,
          currency: lead.currency,
        }}
        isCreatingDeal={isCreatingDeal}
      />

      <UnqualifiedModal
        open={isUnqualifiedModalOpen}
        onClose={() => {
          setIsUnqualifiedModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={(data) => {
          if (pendingStatusChange) {
            pendingStatusChange.onConfirm({
              unqualifiedReason: data.reason,
              unqualifiedNotes: data.notes || "",
            });
          }
          setIsUnqualifiedModalOpen(false);
          setPendingStatusChange(null);
        }}
      />

      <LostModal
        open={isLostModalOpen}
        onClose={() => {
          setIsLostModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={(data) => {
          if (pendingStatusChange) {
            pendingStatusChange.onConfirm({
              lostReason: data.reason,
              lostNotes: data.notes || "",
            });
          }
          setIsLostModalOpen(false);
          setPendingStatusChange(null);
        }}
      />

      <RequalifyModal
        open={isRequalifyModalOpen}
        onClose={() => {
          setIsRequalifyModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={(data) => {
          if (pendingStatusChange) {
            pendingStatusChange.onConfirm({
              requalificationReason: data.reason,
            });
          }
          setIsRequalifyModalOpen(false);
          setPendingStatusChange(null);
        }}
      />

      <SpamModal
        open={isSpamModalOpen}
        onClose={() => {
          setIsSpamModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={(data) => {
          if (pendingStatusChange) {
            pendingStatusChange.onConfirm({
              spamReason: data.reason,
              spamNotes: data.notes || "",
            });
          }
          setIsSpamModalOpen(false);
          setPendingStatusChange(null);
        }}
      />

      <DuplicateModal
        open={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={async (data) => {
          try {
            await mergeMutation({
              duplicateLeadId: lead._id,
              targetLeadId: data.targetLeadId as any,
              mergeNotes: data.mergeNotes,
              mergeActivities: data.mergeActivities,
              mergeFiles: data.mergeFiles,
              mergeTimeline: data.mergeTimeline,
              notes: data.notes,
            });
            toast("success", "Duplicate lead merged successfully");
            onBack(); // Go back to list since duplicate is archived
          } catch (err: any) {
            toast("error", err.message || "Failed to merge leads");
          }
          setIsDuplicateModalOpen(false);
          setPendingStatusChange(null);
        }}
        leads={allLeads}
        currentLeadId={lead._id}
      />
    </div>
  );
}
export default LeadDetailsLayout;
