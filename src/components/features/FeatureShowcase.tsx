import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Phone, 
  Building, 
  ChevronDown,
  Check,
} from "lucide-react";
import { motion } from "motion/react";
import styles from "../../pages/Features.module.css";

// 1. Customer Management Preview
function CustomerPreview() {
  const [activeTab, setActiveTab] = useState("info");
  
  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">customer_profile.dmg</span>
        </div>
        <div className={styles.visualContent}>
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/10">
              JD
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Jane Doe</div>
              <div className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">VP of Operations, Acme Corp</div>
            </div>
            <div className="ml-auto bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/30">
              Active Partner
            </div>
          </div>
          
          <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            {["info", "activity", "notes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-3 py-1 rounded-md font-semibold capitalize transition-all ${
                  activeTab === tab 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "info" && (
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>jane.doe@acmecorp.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+1 (555) 382-9901</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Acme Corporation (HQ, New York)</span>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-2 text-xs">
              <div className="flex gap-2 text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">10:45 AM:</span>
                <span>Sent introduction email for Enterprise tier.</span>
              </div>
              <div className="flex gap-2 text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">Yesterday:</span>
                <span>Acme Workspace created by invite token.</span>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="text-xs italic text-slate-500 dark:text-slate-400">
              "Looking to transition 45 team members from their legacy spreadsheet to CRM Pro by Q3."
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Lead Tracking Preview
function LeadPreview() {
  const [stage, setStage] = useState("proposal");
  
  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">deals_pipeline_view</span>
        </div>
        <div className={styles.visualContent}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Deal: Acme Expansion</span>
            <span className="text-xs font-extrabold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">$45,000</span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { id: "new", label: "1. New Contact", desc: "Initial qualification session" },
              { id: "qualified", label: "2. Qualified Lead", desc: "Stakeholder alignment verified" },
              { id: "proposal", label: "3. Proposal Sent", desc: "Contract details delivered to VP" },
              { id: "won", label: "4. Deal Won", desc: "Billing & workspace provisioned" }
            ].map((s) => (
              <div
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                  stage === s.id
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-300 dark:border-indigo-800 shadow-sm"
                    : "bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${stage === s.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {s.label}
                  </span>
                  {stage === s.id && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Task Management Preview
function TaskPreview() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review contract agreements", priority: "High", done: true },
    { id: 2, title: "Send workspace invitation link", priority: "High", done: false },
    { id: 3, title: "Schedule onboarding session", priority: "Medium", done: false },
    { id: 4, title: "Update CRM contact details log", priority: "Low", done: true }
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">my_workspace_tasks</span>
        </div>
        <div className={styles.visualContent}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Workspace Tasks</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {tasks.filter(t => !t.done).length} Remaining
            </span>
          </div>

          <div className={styles.mockTasksList}>
            {tasks.map((task) => (
              <div key={task.id} className={styles.mockTaskRow} onClick={() => toggleTask(task.id)}>
                <div className={`${styles.mockCheckbox} ${task.done ? styles.mockCheckboxChecked : ""}`} />
                <span className={`${styles.mockTaskTitle} ${task.done ? styles.mockTaskTitleChecked : ""}`}>
                  {task.title}
                </span>
                <span className={`${styles.mockTaskPriority} ${task.priority === 'High' ? styles.prioHigh : styles.prioMedium}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Employee Management Preview
function EmployeePreview() {
  const employees = [
    { name: "Sarah Connor", email: "sarah@crmpro.com", dept: "Sales", role: "Team Lead", active: true },
    { name: "John Connor", email: "john@crmpro.com", dept: "Customer Success", role: "Member", active: true },
    { name: "Marcus Wright", email: "marcus@crmpro.com", dept: "Ops", role: "Manager", active: false }
  ];

  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">employees_database</span>
        </div>
        <div className={styles.visualContent}>
          <div className={styles.mockUsersList}>
            {employees.map((emp, i) => (
              <div key={i} className={styles.mockUserRow}>
                <div className={styles.mockUserIdentity}>
                  <div className={styles.mockAvatar}>
                    {emp.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className={styles.mockUserName}>{emp.name}</div>
                    <div className="text-[9px] text-slate-400">{emp.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {emp.dept}
                  </span>
                  <span className={styles.mockUserRole}>{emp.role}</span>
                  <span className={`w-2 h-2 rounded-full ${emp.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Workspace Management Preview
function WorkspacePreview() {
  const [activeWS, setActiveWS] = useState("Vercel");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">workspace_switcher.sh</span>
        </div>
        <div className={styles.visualContent}>
          <div className="relative">
            <div 
              className={styles.mockWorkspaceBox} 
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className={styles.mockWorkspaceLeft}>
                <div className={styles.mockWorkspaceIcon}>
                  {activeWS[0]}
                </div>
                <span className={styles.mockWorkspaceName}>{activeWS} Workspace</span>
              </div>
              <ChevronDown className={styles.mockWorkspaceChevron} />
            </div>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden">
                {["Vercel", "Acme", "Stripe"].map((ws) => (
                  <div
                    key={ws}
                    className="p-3 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setActiveWS(ws);
                      setIsOpen(false);
                    }}
                  >
                    <span>{ws} Workspace</span>
                    {activeWS === ws && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-dashed border-slate-100 dark:border-slate-800 rounded-xl p-4 text-center mt-2">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">MEMBERS REGISTERED</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {activeWS === "Vercel" ? 18 : activeWS === "Acme" ? 6 : 12} Employees
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Analytics Dashboard Preview
function AnalyticsPreview() {
  const [data, setData] = useState([60, 45, 90, 75, 110]);

  useEffect(() => {
    const timer = setInterval(() => {
      setData(data.map(() => Math.floor(Math.random() * 80) + 40));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">analytics_realtime</span>
        </div>
        <div className={styles.visualContent}>
          <div className={styles.mockChartGrid}>
            <div className={styles.mockStatMiniCard}>
              <div className={styles.mockMiniLabel}>Wins</div>
              <div className={styles.mockMiniVal}>482</div>
            </div>
            <div className={styles.mockStatMiniCard}>
              <div className={styles.mockMiniLabel}>Rate</div>
              <div className={styles.mockMiniVal}>74.2%</div>
            </div>
            <div className={styles.mockStatMiniCard}>
              <div className={styles.mockMiniLabel}>Pipeline</div>
              <div className={styles.mockMiniVal}>$240K</div>
            </div>
          </div>

          <div className={styles.mockChartBarArea}>
            {data.map((h, i) => (
              <div
                key={i}
                className={styles.mockChartBar}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. Activity Timeline Preview
function TimelinePreview() {
  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">activity_stream_logs</span>
        </div>
        <div className={styles.visualContent}>
          <div className={styles.mockTimeline}>
            {[
              { time: "10:14 AM", title: "Deal Closed (Won)", desc: "Marcus changed Acme deal status to Won", color: "bg-emerald-500" },
              { time: "Yesterday", title: "Task Completed", desc: "Sarah checked off 'Deliver legal proposal'", color: "bg-indigo-500" },
              { time: "2 days ago", title: "New Lead Created", desc: "Clerk User John created lead entry Acme Corporation", color: "bg-blue-500" }
            ].map((t, idx) => (
              <div key={idx} className={styles.mockTimelineItem}>
                <div className={styles.mockTimelineNode} style={{ backgroundColor: t.color === "bg-emerald-500" ? "#10B981" : t.color === "bg-indigo-500" ? "#6366F1" : "#3B82F6" }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={styles.mockTimelineTitle}>{t.title}</span>
                    <span className="text-[9px] text-slate-400">{t.time}</span>
                  </div>
                  <p className={styles.mockTimelineDesc}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. Notifications Preview
function NotificationsPreview() {
  const [notifs, setNotifs] = useState([
    { title: "Task assigned by Sarah Connor", time: "Just now", read: false },
    { title: "Workspace Acme invite accepted by John Doe", time: "15 min ago", read: false },
    { title: "Lead transition: New Lead -> Contacted", time: "1 hr ago", read: true }
  ]);

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">in_app_notifications</span>
        </div>
        <div className={styles.visualContent}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Hub</span>
            <button onClick={markAllRead} className="text-[10px] text-indigo-500 font-bold hover:underline">
              Mark all as read
            </button>
          </div>

          <div className={styles.mockNotificationList}>
            {notifs.map((n, i) => (
              <div key={i} className={styles.mockNotificationItem}>
                {!n.read && <div className={styles.mockNotifDot} />}
                <div className={styles.mockNotifText}>
                  <div>{n.title}</div>
                  <div className={styles.mockNotifTime}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. Role Management Preview
function RolesPreview() {
  const [selectedRole, setSelectedRole] = useState("Manager");

  return (
    <div className={styles.visualContainer}>
      <div className={styles.visualWindow}>
        <div className={styles.visualHeader}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
          <span className="text-xs font-bold text-slate-400 ml-4 font-mono">rbac_permission_matrix</span>
        </div>
        <div className={styles.visualContent}>
          <div className="flex gap-2 mb-3">
            {["Manager", "Employee"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`text-[10px] px-3 py-1 rounded-md font-bold transition-all ${
                  selectedRole === role
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className={styles.mockRoleGrid}>
            <div className={styles.mockRoleBox}>
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mb-2">Workspace Controls</div>
              <div className={styles.mockPermList}>
                <div className={styles.mockPermItem}>
                  <Check className={styles.mockPermCheck} />
                  <span>Invite employees</span>
                </div>
                <div className={styles.mockPermItem}>
                  <Check className={styles.mockPermCheck} />
                  <span>Edit settings</span>
                </div>
              </div>
            </div>

            <div className={styles.mockRoleBox}>
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mb-2">Data Operations</div>
              <div className={styles.mockPermList}>
                <div className={styles.mockPermItem}>
                  <Check className={styles.mockPermCheck} />
                  <span>Update leads/deals</span>
                </div>
                <div className={styles.mockPermItem}>
                  {selectedRole === "Manager" ? (
                    <Check className={styles.mockPermCheck} />
                  ) : (
                    <span className="w-2.5 h-2.5 border border-slate-300 dark:border-slate-700 rounded-sm flex-shrink-0" />
                  )}
                  <span>Manage employees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Configuration for showcases
const SHOWCASES = [
  {
    id: "customers",
    label: "Customers",
    title: "Centralized Customer Directory",
    desc: "Maintain a complete repository of your business associations, contact information, history logs, and current statuses. Eliminate fragmented records and ensure total alignment across success teams.",
    checklist: ["Clean profile fields for contact info", "Tabbed details for logs & active tasks", "Fast company association mapping"],
    cta: "Manage Customers",
    preview: <CustomerPreview />
  },
  {
    id: "leads",
    label: "Sales",
    title: "End-to-End Lead Tracking",
    desc: "Qualify prospects, log sources, and coordinate outreach pipelines. Track deal sizes, assigned agents, and status transitions systematically to maximize conversions and avoid cold accounts.",
    checklist: ["Multi-tier qualification logging", "Assigned sales rep ownership details", "Live status updates indicators"],
    cta: "Track Leads",
    preview: <LeadPreview />
  },
  {
    id: "tasks",
    label: "Workspace",
    title: "Actionable Task Management",
    desc: "Assign team checklists directly to leads, companies, and deals. Define priority values from Low to Urgent, set deadlines, and monitor task completion status in real-time.",
    checklist: ["Tasks associated with leads and deals", "Priority levels & dynamic sorting", "Real-time task checkboxes logs"],
    cta: "Assign Tasks",
    preview: <TaskPreview />
  },
  {
    id: "employees",
    label: "Employees",
    title: "Unified Team Management",
    desc: "Coordinate operations by organizing your staff directory into teams and functional departments. Distinguish active employees and assign department leaders to streamline collaboration.",
    checklist: ["Clean organization staff directory", "Track active/inactive employee status", "Pre-assigned department categorization"],
    cta: "Coordinate Teams",
    preview: <EmployeePreview />
  },
  {
    id: "workspace",
    label: "Workspace",
    title: "Isolation and Workspace Switcher",
    desc: "Manage multiple operations under one account. Toggle between workspace spaces in a couple of clicks, preserving distinct databases, memberships, and custom workspace logs.",
    checklist: ["Multi-workspace account sync", "Two-click switcher interface", "Dedicated workspace permissions"],
    cta: "Switch Workspaces",
    preview: <WorkspacePreview />
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "Real-time Revenue Analytics",
    desc: "Monitor pipeline size, won deals, and team success rates on visual dashboard interfaces. Keep a pulse on key sales performance indicators to make data-driven expansion decisions.",
    checklist: ["Wins count and Win-Rate analytics", "Real-time chart bars visual graphs", "Workspace revenue estimation totals"],
    cta: "View Reports",
    preview: <AnalyticsPreview />
  },
  {
    id: "activity",
    label: "Timeline",
    title: "Chronological Activity Timeline",
    desc: "Never miss a beat with an audit trail that logs every action in the CRM. Audit status updates, task completions, and lead creations in a centralized, filterable feed.",
    checklist: ["Granular timeline event logs", "Audit trail for historical alignment", "Department and lead action feeds"],
    cta: "Audit Activity",
    preview: <TimelinePreview />
  },
  {
    id: "notifications",
    label: "Notifications",
    title: "Workspace Notification Hub",
    desc: "Alert team members instantly of critical actions, including new lead assignments, deal wins, or task handoffs. Toggle read/unread marks and keep teams aligned.",
    checklist: ["In-app real-time notification badge", "Mark all as read shortcuts options", "Triggered alerts on task assignment"],
    cta: "Manage Notifications",
    preview: <NotificationsPreview />
  },
  {
    id: "rbac",
    label: "Security",
    title: "Role-Based Access Controls",
    desc: "Guard confidential information. Restrict access to settings, billing configurations, and employee directories by setting granular Admin, Manager, or Employee status tiers.",
    checklist: ["Granular workspace invitation guards", "Secure database schema query locks", "Individual roles verification modules"],
    cta: "Configure Roles",
    preview: <RolesPreview />
  }
];

export function FeatureShowcase() {
  return (
    <section className={styles.showcaseSection}>
      <div className={styles.showcaseHeading}>
        <span className={styles.showcaseLabel}>Deep Showcase</span>
        <h2 className={styles.showcaseHeadingTitle}>Experience the Power of CRM Pro</h2>
        <p className={styles.showcaseHeadingDesc}>
          Explore high-fidelity interactive showcases of each module in action.
        </p>
      </div>

      <div className={styles.showcaseContainer}>
        {SHOWCASES.map((item, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.div 
              key={item.id} 
              className={`${styles.showcaseRow} ${!isEven ? styles.showcaseRowReverse : ""}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Visual Mockup Column */}
              <div className={styles.showcaseVisual}>
                {item.preview}
              </div>

              {/* Content Description Column */}
              <div className={styles.showcaseContent}>
                <span className={styles.showcaseLabel}>{item.label}</span>
                <h3 className={styles.showcaseTitle}>{item.title}</h3>
                <p className={styles.showcaseDesc}>{item.desc}</p>
                
                <ul className={styles.showcaseChecklist}>
                  {item.checklist.map((check, i) => (
                    <li key={i} className={styles.showcaseCheckItem}>
                      <CheckCircle2 className={styles.showcaseCheckIcon} />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>

                <motion.button 
                  className={styles.btnOutlineLarge}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2">
                    {item.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
