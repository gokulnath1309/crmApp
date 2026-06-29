import { useState, useEffect, useRef } from "react";
import { useUser } from "@/features/auth/UserProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Edit2, User, Mail, Phone, Building, Shield, Target, Calendar, Clock,
  CheckCircle, Award, Globe, MapPin, Users, X, Upload, Loader2, Check, ToggleLeft, ToggleRight, Lock, Camera
} from "lucide-react";
import { uploadProfileImage, uploadBannerImage } from "@/lib/imageUpload";

function Chip({ label, v = "neutral" }: { label: string; v?: "neutral" | "green" | "blue" | "orange" | "red" | "purple" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }[v];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles}`}>{label}</span>;
}

export function ProfilePage() {
  const { user } = useUser();
  const isLoading = false;
  const { toast } = useToast();

  const canEditFieldClient = (fieldName: string) => {
    if (!user) return false;
    if (user.role === "super_admin") return true;

    const employeeFields = [
      "name",
      "phone",
      "location",
      "timezone",
      "bio",
      "image",
      "coverImage",
      "avatarUrl"
    ];

    if (user.role === "admin") {
      return [
        ...employeeFields,
        "department",
        "jobTitle",
        "managerId",
        "isActive"
      ].includes(fieldName);
    }

    return employeeFields.includes(fieldName);
  };

  const metrics = useQuery(api.dashboard.getMetrics);
  const allUsers = useQuery(api.users.list);
  const allDeals = useQuery(api.deals.list);
  const allTasksData = useQuery(api.tasks.list, {});
  const allTasks = allTasksData?.tasks;

  // Mutations
  const updateProfileDetailsMutation = useMutation(api.users.updateProfileDetails);
  const updateProfileImageMutation = useMutation(api.users.updateProfileImage);
  const generateProfileUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const updateCoverImageMutation = useMutation(api.users.updateCoverImage);
  const generateBannerUploadUrl = useMutation(api.users.generateBannerUploadUrl);
  const inviteUserAction = useAction(api.users.inviteUser);
  const updateUserRoleMutation = useMutation(api.users.updateUserRole);

  // Pagination for Activities
  const [activityLimit, setActivityLimit] = useState(10);
  const activities = useQuery(api.activities.list, { limit: activityLimit });

  // Modal Open States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("overview");

  // Edit Profile Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTimezone, setEditTimezone] = useState("America/Los_Angeles");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editCompany, setEditCompany] = useState("");

  // Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Cover Image Form State
  const [coverInputUrl, setCoverInputUrl] = useState("");
  const [pendingBannerId, setPendingBannerId] = useState<string | null>(null);

  // Invite User Form State
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteDept, setInviteDept] = useState("Sales");
  const [inviteManagerId, setInviteManagerId] = useState("");

  // Manage Roles Form State
  const [selectedRoleUserId, setSelectedRoleUserId] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("employee");
  const [selectedUserManagerId, setSelectedUserManagerId] = useState("");
  const [selectedUserActive, setSelectedUserActive] = useState(true);

  // Initialize edit states when user changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
      setEditDept(user.department || "");
      setEditJobTitle(user.jobTitle || "");
      setEditLocation(user.location || "");
      setEditTimezone(user.timezone || "America/Los_Angeles");
      setEditBio(user.bio || "");
      setEditAvatarUrl(user.avatarUrl || "");
      setEditCompany(user.company || "");
    }
  }, [user, isEditProfileOpen, isPersonalInfoOpen]);

  if (isLoading || !user) {
    return (
      <div className="w-full flex flex-col gap-6 p-6">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const subordinates = allUsers?.filter(u => u.managerId === user._id) || [];

  // Counts calculated across lists
  const myCompletedTasksCount = allTasks?.filter(t => t.assignedTo === user._id && t.status === "Completed").length || 0;
  const myDealsCount = allDeals?.filter(d => d.assignedTo === user._id).length || 0;

  const handleAvatarFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingAvatar(true);
    try {
      const storageId = await uploadProfileImage(file, generateProfileUploadUrl);
      const result = await updateProfileImageMutation({ storageId });
      setEditAvatarUrl(result.avatarUrl);
      toast("success", "Profile picture updated.");
    } catch (err: any) {
      toast("error", err.message || "Unable to upload your profile picture.\nPlease try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingBanner(true);
    try {
      console.log("[BannerUpload] Starting upload...");
      const storageId = await uploadBannerImage(file, generateBannerUploadUrl);
      console.log("[BannerUpload] Upload complete, storageId:", storageId);
      setPendingBannerId(storageId);
      setCoverInputUrl(URL.createObjectURL(file));
    } catch (err: any) {
      console.error("[BannerUpload] Upload failed:", err);
      toast("error", err.message || "Banner upload failed.\nPlease check your internet connection.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast("error", "Full Name is required.");
      return;
    }

    const payload: any = {};

    if (canEditFieldClient("name")) payload.name = editName.trim();
    if (canEditFieldClient("phone")) payload.phone = editPhone.trim() || undefined;
    if (canEditFieldClient("department")) payload.department = editDept.trim() || undefined;
    if (canEditFieldClient("jobTitle")) payload.jobTitle = editJobTitle.trim() || undefined;
    if (canEditFieldClient("location")) payload.location = editLocation.trim() || undefined;
    if (canEditFieldClient("timezone")) payload.timezone = editTimezone || undefined;
    if (canEditFieldClient("bio")) payload.bio = editBio.trim() || undefined;
    if (canEditFieldClient("avatarUrl")) payload.avatarUrl = editAvatarUrl || undefined;
    if (canEditFieldClient("company")) payload.company = editCompany.trim() || undefined;
    
    payload.activityType = "profile_updated";

    setIsSubmitting(true);
    try {
      await updateProfileDetailsMutation(payload);
      toast("success", "Successfully updated profile details.");
      setIsEditProfileOpen(false);
    } catch (err: any) {
      toast("error", err.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast("error", "Full Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileDetailsMutation({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        company: editCompany.trim() || undefined,
        location: editLocation.trim() || undefined,
        activityType: "personal_info_updated",
      });
      toast("success", "Successfully updated personal information.");
      setIsPersonalInfoOpen(false);
    } catch (err: any) {
      toast("error", err.message || "Failed to update personal details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (pendingBannerId) {
        console.log("[CoverSave] Saving via storageId:", pendingBannerId);
        const result = await updateCoverImageMutation({ storageId: pendingBannerId });
        console.log("[CoverSave] Saved, coverImage:", result.coverImage);
      } else {
        const url = coverInputUrl.trim();
        if (!url) {
          toast("error", "Please upload or paste a cover image URL.");
          setIsSubmitting(false);
          return;
        }
        console.log("[CoverSave] Saving via URL paste:", url);
        await updateCoverImageMutation({ coverImage: url });
      }
      toast("success", "Successfully updated cover image.");
      setIsEditCoverOpen(false);
      setCoverInputUrl("");
      setPendingBannerId(null);
    } catch (err: any) {
      console.error("[CoverSave] Save failed:", err);
      toast("error", err.message || "Failed to update cover image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverRemove = async () => {
    setIsSubmitting(true);
    try {
      console.log("[CoverRemove] Removing cover image");
      await updateCoverImageMutation({ coverImage: null });
      toast("success", "Successfully removed cover image.");
      setIsEditCoverOpen(false);
      setCoverInputUrl("");
      setPendingBannerId(null);
    } catch (err: any) {
      console.error("[CoverRemove] Remove failed:", err);
      toast("error", err.message || "Failed to remove cover image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast("error", "Name and Email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window.crypto.randomUUID === "function" 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      await inviteUserAction({
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        department: inviteDept || undefined,
        managerId: inviteManagerId ? (inviteManagerId as any) : undefined,
        token,
      });
      toast("success", `Successfully invited ${inviteName}.`);
      setIsInviteUserOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("employee");
      setInviteDept("Sales");
      setInviteManagerId("");
    } catch (err: any) {
      toast("error", err.message || "Failed to invite user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageRolesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleUserId) {
      toast("error", "Please select a user to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserRoleMutation({
        id: selectedRoleUserId as any,
        role: selectedUserRole,
        managerId: selectedUserManagerId ? (selectedUserManagerId as any) : null,
        isActive: selectedUserActive,
      });
      toast("success", "Successfully updated user status and role.");
      setIsManageRolesOpen(false);
      setSelectedRoleUserId("");
      setSelectedUserRole("employee");
      setSelectedUserManagerId("");
      setSelectedUserActive(true);
    } catch (err: any) {
      toast("error", err.message || "Failed to manage user roles.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelectForRoleEdit = (userId: string) => {
    const selected = allUsers?.find(u => u._id === userId);
    if (selected) {
      setSelectedRoleUserId(userId);
      setSelectedUserRole(selected.role || "employee");
      setSelectedUserManagerId(selected.managerId || "");
      setSelectedUserActive(selected.isActive !== false);
    }
  };

  // Activity Format Helpers
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_invited": return Users;
      case "role_changed": case "role_updated": return Shield;
      case "profile_updated": case "personal_info_updated": return Edit2;
      case "cover_updated": return Globe;
      case "lead_created": case "lead_assigned": return Target;
      case "task_assigned": case "task_completed": return CheckCircle;
      case "deal_won": return Award;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user_invited": return "text-violet-650 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-400";
      case "role_changed": case "role_updated": return "text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400";
      case "profile_updated": case "personal_info_updated": return "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400";
      case "cover_updated": return "text-pink-600 bg-pink-100 dark:bg-pink-950/40 dark:text-pink-400";
      case "lead_created": case "lead_assigned": return "text-orange-600 bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400";
      case "task_assigned": case "task_completed": return "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400";
      case "deal_won": return "text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400";
      default: return "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const formatActivityTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-6 p-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        {/* Cover */}
        <div className="relative">
          <div 
            className="h-48 md:h-64 lg:h-[300px] bg-cover bg-center relative rounded-t-2xl overflow-hidden transition-all"
            style={{
              backgroundImage: user.coverImage ? `url(${user.coverImage})` : undefined,
              background: user.coverImage ? undefined : "linear-gradient(to right, var(--color-indigo-500), var(--color-violet-500), var(--color-purple-600))"
            }}
          >
            <button 
              onClick={() => setIsEditCoverOpen(true)}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/30 hover:bg-black/45 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Cover
            </button>
          </div>

          {/* Avatar overlapping cover */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0 bottom-[-50px] md:bottom-[-55px] lg:bottom-[-60px] z-10">
            <div className="w-24 h-24 md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 relative group">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl md:text-3xl lg:text-4xl font-bold flex items-center justify-center w-full h-full select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {user.name.split(" ").map(n => n[0]).join("")}
                </span>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFilePicked} />
              </label>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 md:pt-20 lg:pt-[88px] px-6 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="text-center lg:text-left flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {user.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                {user.role === "super_admin" && (
                  <>
                    <Chip label="SUPER ADMIN" v="purple" />
                    {user.email === "gokulnath13092001@gmail.com" && <Chip label="Founder" v="blue" />}
                  </>
                )}
                {user.role === "admin" && <Chip label="ADMIN" v="blue" />}
                {user.role === "sales_rep" && <Chip label="SALES REP" v="green" />}
                {user.role === "marketing" && <Chip label="MARKETING" v="orange" />}
                {user.role === "support" && <Chip label="SUPPORT" v="red" />}
                {user.role === "employee" && <Chip label="EMPLOYEE" v="neutral" />}
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Building className="w-3.5 h-3.5" /> <span>{user.company || "Acme Corp"}</span>
                </div>
                {user.department && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Shield className="w-3.5 h-3.5" /> <span>{user.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5" /> <span>{user.location || "San Francisco, CA"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.isActive !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? "bg-emerald-500" : "bg-red-500"}`} />
                    {user.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="self-center lg:self-start flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-650 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-slate-100 dark:border-slate-700/70 px-6">
          <div className="flex gap-6 overflow-x-auto scrollbar-none">
            {[
              { id: "overview", label: "Overview" },
              { id: "activity", label: "Activity" },
              { id: "tasks", label: "Tasks" },
              { id: "deals", label: "Deals" },
              { id: "leads", label: "Leads" },
              { id: "documents", label: "Documents" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeProfileTab === tab.id
                    ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeProfileTab === "overview" && (
        <>
      {/* Role-Based Actions & Authority Card */}
      {user.role === "super_admin" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Shield className="w-4 h-4 text-indigo-500" />
                Workspace Administration (Super Admin)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You have full administrative authority over this CRM workspace. You can invite new employees, modify roles, set managers, configure fine-grained permissions, and audit workspace performance.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              Root Access
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button 
              onClick={() => setIsInviteUserOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              Invite User
            </button>
            <button 
              onClick={() => setIsManageRolesOpen(true)}
              className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              Manage Roles
            </button>
            <button 
              onClick={() => toast("info", "Teams management coming soon.")}
              className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Manage Teams
            </button>
            <Link to="/reports" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1">
              Reports
            </Link>
            <Link to="/settings" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1">
              Workspace Settings
            </Link>
          </div>
        </div>
      )}

      {user.role === "admin" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Users className="w-4 h-4 text-violet-500" />
                Team Management Authority (Admin)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You are authorized to manage employees under your supervision. You can allocate leads, deals, and tasks to subordinates, update active status, and view team reports.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              Team Admin
            </div>
          </div>

          <div className="mt-4 border-t border-slate-50 dark:border-slate-700/40 pt-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              My Subordinates ({subordinates.length})
            </h3>
            {subordinates.length === 0 ? (
              <p className="text-[11px] text-slate-400">No employees assigned under you yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subordinates.map((sub) => (
                  <div key={sub._id} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-655 dark:text-slate-350">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.name}</span>
                    <span className="text-[9px] text-slate-400">({sub.department || "Sales"})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link to="/employees" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Manage Employees
            </Link>
            <Link to="/leads" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Assign Leads
            </Link>
            <Link to="/tasks" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Assign Tasks
            </Link>
            <Link to="/reports" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Reports
            </Link>
          </div>
        </div>
      )}

      {user.role === "sales_rep" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Target className="w-4 h-4 text-emerald-500" />
                Sales Representation Scope (Sales Rep)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You have access to manage and update leads, contacts, and deals assigned to you. You can convert qualified leads and close pipeline deals.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              Sales Rep
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-slate-50 dark:border-slate-700/40 pt-4">
            <Link to="/leads" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Leads
            </Link>
            <Link to="/contacts" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Contacts
            </Link>
            <Link to="/deals" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Deals
            </Link>
            <Link to="/tasks" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Tasks
            </Link>
            <Link to="/leads" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Update Lead Status
            </Link>
            <Link to="/deals" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Update Deal Status
            </Link>
          </div>
        </div>
      )}

      {user.role === "marketing" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Globe className="w-4 h-4 text-orange-500" />
                Marketing & Lead Acquisition (Marketing)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You can create and import leads, view campaign metrics, update lead statuses, and assign acquired leads to sales representatives.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-655 dark:text-orange-400 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              Marketing
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-slate-50 dark:border-slate-700/40 pt-4">
            <Link to="/leads" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Leads
            </Link>
            <Link to="/leads" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Update Lead Status
            </Link>
          </div>
        </div>
      )}

      {user.role === "support" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Award className="w-4 h-4 text-red-500" />
                Customer Support & Tickets (Support)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You can view assigned customer contacts, resolve issues, track support tasks, and update active cases.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              Support
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-slate-50 dark:border-slate-700/40 pt-4">
            <Link to="/contacts" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View Assigned Customers
            </Link>
            <Link to="/tasks" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Tasks
            </Link>
          </div>
        </div>
      )}

      {user.role === "employee" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <CheckCircle className="w-4 h-4 text-slate-500" />
                Standard Operations (Employee)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You can view daily tasks assigned to you, update task completion status, and review assigned lead/deal items.
              </p>
            </div>
            <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-650 dark:text-slate-350 text-[10px] font-extrabold uppercase rounded-lg tracking-wider">
              Employee
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-slate-50 dark:border-slate-700/40 pt-4">
            <Link to="/tasks" className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
              View My Tasks
            </Link>
            <Link to="/tasks" className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl transition-colors shadow-sm">
              Update Task Status
            </Link>
          </div>
        </div>
      )}

      {/* Role-Based Performance Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {user.role === "super_admin" && (
          <>
            <Link to="/employees" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Users</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{allUsers?.length || 0}</span>
            </Link>
            <Link to="/employees" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Admins</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{allUsers?.filter(u => u.role === "admin" || u.role === "super_admin").length || 0}</span>
            </Link>
            <Link to="/employees" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Employees</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{allUsers?.filter(u => u.role === "employee").length || 0}</span>
            </Link>
            <Link to="/reports" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors col-span-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Revenue</span>
              <div className="mt-1 space-y-0.5">
                {metrics?.closedRevenue && Object.keys(metrics.closedRevenue).length > 0 ? (
                  Object.entries(metrics.closedRevenue).map(([cur, val]) => (
                    <span key={cur} className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mr-4 inline-block">
                      {cur}: {val.toLocaleString()}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-slate-400">—</span>
                )}
              </div>
            </Link>
            <Link to="/deals" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Open Deals</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {Object.entries(metrics?.dealsByStage || {})
                  .filter(([stage]) => stage !== "Closed Won" && stage !== "Closed Lost")
                  .reduce((sum, [_, val]) => sum + val, 0)}
              </span>
            </Link>
          </>
        )}

        {user.role === "admin" && (
          <>
            <Link to="/employees" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Team Members</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{subordinates.length}</span>
            </Link>
            <Link to="/leads?team=true" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Team Leads</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{metrics?.totalLeads || 0}</span>
            </Link>
            <Link to="/deals?team=true" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Open Deals</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {Object.entries(metrics?.dealsByStage || {})
                  .filter(([stage]) => stage !== "Closed Won" && stage !== "Closed Lost")
                  .reduce((sum, [_, val]) => sum + val, 0)}
              </span>
            </Link>
            <Link to="/tasks?team=true" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Team Tasks</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{metrics?.pendingTasks || 0}</span>
            </Link>
            <Link to="/reports" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors col-span-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Revenue</span>
              <div className="mt-1 space-y-0.5">
                {metrics?.closedRevenue && Object.keys(metrics.closedRevenue).length > 0 ? (
                  Object.entries(metrics.closedRevenue).map(([cur, val]) => (
                    <span key={cur} className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mr-4 inline-block">
                      {cur}: {val.toLocaleString()}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-slate-400">—</span>
                )}
              </div>
            </Link>
          </>
        )}

        {user.role === "employee" && metrics && (
          <>
            <Link to={`/leads?assignedTo=${user._id}`} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Leads</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{metrics.totalLeads}</span>
            </Link>
            <Link to={`/tasks?status=pending&assignedTo=${user._id}`} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pending Tasks</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{metrics.pendingTasks}</span>
            </Link>
            <Link to={`/tasks?status=completed&assignedTo=${user._id}`} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Completed Tasks</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{myCompletedTasksCount}</span>
            </Link>
            <Link to={`/deals?assignedTo=${user._id}`} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm block hover:border-indigo-500 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Deals</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">{myDealsCount}</span>
            </Link>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Win Rate</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{metrics.winRate.toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>
        </>
      )}

      {activeProfileTab === "settings" && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Personal Information</h2>
            <button 
              onClick={() => setIsPersonalInfoOpen(true)}
              className="text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { I: User, l: "Full Name", v: user.name },
              { I: Mail, l: "Email", v: user.email },
              { I: Phone, l: "Phone", v: user.phone || "—" },
              { I: Building, l: "Company", v: user.company || "Acme Corp" },
              { I: Shield, l: "Role", v: user.role === "super_admin" ? "Owner (Super Admin)" : user.role === "admin" ? "Admin (Manager)" : "Employee (Sales Rep)" }
            ].map(({ I, l, v }) => (
              <div key={l} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-750 rounded-lg flex items-center justify-center flex-shrink-0">
                  <I className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Account Information</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { I: Calendar, l: "Member Since", v: new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
              { I: Clock, l: "Last Login", v: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never logged in" },
              { I: CheckCircle, l: "Account Status", v: user.isActive !== false ? "Active & Verified" : "Inactive" },
              { I: Award, l: "Department", v: user.department || "General Operations" },
              { I: Globe, l: "Timezone", v: user.timezone || "America/Los_Angeles" }
            ].map(({ I, l, v }) => (
              <div key={l} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-750 rounded-lg flex items-center justify-center flex-shrink-0">
                  <I className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {activeProfileTab === "activity" && (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h2>
        </div>
        <div className="px-6 py-5">
          <div className="relative space-y-5">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
            {!activities || activities.length === 0 ? (
              <p className="text-xs text-slate-400 pl-8">No recent activity logged.</p>
            ) : (
              activities.map((item) => {
                const IconComponent = getActivityIcon(item.type);
                const colorCls = getActivityColor(item.type);
                return (
                  <div key={item._id} className="flex items-start gap-4">
                    <div className={`relative z-10 w-6 h-6 rounded-full ${colorCls} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                      <IconComponent className="w-3 h-3" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{item.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatActivityTime(item.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {activities && activities.length >= 10 && activities.length % 10 === 0 && (
            <div className="mt-5 text-center">
              <button 
                onClick={() => setActivityLimit(prev => prev + 10)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Edit Profile Modal (Drawer Side) */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-800 border-l border-slate-100 dark:border-slate-755 max-w-md w-full h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Profile</h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditProfileSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                {user.role === "employee" && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-750/30 rounded-xl mb-4">
                    <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      Organization information is managed by your administrator.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Avatar Image {!canEditFieldClient("avatarUrl") && <Lock className="w-3 h-3 text-slate-450" />}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {editAvatarUrl ? (
                        <img src={editAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 flex gap-2">
                      {uploadingAvatar ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 rounded-lg text-[11px] font-semibold text-indigo-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                        </div>
                      ) : (
                      <label 
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-650 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors ${
                          !canEditFieldClient("avatarUrl") ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input 
                          type="file" 
                          accept="image/*"
                          disabled={!canEditFieldClient("avatarUrl")}
                          className="hidden" 
                          onChange={handleAvatarFilePicked}
                        />
                      </label>
                      )}
                      {editAvatarUrl && canEditFieldClient("avatarUrl") && (
                        <button 
                          type="button" 
                          onClick={() => setEditAvatarUrl("")}
                          className="px-2 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={editAvatarUrl} 
                      disabled={!canEditFieldClient("avatarUrl")}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="Or paste an image URL..."
                      className={`w-full h-9 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white mt-1.5 pr-8 ${
                        !canEditFieldClient("avatarUrl") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                      }`}
                    />
                    {!canEditFieldClient("avatarUrl") && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/4 pointer-events-none" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Full Name {!canEditFieldClient("name") && <Lock className="w-3 h-3 text-slate-450" />}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      disabled={!canEditFieldClient("name")}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                        !canEditFieldClient("name") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                      }`}
                    />
                    {!canEditFieldClient("name") && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Email Address <Lock className="w-3 h-3 text-slate-450" />
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled
                        value={user.email}
                        className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none opacity-60 cursor-not-allowed pr-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      System Role <Lock className="w-3 h-3 text-slate-450" />
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled
                        value={user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Employee"}
                        className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none opacity-60 cursor-not-allowed pr-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Employee ID <Lock className="w-3 h-3 text-slate-450" />
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled
                        value={user._id}
                        className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none opacity-60 cursor-not-allowed pr-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Account Status <Lock className="w-3 h-3 text-slate-450" />
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled
                        value={user.isActive !== false ? "Active" : "Inactive"}
                        className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 outline-none opacity-60 cursor-not-allowed pr-8"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Manager {!canEditFieldClient("managerId") && <Lock className="w-3 h-3 text-slate-450" />}
                  </label>
                  <div className="relative">
                    <select
                      disabled={!canEditFieldClient("managerId")}
                      value={user.managerId || ""}
                      onChange={() => {}} // Read-only view in edit profile
                      className={`w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                        !canEditFieldClient("managerId") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">No Manager</option>
                      {allUsers?.filter(u => u.role === "admin" || u.role === "super_admin").map((mgr) => (
                        <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.role})</option>
                      ))}
                    </select>
                    {!canEditFieldClient("managerId") && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Phone Number {!canEditFieldClient("phone") && <Lock className="w-3 h-3 text-slate-450" />}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editPhone}
                        disabled={!canEditFieldClient("phone")}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1 (555) 0192"
                        className={`w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                          !canEditFieldClient("phone") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                        }`}
                      />
                      {!canEditFieldClient("phone") && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Company {!canEditFieldClient("company") && <Lock className="w-3 h-3 text-slate-450" />}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editCompany}
                        disabled={!canEditFieldClient("company")}
                        onChange={(e) => setEditCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className={`w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                          !canEditFieldClient("company") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                        }`}
                      />
                      {!canEditFieldClient("company") && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Department {!canEditFieldClient("department") && <Lock className="w-3 h-3 text-slate-455" />}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editDept}
                        disabled={!canEditFieldClient("department")}
                        onChange={(e) => setEditDept(e.target.value)}
                        placeholder="Sales, Marketing, HR"
                        className={`w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                          !canEditFieldClient("department") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                        }`}
                      />
                      {!canEditFieldClient("department") && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Job Title {!canEditFieldClient("jobTitle") && <Lock className="w-3 h-3 text-slate-455" />}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editJobTitle}
                        disabled={!canEditFieldClient("jobTitle")}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        placeholder="Sales Lead"
                        className={`w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                          !canEditFieldClient("jobTitle") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                        }`}
                      />
                      {!canEditFieldClient("jobTitle") && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Location {!canEditFieldClient("location") && <Lock className="w-3 h-3 text-slate-450" />}
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editLocation}
                        disabled={!canEditFieldClient("location")}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="New York, NY"
                        className={`w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                          !canEditFieldClient("location") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                        }`}
                      />
                      {!canEditFieldClient("location") && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      Timezone {!canEditFieldClient("timezone") && <Lock className="w-3 h-3 text-slate-450" />}
                    </label>
                    <div className="relative">
                      <select 
                        value={editTimezone}
                        disabled={!canEditFieldClient("timezone")}
                        onChange={(e) => setEditTimezone(e.target.value)}
                        className={`w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white pr-8 ${
                          !canEditFieldClient("timezone") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="America/New_York">Eastern (EST)</option>
                        <option value="America/Chicago">Central (CST)</option>
                        <option value="America/Denver">Mountain (MST)</option>
                        <option value="America/Los_Angeles">Pacific (PST)</option>
                        <option value="Asia/Kolkata">India (IST)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Europe (CET)</option>
                        <option value="Asia/Singapore">Singapore (SGT)</option>
                      </select>
                      {!canEditFieldClient("timezone") && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Bio {!canEditFieldClient("bio") && <Lock className="w-3 h-3 text-slate-450" />}
                  </label>
                  <div className="relative">
                    <textarea 
                      value={editBio}
                      disabled={!canEditFieldClient("bio")}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className={`w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white resize-none pr-8 ${
                        !canEditFieldClient("bio") ? "opacity-60 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
                      }`}
                    />
                    {!canEditFieldClient("bio") && (
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsEditProfileOpen(false)}
                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Cover Modal */}
      <AnimatePresence>
        {isEditCoverOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Cover Image</h3>
                <button onClick={() => setIsEditCoverOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCoverSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-sans">Cover Image Upload</label>
                  {uploadingBanner ? (
                    <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-indigo-500">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-semibold">Uploading cover image...</span>
                    </div>
                  ) : coverInputUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={coverInputUrl} alt="Cover preview" className="w-full h-32 object-cover" />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleBannerFilePicked}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 cursor-pointer text-slate-400 transition-colors">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-semibold">Click to upload cover image</span>
                      <span className="text-[10px] text-slate-400">Max size 10 MB</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleBannerFilePicked}
                      />
                    </label>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Or Image URL</label>
                  <input 
                    type="text" 
                    value={coverInputUrl}
                    onChange={(e) => setCoverInputUrl(e.target.value)}
                    placeholder="https://example.com/cover.png"
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || uploadingBanner}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting || uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Cover
                  </button>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleCoverRemove}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-650 dark:text-red-400 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Remove Cover
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditCoverOpen(false)}
                      className="flex-1 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Personal Info Modal */}
      <AnimatePresence>
        {isPersonalInfoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Personal Information</h3>
                <button onClick={() => setIsPersonalInfoOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handlePersonalInfoSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Company</label>
                  <input 
                    type="text" 
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</label>
                  <input 
                    type="text" 
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsPersonalInfoOpen(false)}
                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite User Modal (Super Admin only) */}
      <AnimatePresence>
        {isInviteUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Invite User</h3>
                <button onClick={() => setIsInviteUserOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="w-full h-10 px-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System Role</label>
                    <select 
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</label>
                    <select 
                      value={inviteDept}
                      onChange={(e) => setInviteDept(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Customer Success">Customer Success</option>
                      <option value="Support">Support</option>
                      <option value="Finance">Finance</option>
                      <option value="Product">Product</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Manager</label>
                  <select 
                    value={inviteManagerId}
                    onChange={(e) => setInviteManagerId(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">No Manager</option>
                    {allUsers?.filter(u => u.role === "admin" || u.role === "super_admin").map((mgr) => (
                      <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsInviteUserOpen(false)}
                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Roles Modal (Super Admin only) */}
      <AnimatePresence>
        {isManageRolesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Manage Roles & Managers</h3>
                <button onClick={() => setIsManageRolesOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleManageRolesSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Select Employee</label>
                  <select 
                    required
                    value={selectedRoleUserId}
                    onChange={(e) => handleUserSelectForRoleEdit(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Employee --</option>
                    {allUsers?.filter(u => u._id !== user._id).map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                {selectedRoleUserId && (
                  <>
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System Role</label>
                        <select 
                          value={selectedUserRole}
                          onChange={(e) => setSelectedUserRole(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                        <button 
                          type="button"
                          onClick={() => setSelectedUserActive(!selectedUserActive)}
                          className="h-10 px-3.5 border border-slate-205 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs text-left text-slate-700 dark:text-slate-200 outline-none flex items-center justify-between cursor-pointer"
                        >
                          <span>{selectedUserActive ? "Active" : "Inactive"}</span>
                          {selectedUserActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned Manager</label>
                      <select 
                        value={selectedUserManagerId}
                        onChange={(e) => setSelectedUserManagerId(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 text-xs focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                      >
                        <option value="">No Manager</option>
                        {allUsers
                          ?.filter(u => u._id !== selectedRoleUserId && (u.role === "admin" || u.role === "super_admin"))
                          .map((mgr) => (
                            <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.role})</option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsManageRolesOpen(false)}
                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !selectedRoleUserId}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
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