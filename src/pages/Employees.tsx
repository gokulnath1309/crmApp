import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/features/auth/UserProvider";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import {
  UserCheck, ToggleLeft, ToggleRight, Plus, Search,
  X, Check, Edit2, Loader2, Mail, Building, ShieldAlert, Clock, Copy, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";


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

export function EmployeesPage() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const users = useQuery(api.users.list);
  const invitations = useQuery(api.workspaceInvitations.listInvitations);
  const metrics = useQuery(api.workspaceInvitations.getInvitationMetrics);
  const allInvitations = [...(invitations || [])].sort((a, b) => (b.sentAt || b.createdAt) - (a.sentAt || a.createdAt));
  const emailSentInvites = invitations?.filter(i => i.status === "email_sent").length || 0;
  const failedInvites = invitations?.filter(i => i.status === "failed" || i.status === "email_failed").length || 0;

  const inviteUserAction = useAction(api.users.inviteUser);
  const cancelInvitationMutation = useMutation(api.users.cancelInvitation);
  const retryInvitationAction = useAction(api.workspaceInvitations.retryInvitationAction);
  const updateUserRoleMutation = useMutation(api.users.updateUserRole);

  const [activeTab, setActiveTab] = useState<"directory" | "access" | "invitations" | "pending" | "failed" | "expired" | "cancelled">("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("Sales");
  const [managerId, setManagerId] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);

  // Quick Create
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

  // Role guard — ProtectedRoute above handles auth; this only checks role.
  if (currentUser && currentUser.role !== "super_admin" && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const isSuperAdmin = currentUser!.role === "super_admin";

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
      toast("success", `Invitation created and email sent to ${name}.`);
      setIsInviteOpen(false);
      resetForm();
      // Switch to pending tab so the new invite is immediately visible
      setActiveTab("pending");
    } catch (err: any) {
      console.error("[InviteUser] Raw technical error:", err);
      const msg: string = err.message || "Failed to invite user.";
      if (msg.toLowerCase().includes("already pending")) {
        toast("error", `Invitation already pending for ${email}. Check the Pending tab or resend the invite.`);
      } else if (msg.toLowerCase().includes("already a member")) {
        toast("error", `${email} is already a member of your company.`);
      } else if (
        msg.toLowerCase().includes("testing") ||
        msg.toLowerCase().includes("sandbox") ||
        msg.toLowerCase().includes("can only send") ||
        msg.toLowerCase().includes("domain") ||
        msg.toLowerCase().includes("not verified")
      ) {
        toast(
          "error",
          `Invitation created but email delivery failed. Resend sandbox restriction: you can only send to your own verified email. Use 'Copy Link' to share the invite manually.`
        );
        setIsInviteOpen(false);
        resetForm();
        setActiveTab("failed");
      } else {
        toast("error", "Unable to send invitation. Please refresh and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (invitationId: string, email: string) => {
    setActionLoadingId(invitationId);
    try {
      await retryInvitationAction({ id: invitationId as any });
      toast("success", `Invitation email resent to ${email}.`);
    } catch (err: any) {
      console.error("[ResendInvite] Raw technical error:", err);
      toast("error", "Failed to resend invitation email.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvite = async (invitationId: string, email: string) => {
    if (!window.confirm(`Cancel the invitation for ${email}?`)) {
      return;
    }
    setActionLoadingId(invitationId);
    try {
      await cancelInvitationMutation({ id: invitationId as any });
      toast("success", `Invitation cancelled for ${email}.`);
    } catch (err: any) {
      toast("error", err.message || "Failed to cancel invitation.");
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
        role: isSuperAdmin ? role : undefined, // only super admin can change role
        department,
        managerId: isSuperAdmin ? (managerId ? (managerId as any) : null) : undefined, // only super admin can change manager
        permissions: isSuperAdmin ? permissions : undefined, // only super admin can change permissions
      });
      toast("success", "Successfully updated employee details.");
      setSelectedUser(null);
    } catch (err: any) {
      toast("error", err.message || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserActiveStatus = async (userToToggle: any) => {
    try {
      await updateUserRoleMutation({
        id: userToToggle._id as any,
        isActive: !userToToggle.isActive,
      });
      toast(
        "success",
        `Successfully toggled active status for ${userToToggle.name}.`
      );
    } catch (err: any) {
      toast("error", err.message || "Failed to toggle status.");
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

  // Scoped user list: admin only sees subordinates, super_admin sees all
  const filteredUsers = (users || []).filter((u: any) => {
    // Search filter
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (isSuperAdmin) return true;
    
    // Admin only sees subordinates
    return u.managerId === currentUser!._id || u._id === currentUser!._id;
  });

  // Calculate local user counts
  const totalCount = filteredUsers.length;
  const deactivatedCount = filteredUsers.filter((u) => u?.isActive === false).length;

  // Potential managers list (super admins and admins)
  const managerOptions = (users || []).filter((u: any) => u.role === "super_admin" || u.role === "admin");

  return (
    <div className="space-y-6 max-w-7xl pb-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Employees & Access Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage user roles, organizational structure, deactivations, and permissions.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => { resetForm(); setIsInviteOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Invite Employee
          </button>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Members", value: metrics?.activeEmployees ?? totalCount - deactivatedCount, icon: UserCheck, bg: "bg-emerald-500" },
          { label: "Pending Invites", value: (metrics?.pendingInvites ?? 0) + emailSentInvites, icon: Mail, bg: "bg-indigo-500" },
          { label: "Failed Invites", value: failedInvites, icon: ShieldAlert, bg: "bg-red-500" },
          { label: "Expired Invites", value: metrics?.expiredInvites ?? 0, icon: Clock, bg: "bg-slate-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 leading-none">{stat.value}</h3>
            </div>
            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-1">
        <div className="flex flex-wrap gap-1">
          {[
            { id: "directory", label: "Team Directory" },
            { id: "access", label: "Access Settings" },
            { id: "invitations", label: `Invitations (${allInvitations.length})` },
            { id: "pending", label: `Pending (${metrics?.pendingInvites ?? 0})` },
            { id: "failed", label: `Failed (${failedInvites})` },
            { id: "expired", label: `Expired (${metrics?.expiredInvites ?? 0})` },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-100 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or dept..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700/80 rounded-xl outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Directory Grid View */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              No employees match your search criteria.
            </div>
          ) : (
            filteredUsers.map((u: any) => {
              const manager = users?.find((m: any) => m._id === u.managerId);
              return (
                <div
                  key={u._id}
                  className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                    u.isActive === false
                      ? "border-red-100 dark:border-red-950/20 opacity-75"
                      : "border-slate-100 dark:border-slate-700/60 hover:border-slate-205 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                          {u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5 leading-snug">
                            {u.name}
                            {u.isActive === false && (
                              <span className="text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-955/30 dark:text-red-400 px-1.5 py-0.5 rounded-md uppercase">Deactive</span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-455 dark:text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 flex-shrink-0" /> {u.email}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg tracking-wider ${
                        u.role === "super_admin"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : u.role === "admin"
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                          : "bg-slate-100 text-slate-650 dark:bg-slate-700 dark:text-slate-350"
                      }`}>
                        {u.role === "super_admin" ? "Owner" : u.role === "admin" ? "Admin" : "Rep"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 dark:border-slate-700/40 pt-3">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Department</span>
                        <span className="font-medium text-slate-750 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {u.department || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Reports To</span>
                        <span className="font-medium text-slate-750 dark:text-slate-300 mt-0.5 truncate block">
                          {manager ? manager.name : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/40 pt-3.5 mt-4">
                    <span className="text-[10px] text-slate-400">
                      {u.lastLogin ? `Last Login: ${new Date(u.lastLogin).toLocaleDateString()}` : "Never logged in"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(u)}
                        title="Edit employee details"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Allow deactivation for subordinates (admins) and all except self (super admins) */}
                      {((isSuperAdmin && u._id !== currentUser!._id) || (currentUser!.role === "admin" && u.managerId === currentUser!._id)) && (
                        <button
                          onClick={() => toggleUserActiveStatus(u)}
                          title={u.isActive !== false ? "Deactivate employee" : "Activate employee"}
                          className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer ${
                            u.isActive !== false ? "text-emerald-500 hover:text-red-500" : "text-slate-400 hover:text-emerald-500"
                          }`}
                        >
                          {u.isActive !== false ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Access Settings Table View */}
      {activeTab === "access" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-slate-900 dark:text-white">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Custom Permissions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-750/30 text-xs">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-450 mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-medium capitalize">{u.role}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{u.department || "—"}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450"
                        : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${u.isActive !== false ? "bg-emerald-500" : "bg-red-500"}`} />
                      {u.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {u.role === "super_admin" ? (
                      <span className="text-slate-400 italic text-[10px]">All Permissions (Root)</span>
                    ) : (u.permissions || []).length === 0 ? (
                      <span className="text-slate-400 italic text-[10px]">None (Role Defaults)</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(u.permissions || []).map((perm: string) => (
                          <span key={perm} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-650 dark:text-slate-300 rounded text-[9px] font-medium font-sans">
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-205 dark:border-slate-600 text-slate-775 dark:text-slate-200 font-semibold rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        Edit Access
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations Management Table */}
      {activeTab === "invitations" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-slate-900 dark:text-white">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Invited By</th>
                <th className="px-5 py-4">Invited At</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-750/30 text-xs">
              {allInvitations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No invitations found.
                  </td>
                </tr>
              ) : (
                allInvitations.map((inv) => {
                  const inviter = users?.find((u: any) => u._id === inv.invitedBy);
                  const statusLabel = inv.status === "email_sent" ? "Email Sent" :
                    inv.status === "email_failed" ? "Email Failed" :
                    inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
                  const statusColor = inv.status === "email_sent" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450" :
                    inv.status === "email_failed" || inv.status === "failed" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450" :
                    inv.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    inv.status === "accepted" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450" :
                    inv.status === "expired" ? "bg-slate-100 text-slate-650 dark:bg-slate-700 dark:text-slate-350" :
                    "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400";
                  const isRetryable = ["email_failed", "failed", "expired"].includes(inv.status) ||
                    ((inv.status === "pending" || inv.status === "email_sent") && inv.expiresAt < Date.now());
                  const isCancellable = ["pending", "email_sent", "email_failed", "failed"].includes(inv.status);
                  const showActions = isRetryable || isCancellable || inv.inviteToken;

                  return (
                    <React.Fragment key={inv._id}>
                      <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                          {inv.name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{inv.email}</td>
                        <td className="px-5 py-3.5 capitalize">{inv.role}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            <span className={`w-1 h-1 rounded-full ${statusColor.includes('emerald') ? 'bg-emerald-500' : statusColor.includes('red') ? 'bg-red-500' : statusColor.includes('amber') ? 'bg-amber-500' : 'bg-slate-500'}`} />
                            {statusLabel}
                          </span>
                          {inv.emailError && (
                            <p className="text-[9px] text-red-500 mt-1 max-w-[200px] truncate" title={inv.emailError}>
                              {inv.emailError}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                          {inviter?.name || "Unknown"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-[10px]">
                          {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {showActions && (
                            <div className="inline-flex items-center gap-1">
                              {isRetryable && (
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleResendInvite(inv._id, inv.email)}
                                  title="Resend invitation"
                                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-55"
                                >
                                  {actionLoadingId === inv._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3 h-3" />
                                  )}
                                  Resend
                                </button>
                              )}
                              {inv.inviteToken && (
                                <button
                                  onClick={() => handleCopyLink(inv.inviteToken!)}
                                  title="Copy invite link"
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-indigo-650 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isCancellable && (
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleCancelInvite(inv._id, inv.email)}
                                  title="Cancel invitation"
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-55"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Development Diagnostics Panel */}
                      <tr>
                        <td colSpan={7} className="px-5 py-3 bg-slate-900/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/50">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-350">Original Send: </span>
                              <span>{inv.sentAt ? new Date(inv.sentAt).toLocaleString() : new Date(inv.createdAt).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-350">Last Resend: </span>
                              <span>{inv.resentAt ? new Date(inv.resentAt).toLocaleString() : "—"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-350">Last Message ID: </span>
                              <code className="text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">{inv.messageId || "—"}</code>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-350">SMTP Response: </span>
                              <span className="italic text-slate-605 dark:text-slate-300">{inv.smtpResponse || "—"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-350">Delivery Status: </span>
                              <span className={`font-semibold capitalize ${inv.lastDeliveryStatus === "sent" ? "text-emerald-500 font-bold" : inv.lastDeliveryStatus === "failed" ? "text-red-500 font-bold" : "text-slate-400"}`}>
                                {inv.lastDeliveryStatus || "unknown"}
                              </span>
                              {inv.lastDeliveryError && (
                                <span className="text-red-400 ml-1">({inv.lastDeliveryError})</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending / Sent Tab */}
      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!invitations || invitations.filter(i => i.status === "pending" || i.status === "email_sent").length === 0) ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl">
              No pending invitations.
            </div>
          ) : (
            invitations
              .filter(i => i.status === "pending" || i.status === "email_sent")
              .map((inv) => {
                const manager = users?.find((m: any) => m._id === inv.managerId);
                const daysRemaining = Math.max(0, Math.ceil((inv.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
                const isEmailSent = inv.status === "email_sent";
                return (
                  <div
                    key={inv._id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-955/30 text-indigo-650 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {inv.name || "Unnamed"}
                            </h4>
                            <p className="text-xs text-slate-450 dark:text-slate-500 truncate mt-0.5">
                              {inv.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isEmailSent ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                              ✓ Email Sent
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 dark:border-slate-700/40 pt-3">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Role / Dept</span>
                          <span className="font-medium text-slate-750 dark:text-slate-350 mt-0.5 truncate block">
                            {inv.role} / {inv.department || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Reports To</span>
                          <span className="font-medium text-slate-750 dark:text-slate-350 mt-0.5 truncate block">
                            {manager ? manager.name : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Development Diagnostics Panel */}
                      <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/40 text-[9px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl text-left">
                        <div>
                          <span className="font-semibold text-slate-750 dark:text-slate-350">Original Send: </span>
                          <span>{inv.sentAt ? new Date(inv.sentAt).toLocaleString() : new Date(inv.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-750 dark:text-slate-350">Last Resend: </span>
                          <span>{inv.resentAt ? new Date(inv.resentAt).toLocaleString() : "—"}</span>
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-750 dark:text-slate-350">Message ID: </span>
                          <code className="text-slate-650 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1 py-0.25 rounded">{inv.messageId || "—"}</code>
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-750 dark:text-slate-350">SMTP Response: </span>
                          <span className="italic text-slate-605 dark:text-slate-300">{inv.smtpResponse || "—"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-750 dark:text-slate-350">Delivery Status: </span>
                          <span className={`font-semibold capitalize ${inv.lastDeliveryStatus === "sent" ? "text-emerald-500 font-bold" : inv.lastDeliveryStatus === "failed" ? "text-red-500 font-bold" : "text-slate-400"}`}>
                            {inv.lastDeliveryStatus || "unknown"}
                          </span>
                          {inv.lastDeliveryError && (
                            <span className="text-red-400 ml-1">({inv.lastDeliveryError})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/40 pt-3.5 mt-4">
                      <span className="text-[10px] text-amber-650 dark:text-amber-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {daysRemaining > 0 ? `Expires in ${daysRemaining} days` : "Expires today"}
                      </span>
                      <div className="flex items-center gap-1">
                        {inv.inviteToken && (
                          <button
                            onClick={() => handleCopyLink(inv.inviteToken!)}
                            title="Copy invite link"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-indigo-650 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isEmailSent && (
                          <button
                            disabled={actionLoadingId !== null}
                            onClick={() => handleResendInvite(inv._id, inv.email)}
                            title="Send email"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-55"
                          >
                            {actionLoadingId === inv._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleCancelInvite(inv._id, inv.email)}
                          title="Revoke invitation"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-55"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Failed Tab */}
      {activeTab === "failed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!invitations || invitations.filter(i => i.status === "failed" || i.status === "email_failed").length === 0) ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl">
              No failed invitations.
            </div>
          ) : (
            invitations
              .filter(i => i.status === "failed" || i.status === "email_failed")
              .map((inv) => {
                return (
                  <div
                    key={inv._id}
                    className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-955/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-red-200 dark:hover:border-red-900/30 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-400 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {inv.name || "Unnamed"}
                            </h4>
                            <p className="text-xs text-slate-450 dark:text-slate-500 truncate mt-0.5">
                              {inv.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-955/30 dark:text-red-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          Failed
                        </span>
                      </div>

                      <div className="bg-red-50/50 dark:bg-red-955/10 border border-red-100/50 dark:border-red-900/20 rounded-xl p-3">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Error Reason</span>
                        <p className="text-[11px] text-red-650 dark:text-red-300 mt-1 leading-normal font-sans break-words">
                          {inv.emailError || "Unknown email delivery failure."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/40 pt-3.5 mt-4">
                      <span className="text-[10px] text-slate-400">
                        Failed: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleResendInvite(inv._id, inv.email)}
                          title="Retry sending invitation"
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-55 shadow-xs"
                        >
                          {actionLoadingId === inv._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Retry Invite
                        </button>
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleCancelInvite(inv._id, inv.email)}
                          title="Revoke invitation"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-55"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Expired Tab */}
      {activeTab === "expired" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!invitations || invitations.filter(i => i.status === "expired").length === 0) ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl">
              No expired invitations.
            </div>
          ) : (
            invitations
              .filter(i => i.status === "expired")
              .map((inv) => {
                return (
                  <div
                    key={inv._id}
                    className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/50 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-205 dark:hover:border-slate-600 transition-all opacity-85"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-450 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {inv.name || "Unnamed"}
                            </h4>
                            <p className="text-xs text-slate-450 dark:text-slate-500 truncate mt-0.5">
                              {inv.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-650 dark:bg-slate-900 dark:text-slate-450 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          Expired
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 dark:border-slate-700/40 pt-3">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Role / Dept</span>
                          <span className="font-medium text-slate-750 dark:text-slate-350 mt-0.5 truncate block">
                            {inv.role} / {inv.department || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Expired At</span>
                          <span className="font-medium text-slate-750 dark:text-slate-350 mt-0.5 truncate block">
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/40 pt-3.5 mt-4">
                      <span className="text-[10px] text-slate-400">
                        Sent: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleResendInvite(inv._id, inv.email)}
                          title="Resend invitation email"
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-55 shadow-xs"
                        >
                          {actionLoadingId === inv._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Re-invite
                        </button>
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleCancelInvite(inv._id, inv.email)}
                          title="Revoke invitation"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-455 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-55"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Cancelled Tab */}
      {activeTab === "cancelled" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(!invitations || invitations.filter(i => i.status === "revoked").length === 0) ? (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl">
              No cancelled invitations.
            </div>
          ) : (
            invitations
              .filter(i => i.status === "revoked")
              .map((inv) => {
                return (
                  <div
                    key={inv._id}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750/30 rounded-2xl p-5 shadow-xs flex flex-col justify-between opacity-75"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                            <X className="w-5 h-5 text-slate-450" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {inv.name || "Unnamed"}
                            </h4>
                            <p className="text-xs text-slate-450 dark:text-slate-500 truncate mt-0.5">
                              {inv.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-450 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          Cancelled
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 dark:border-slate-700/40 pt-3">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Role / Dept</span>
                          <span className="font-medium text-slate-750 dark:text-slate-350 mt-0.5 truncate block">
                            {inv.role} / {inv.department || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Cancelled On</span>
                          <span className="font-medium text-slate-750 dark:text-slate-350 mt-0.5 truncate block">
                            {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

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
                <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
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
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full h-10 px-3.5 border border-slate-205 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="employee">Employee (Sales Rep)</option>
                      <option value="admin">Admin (Manager)</option>
                      <option value="super_admin">Super Admin (Owner)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    >
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Assigned Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">No Manager (Reporting Line Ends)</option>
                    {managerOptions.map((m: any) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 border-t border-slate-50 dark:border-slate-700/50 pt-3 mt-4">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Custom Permissions Overrides</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {permissionOptions.map((opt) => (
                      <label key={opt.value} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
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
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 leading-tight">{opt.label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 leading-snug">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 mt-6 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-slate-205 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4.5 h-4.5" />} Send Invite
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
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Employee Access: {selectedUser.name}</h3>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">System Role</label>
                    <select
                      value={role}
                      disabled={!isSuperAdmin}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-10 px-3.5 border border-slate-205 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white disabled:opacity-60"
                    >
                      <option value="employee">Employee (Sales Rep)</option>
                      <option value="admin">Admin (Manager)</option>
                      <option value="super_admin">Super Admin (Owner)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-10 px-3.5 border border-slate-205 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    >
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Assigned Manager</label>
                    <select
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-55/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">No Manager (Reporting Line Ends)</option>
                      {managerOptions
                        .filter((opt: any) => opt._id !== selectedUser._id) // cannot report to self
                        .map((m: any) => (
                          <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                        ))}
                    </select>
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="space-y-2 border-t border-slate-50 dark:border-slate-700/50 pt-3 mt-4">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Custom Permissions Overrides</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {permissionOptions.map((opt) => (
                        <label key={opt.value} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
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
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 leading-tight">{opt.label}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 leading-snug">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {!isSuperAdmin && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-xl mt-4">
                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                      As an Admin, you are only authorized to change this employee's department or toggle deactivation status. Changes to Roles, Managers, and Custom Permissions can only be applied by a Super Admin.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-4 mt-6 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 border border-slate-205 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4.5 h-4.5" />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
