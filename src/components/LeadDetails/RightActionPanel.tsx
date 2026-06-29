import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Users, Clock, Mail, 
  CheckSquare, ArrowUpRight
} from "lucide-react";

interface RightActionPanelProps {
  lead: any;
}

export function RightActionPanel({ lead }: RightActionPanelProps) {
  const users = useQuery(api.users.list);

  // Queries
  const meetings = useQuery(api.meetings.list, lead ? { leadId: lead._id } : "skip");
  const emails = useQuery(api.emails.list, lead ? { leadId: lead._id } : "skip");
  const tasksData = useQuery(api.tasks.list, lead ? { leadId: lead._id } : "skip");
  const tasks = tasksData?.tasks;

  if (!lead) return null;

  const ownerUser = users?.find((u: any) => u._id === lead.assignedTo);
  const ownerName = ownerUser?.name || "Unassigned";

  const creatorUser = users?.find((u: any) => u._id === lead.createdBy);
  const creatorName = creatorUser?.name || "System";

  // Compute counts at component scope for use in scoring and display
  const taskCount = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === "Completed").length || 0;
  const emailCount = emails?.length || 0;
  const meetingCount = meetings?.length || 0;

  // Calculate Customer Relationship Health Score (0-100) dynamically
  const calculateRelationshipScore = () => {
    let score = 50;

    score += emailCount * 5;
    score += meetingCount * 10;
    if (taskCount > 0) {
      score += (completedTasks / taskCount) * 20;
    }

    if (lead.priority === "High" || lead.priority === "Urgent") {
      score += 10;
    }

    return Math.min(98, Math.max(30, Math.round(score)));
  };

  const relationshipScore = calculateRelationshipScore();
  const getHealthText = (s: number) => {
    if (s >= 80) return { text: "Excellent", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" };
    if (s >= 60) return { text: "Good", color: "text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20" };
    if (s >= 45) return { text: "Fair", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/20" };
    return { text: "At Risk", color: "text-rose-600 dark:text-rose-450 bg-rose-50/10" };
  };

  const health = getHealthText(relationshipScore);

  const upcomingMeetings = meetings?.filter(m => m.startTime > Date.now()).slice(0, 2) || [];
  const recentEmails = emails?.slice(0, 2) || [];
  const activeTasks = tasks?.filter(t => t.status !== "Completed").slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* 1. Relationship Health Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
          Account Relationship Health
        </h4>
        <div className="flex items-center gap-4">
          {/* Circular Score Gauge */}
          <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-750"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${
                  relationshipScore >= 80 ? "text-emerald-500" : relationshipScore >= 60 ? "text-indigo-500" : "text-amber-500"
                }`}
                strokeDasharray={`${relationshipScore}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-xs font-extrabold text-slate-900 dark:text-white">
              {relationshipScore}%
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-205">Relationship Score</h5>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${health.color}`}>
                {health.text}
              </span>
            </div>
            <p className="text-[10px] text-slate-405 dark:text-slate-400 font-semibold mt-1">
              Based on {emailCount} Emails, {meetingCount} Meetings, and {completedTasks}/{taskCount} Tasks.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Assigned Team Widget */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" /> Account Ownership Team
        </h4>
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 flex items-center justify-center font-bold text-xs">
                {ownerUser?.avatarUrl ? (
                  <img src={ownerUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  ownerName.charAt(0)
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-805 dark:text-slate-155">{ownerName}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">Lead Owner</p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-650 rounded-sm">Primary</span>
          </div>

          {creatorUser && creatorUser._id !== ownerUser?._id && (
            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/40 pt-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 flex items-center justify-center font-bold text-xs">
                  {creatorUser.avatarUrl ? (
                    <img src={creatorUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    creatorName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-805 dark:text-slate-155">{creatorName}</p>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">Lead Creator</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Upcoming Meetings Widget */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> Upcoming Meetings ({upcomingMeetings.length})
        </h4>
        {upcomingMeetings.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-1">No upcoming meetings scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meet) => (
              <div key={meet._id} className="p-2.5 bg-slate-50 dark:bg-slate-905/30 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between gap-1.5">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{meet.title || "Untitled Meeting"}</p>
                  <ArrowUpRight className="w-3 h-3 text-slate-350 shrink-0" />
                </div>
                <p className="text-[9px] text-indigo-650 dark:text-indigo-400 font-extrabold uppercase">
                  {meet.startTime ? new Date(meet.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recent Emails Widget */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400" /> Recent Emails ({recentEmails.length})
        </h4>
        {recentEmails.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-1">No email logs found.</p>
        ) : (
          <div className="space-y-3">
            {recentEmails.map((email) => (
              <div key={email._id} className="p-2.5 bg-slate-50 dark:bg-slate-905/30 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col gap-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{email.subject || "No Subject"}</p>
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                  <span>To: {email.to?.[0] || "—"}</span>
                  <span>{email.sentAt ? new Date(email.sentAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Open Sub-tasks Widget */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs">
        <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-slate-400" /> Open Checklist Tasks ({activeTasks.length})
        </h4>
        {activeTasks.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-1">All tasks completed! 👍</p>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((t) => (
              <div key={t._id} className="flex items-start gap-2 py-1.5 border-b border-slate-50 dark:border-slate-800/40 last:border-0 text-xs">
                <CheckSquare className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 break-all">{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default RightActionPanel;
