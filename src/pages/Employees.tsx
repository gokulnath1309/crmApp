import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { EmployeeRow } from "@/components/teams/EmployeeRow";
import {
  UserCheck, Plus, Search, X, Check, Loader2, Mail,
  ShieldAlert, Clock, Copy, RefreshCw, Inbox, Users, UserPlus,
  AlertCircle, Ban, Info, Send, Link, Trash2, Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageLayout } from "@/components/PageLayout";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/Select";

const departmentOptions = ["Sales", "Marketing", "Customer Success", "Support", "Product", "Finance", "HR"];
const permissionOptions = [
  { value: "canInviteUsers", label: "Invite Employees", desc: "Allows inviting new team members to the workspace" },
  { value: "canManageEmployees", label: "Manage Employees", desc: "Allows viewing, updating roles, or deactivating team members" },
  { value: "canAssignLeads", label: "Assign Leads", desc: "Allows assigning/reallocating leads to team members" },
  { value: "canAssignDeals", label: "Assign Deals", desc: "Allows allocating deals to sales reps" },
  { value: "canAssignTasks", label: "Assign Tasks", desc: "Allows assigning daily tasks to employees" },
  { value: "canCreateLeads", label: "Create Leads", desc: "Allows creating new sales leads" },
  { value: "canCreateContacts", label: "Create Contacts", desc: "Allows creating new business contacts" },
  { value: "canCreateDeals", label: "Create Deals", desc: "Allows creating new sales deals" },
  { value: "canViewAllData", label: "View All Company Data", desc: "Allows viewing all CRM data in the company" },
  { value: "canManageSettings", label: "Configure CRM Settings", desc: "Allows managing CRM parameters and stages" },
];

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  email_sent: { label: "Pending", bg: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  email_failed: { label: "Failed", bg: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400", dot: "bg-red-500" },
  failed: { label: "Failed", bg: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400", dot: "bg-red-500" },
  accepted: { label: "Accepted", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400", dot: "bg-emerald-500" },
  expired: { label: "Expired", bg: "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400", dot: "bg-orange-500" },
  revoked: { label: "Revoked", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
};

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "super_admin", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "employee", label: "Employee" },
];

type TabId = "members" | "pending" | "archived";

export function EmployeesPage() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const users = useQuery(api.users.list);
  const invitations = useQuery(api.workspaceInvitations.listInvitations);
  const metrics = useQuery(api.workspaceInvitations.getInvitationMetrics);

  const inviteUserAction = useAction(api.users.inviteUser);
  const cancelInvitationMutation = useMutation(api.users.cancelInvitation);
  const retryInvitationAction = useAction(api.workspaceInvitations.retryInvitationAction);
  const updateUserRoleMutation = useMutation(api.users.updateUserRole);
  const clearArchivedMutation = useMutation(api.workspaceInvitations.clearArchived);

  const [activeTab, setActiveTab] = useState<TabId>("members");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<any | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deactivateConfirmUser, setDeactivateConfirmUser] = useState<any | null>(null);

  useEffect(() => {
    if (deactivateConfirmUser) {
      console.log("[Deactivate] Confirming deactivation for:", deactivateConfirmUser.name);
    }
  }, [deactivateConfirmUser]);
  const [isClearing, setIsClearing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("Sales");
  const [managerId, setManagerId] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      resetForm();
      setIsInviteOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (currentUser && currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const isSuperAdmin = currentUser!.role === "super_admin";

  const allInvitations = [...(invitations || [])].sort(
    (a, b) => (b.sentAt || b.createdAt) - (a.sentAt || a.createdAt)
  );
  const emailSentInvites = invitations?.filter(i => i.status === "email_sent").length || 0;
  const failedInvites = invitations?.filter(i => i.status === "failed" || i.status === "email_failed").length || 0;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast("error", "Name and Email are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      await inviteUserAction({
        email: email.trim(),
        name: name.trim(),
        role,
        department,
        managerId: managerId ? (managerId as any) : undefined,
        permissions,
        token,
      });
      toast("success", `Invitation sent to ${name}.`);
      setIsInviteOpen(false);
      resetForm();
      setActiveTab("pending");
    } catch (err: any) {
      console.error("[InviteUser]", err);
      const msg: string = err.message || "";
      if (msg.toLowerCase().includes("already pending")) {
        toast("error", `Invitation already pending for ${email}.`);
      } else if (msg.toLowerCase().includes("already a member")) {
        toast("error", `${email} is already a member.`);
      } else if (
        msg.toLowerCase().includes("testing") ||
        msg.toLowerCase().includes("sandbox") ||
        msg.toLowerCase().includes("domain") ||
        msg.toLowerCase().includes("not verified")
      ) {
        toast("error", "Invitation created but email could not be delivered due to sandbox restrictions. Use 'Copy Link' to share manually.");
        setIsInviteOpen(false);
        resetForm();
        setActiveTab("pending");
      } else {
        toast("error", "Unable to send invitation. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (invitationId: string, _email: string) => {
    setActionLoadingId(invitationId);
    try {
      await retryInvitationAction({ id: invitationId as any });
      toast("success", `Invitation resent to ${_email}.`);
    } catch (_err: any) {
      console.error("[ResendInvite]", _err);
      toast("error", "Failed to resend invitation. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvite = async (invitationId: string, _email: string) => {
    if (!window.confirm(`Cancel invitation for ${_email}?`)) return;
    setActionLoadingId(invitationId);
    try {
      await cancelInvitationMutation({ id: invitationId as any });
      toast("success", `Invitation cancelled for ${_email}.`);
    } catch (_err: any) {
      console.error("[CancelInvite]", _err);
      toast("error", "Failed to cancel invitation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast("success", "Invitation link copied to clipboard.");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await updateUserRoleMutation({
        id: selectedUser._id,
        role: isSuperAdmin ? role : undefined,
        department,
        managerId: isSuperAdmin ? (managerId ? (managerId as any) : null) : undefined,
        permissions: isSuperAdmin ? permissions : undefined,
      });
      toast("success", "Employee details updated.");
      setSelectedUser(null);
    } catch (_err: any) {
      console.error("[EditUser]", _err);
      toast("error", "Failed to update employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const performToggleActive = async (userToToggle: any) => {
    try {
      await updateUserRoleMutation({
        id: userToToggle._id as any,
        isActive: !userToToggle.isActive,
      });
      toast("success", `Status updated for ${userToToggle.name}.`);
    } catch (_err: any) {
      console.error("[ToggleUser]", _err);
      toast("error", "Failed to update status.");
    }
  };

  const toggleUserActiveStatus = async (userToToggle: any) => {
    if (userToToggle.isActive !== false) {
      setDeactivateConfirmUser(userToToggle);
    } else {
      await performToggleActive(userToToggle);
    }
  };

  const handleUpdateRole = async (userToUpdate: any, newRole: string) => {
    try {
      await updateUserRoleMutation({
        id: userToUpdate._id as any,
        role: newRole,
      });
      toast("success", `Role updated to ${newRole === "super_admin" ? "Owner" : newRole.charAt(0).toUpperCase() + newRole.slice(1)} for ${userToUpdate.name}.`);
    } catch (_err: any) {
      console.error("[UpdateRole]", _err);
      toast("error", "Failed to update role.");
    }
  };

  const handleClearArchive = async () => {
    setIsClearing(true);
    try {
      await clearArchivedMutation();
      toast("success", "Archive cleared successfully.");
      setShowClearConfirm(false);
    } catch (_err: any) {
      console.error("[ClearArchive]", _err);
      toast("error", "Unable to clear archive. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setName("");
    setRole("employee");
    setDepartment("Sales");
    setManagerId("");
    setPermissions([]);
  };

  const startEdit = (userToEdit: any) => {
    setSelectedUser(userToEdit);
    setRole(userToEdit.role);
    setDepartment(userToEdit.department || "Sales");
    setManagerId(userToEdit.managerId || "");
    setPermissions(userToEdit.permissions || []);
  };

  const filteredUsers = (users || []).filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (isSuperAdmin) return true;
    return u.managerId === currentUser!._id || u._id === currentUser!._id;
  });

  const totalCount = filteredUsers.length;
  const deactivatedCount = filteredUsers.filter((u: any) => u?.isActive === false).length;
  const managerOptions = (users || []).filter((u: any) => u.role === "super_admin" || u.role === "admin");

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "email_failed", label: "Failed" },
    { value: "accepted", label: "Accepted" },
    { value: "expired", label: "Expired" },
    { value: "revoked", label: "Revoked" },
  ];

  const roleFormOptions = [
    { value: "employee", label: "Employee" },
    { value: "admin", label: "Admin" },
    { value: "super_admin", label: "Owner" },
  ];

  const departmentFormOptions = departmentOptions.map(dept => ({ value: dept, label: dept }));

  const managerFormOptions = [
    { value: "", label: "No Manager" },
    ...(managerOptions?.map((m: any) => ({ value: m._id, label: m.name })) ?? [])
  ];

  const editManagerFormOptions = selectedUser
    ? [
        { value: "", label: "No Manager" },
        ...managerOptions
          .filter((opt: any) => opt._id !== selectedUser._id)
          .map((m: any) => ({ value: m._id, label: `${m.name} (${m.role})` }))
      ]
    : [];

  const pendingInvitations = allInvitations.filter((inv: any) =>
    ["pending", "email_sent", "email_failed", "failed"].includes(inv.status)
  );
  const archivedInvitations = allInvitations.filter((inv: any) =>
    ["expired", "revoked"].includes(inv.status)
  );

  const filteredPending = pendingInvitations.filter((inv: any) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (roleFilter && inv.role !== roleFilter) return false;
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      inv.name?.toLowerCase().includes(q) ||
      inv.email?.toLowerCase().includes(q) ||
      inv.role?.toLowerCase().includes(q)
    );
  });

  const filteredArchived = archivedInvitations.filter((inv: any) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (roleFilter && inv.role !== roleFilter) return false;
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      inv.name?.toLowerCase().includes(q) ||
      inv.email?.toLowerCase().includes(q) ||
      inv.role?.toLowerCase().includes(q)
    );
  });

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "members", label: "Members", count: filteredUsers.length },
    { id: "pending", label: "Pending", count: filteredPending.length },
    { id: "archived", label: "Archived", count: filteredArchived.length },
  ];

  const renderStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.pending;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", cfg.bg)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
        {cfg.label}
      </span>
    );
  };

  const renderUserCard = (u: any) => (
    <EmployeeRow
      key={u._id}
      user={u}
      currentUserId={currentUser!._id}
      currentUserRole={currentUser!.role}
      onEdit={startEdit}
      onToggleActive={toggleUserActiveStatus}
      onUpdateRole={handleUpdateRole}
    />
  );

  const renderInvitationCard = (inv: any, isArchived: boolean) => {
    const sentDate = inv.sentAt || inv.createdAt;
    const timeAgo = sentDate ? getTimeAgo(sentDate) : "";
    const isRetryable = ["email_failed", "failed", "expired"].includes(inv.status) ||
      ((inv.status === "pending" || inv.status === "email_sent") && inv.expiresAt < Date.now());
    const isCancellable = ["pending", "email_sent", "email_failed", "failed"].includes(inv.status);

    return (
      <div
        key={inv._id}
        className={cn(
          "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-800",
          isArchived
            ? "border-slate-100 dark:border-slate-700/40 opacity-70"
            : inv.status === "failed" || inv.status === "email_failed"
              ? "border-red-100 dark:border-red-950/20 hover:border-red-200 dark:hover:border-red-900/30 shadow-sm"
              : "border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 shadow-sm",
          inv.status === "failed" || inv.status === "email_failed"
            ? "bg-red-50 dark:bg-red-950/20 text-red-500"
            : inv.status === "expired"
              ? "bg-orange-50 dark:bg-orange-950/20 text-orange-500"
              : inv.status === "revoked"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                : "bg-amber-50 dark:bg-amber-950/20 text-amber-500"
        )}>
          {inv.status === "failed" || inv.status === "email_failed" ? (
            <AlertCircle className="w-5 h-5" />
          ) : inv.status === "expired" ? (
            <Clock className="w-5 h-5" />
          ) : inv.status === "revoked" ? (
            <Ban className="w-5 h-5" />
          ) : (
            <Mail className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-1 sm:gap-y-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {inv.name || "Unnamed"}
              </span>
              {renderStatusBadge(inv.status)}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {inv.email} · {inv.role} · {timeAgo}
            </p>
          </div>
          {!isArchived && (
            <div className="flex items-center gap-1">
              {isRetryable && (
                <button
                  disabled={actionLoadingId !== null}
                  onClick={() => handleResendInvite(inv._id, inv.email)}
                  className="flex items-center gap-1.5 px-3.5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === inv._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Retry
                </button>
              )}
              {inv.inviteToken && (
                <button
                  onClick={() => handleCopyLink(inv.inviteToken)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Copy invite link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              {isCancellable && (
                <button
                  disabled={actionLoadingId !== null}
                  onClick={() => handleCancelInvite(inv._id, inv.email)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                  title="Cancel invitation"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setSelectedInvitation(inv)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Details</span>
          </button>
        </div>
      </div>
    );
  };

  const renderEmpty = (icon: any, title: string, description: string, action?: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );

  const getTimeAgo = (epoch: number) => {
    const diff = Date.now() - epoch;
    if (diff < 60000) return "Just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const tabsContent = {
    members: (
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          renderEmpty(
            <Users className="w-7 h-7 text-slate-400" />,
            "No employees yet",
            "Invite your first employee to start collaborating.",
            isSuperAdmin ? (
              <button
                onClick={() => { resetForm(); setIsInviteOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Invite Employee
              </button>
            ) : undefined
          )
        ) : (
          filteredUsers.map(renderUserCard)
        )}
      </div>
    ),

    pending: (
      <div className="space-y-4">
        {filteredPending.length === 0 ? (
          renderEmpty(
            <Inbox className="w-7 h-7 text-slate-400" />,
            searchTerm || statusFilter || roleFilter ? "No matching invitations" : "No pending invitations",
            searchTerm || statusFilter || roleFilter
              ? "Try adjusting your search or filters."
              : "Invite a new team member to see their invitation here.",
            isSuperAdmin && !searchTerm && !statusFilter && !roleFilter ? (
              <button
                onClick={() => { resetForm(); setIsInviteOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Invite Employee
              </button>
            ) : undefined
          )
        ) : (
          filteredPending.map((inv: any) => renderInvitationCard(inv, false))
        )}
      </div>
    ),

    archived: (
      <div className="space-y-4">
        {filteredArchived.length > 0 && (currentUser?.role === "super_admin" || currentUser?.role === "admin") && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Archive
            </button>
          </div>
        )}
        {filteredArchived.length === 0 ? (
          renderEmpty(
            <Archive className="w-7 h-7 text-slate-400" />,
            "No archived invitations",
            "Archived invitations will appear here."
          )
        ) : (
          filteredArchived.map((inv: any) => renderInvitationCard(inv, true))
        )}
      </div>
    ),
  };

  return (
    <PageLayout
      title="Employees"
      subtitle="Invite and manage workspace members."
      actions={
        isSuperAdmin ? (
          <button
            onClick={() => { resetForm(); setIsInviteOpen(true); }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 max-sm:h-12 max-sm:mt-2 max-sm:mb-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" /> Invite Employee
          </button>
        ) : undefined
      }
    >

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-sm:gap-3 [&>*]:h-full mt-2">
        {[
          { label: "Active Members", value: metrics?.activeEmployees ?? totalCount - deactivatedCount, icon: UserCheck, bg: "bg-emerald-500" },
          { label: "Pending Invites", value: (metrics?.pendingInvites ?? 0) + emailSentInvites, icon: Mail, bg: "bg-indigo-500" },
          { label: "Failed Invites", value: failedInvites, icon: ShieldAlert, bg: "bg-red-500" },
          { label: "Expired Invites", value: metrics?.expiredInvites ?? 0, icon: Clock, bg: "bg-slate-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-5 max-sm:p-4 max-sm:min-h-[96px] rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-center gap-4 h-full">
            <div className={`w-11 h-11 max-sm:w-12 max-sm:h-12 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs`}>
              <stat.icon className="w-5 h-5 max-sm:w-6 max-sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs max-sm:text-[14px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider max-sm:whitespace-normal max-sm:overflow-visible max-sm:leading-tight">{stat.label}</p>
              <h3 className="text-2xl max-sm:text-[24px] font-extrabold text-slate-900 dark:text-white leading-none mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search + Filters */}
      <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center border-b border-slate-100 dark:border-slate-700/60 w-full sm:w-auto justify-between sm:justify-start gap-4 sm:gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-3 max-sm:pb-2 text-sm max-sm:text-[15px] font-medium transition-colors duration-200 cursor-pointer flex-1 sm:flex-initial text-center flex justify-center",
                  isActive
                    ? "text-slate-900 dark:text-white font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <span className="relative inline-flex items-center gap-2">
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute -bottom-3 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {activeTab !== "members" && (
          <div className="flex items-center gap-2">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-36"
              triggerClassName="h-9 px-3 text-xs rounded-xl"
            />
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              className="w-36"
              triggerClassName="h-9 px-3 text-xs rounded-xl"
            />
          </div>
        )}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === "members" ? "Search by name, email, or dept..." : "Search by name, email, or role..."}
            className="w-full h-11 max-sm:h-11 pl-10 pr-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Tab Content */}
      {tabsContent[activeTab]}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedInvitation && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setSelectedInvitation(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-100 dark:border-slate-700/60 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Invitation Details</h3>
                <button
                  onClick={() => setSelectedInvitation(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                    selectedInvitation.status === "failed" || selectedInvitation.status === "email_failed"
                      ? "bg-red-50 dark:bg-red-950/20 text-red-500"
                      : selectedInvitation.status === "expired"
                        ? "bg-orange-50 dark:bg-orange-950/20 text-orange-500"
                        : selectedInvitation.status === "revoked"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          : "bg-amber-50 dark:bg-amber-950/20 text-amber-500"
                  )}>
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedInvitation.name || "Unnamed"}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedInvitation.email}</p>
                  </div>
                </div>

                {renderStatusBadge(selectedInvitation.status)}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 capitalize">
                        {selectedInvitation.role}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {selectedInvitation.department || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sent</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {selectedInvitation.sentAt
                          ? new Date(selectedInvitation.sentAt).toLocaleDateString()
                          : new Date(selectedInvitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expires</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {selectedInvitation.expiresAt
                          ? new Date(selectedInvitation.expiresAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Invited By</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {users?.find((u: any) => u._id === selectedInvitation.invitedBy)?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reminders</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {selectedInvitation.reminderCount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5" />
                      Invitation Link
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 truncate">
                        {window.location.origin}/invite/{selectedInvitation.inviteToken || "—"}
                      </code>
                      {selectedInvitation.inviteToken && (
                        <button
                          onClick={() => handleCopyLink(selectedInvitation.inviteToken)}
                          className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                {["email_failed", "failed", "expired"].includes(selectedInvitation.status) && (
                  <button
                    disabled={actionLoadingId !== null}
                    onClick={() => {
                      handleResendInvite(selectedInvitation._id, selectedInvitation.email);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === selectedInvitation._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Retry Invitation
                  </button>
                )}
                {["pending", "email_sent", "email_failed", "failed"].includes(selectedInvitation.status) && (
                  <button
                    disabled={actionLoadingId !== null}
                    onClick={() => {
                      handleCancelInvite(selectedInvitation._id, selectedInvitation.email);
                      setSelectedInvitation(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    Cancel Invitation
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Invite Team Member</h3>
                <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</label>
                    <Select
                      options={roleFormOptions}
                      value={role}
                      onChange={(val) => setRole(val)}
                      triggerClassName="h-10 px-3.5 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</label>
                    <Select
                      options={departmentFormOptions}
                      value={department}
                      onChange={(val) => setDepartment(val)}
                      triggerClassName="h-10 px-3.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Manager</label>
                  <Select
                    options={managerFormOptions}
                    value={managerId}
                    onChange={(val) => setManagerId(val)}
                    triggerClassName="h-10 px-3.5 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-2 border-t border-slate-50 dark:border-slate-700/50 pt-3 mt-4">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Custom Permissions</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {permissionOptions.map((opt) => (
                      <label key={opt.value} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={permissions.includes(opt.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPermissions([...permissions, opt.value]);
                            } else {
                              setPermissions(permissions.filter(p => p !== opt.value));
                            }
                          }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 mt-6 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Access Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Edit Employee: {selectedUser.name}
                </h3>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</label>
                    <Select
                      options={roleFormOptions}
                      value={role}
                      disabled={!isSuperAdmin}
                      onChange={(val) => setRole(val)}
                      triggerClassName="h-10 px-3.5 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</label>
                    <Select
                      options={departmentFormOptions}
                      value={department}
                      onChange={(val) => setDepartment(val)}
                      triggerClassName="h-10 px-3.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Manager</label>
                    <Select
                      options={editManagerFormOptions}
                      value={managerId}
                      onChange={(val) => setManagerId(val)}
                      triggerClassName="h-10 px-3.5 text-xs rounded-xl"
                    />
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="space-y-2 border-t border-slate-50 dark:border-slate-700/50 pt-3 mt-4">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Custom Permissions</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {permissionOptions.map((opt) => (
                        <label key={opt.value} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={permissions.includes(opt.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPermissions([...permissions, opt.value]);
                              } else {
                                setPermissions(permissions.filter(p => p !== opt.value));
                              }
                            }}
                          />
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {!isSuperAdmin && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl mt-4">
                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                      As an Admin, you can only update department or toggle deactivation status. Role, Manager, and Permissions changes require a Super Admin.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-4 mt-6 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Archive Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Clear Archived Invitations?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      This will permanently delete all archived invitation records from this workspace. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearArchive}
                  disabled={isClearing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isClearing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Clear Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deactivate User Confirmation Modal */}
      <AnimatePresence>
        {deactivateConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.55)]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Deactivate {deactivateConfirmUser.name}?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Are you sure you want to deactivate this employee? They will lose access to the CRM and all workspace tools immediately.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setDeactivateConfirmUser(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const user = deactivateConfirmUser;
                    setDeactivateConfirmUser(null);
                    await performToggleActive(user);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Deactivate Employee
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
