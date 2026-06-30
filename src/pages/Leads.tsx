import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Building, Filter, Plus, Search, X, AlertCircle,
  Loader2, Edit, Trash2, Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/Toast";
import { useSearchParams } from "react-router-dom";
import ExcelJS from "exceljs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/currency";
import { ContactInteractionDrawer } from "@/components/ContactInteractionDrawer";
import { LeadTransitionDrawer } from "@/components/LeadTransitionDrawer";
import { UnqualifiedModal, LostModal, RequalifyModal, SpamModal, DuplicateModal } from "@/components/StatusWorkflowModals";
const LeadDetailsDrawer = React.lazy(() => import("@/components/LeadDetails/LeadDetailsLayout"));
import { LeadStatusSelect } from "@/components/LeadStatusSelect";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

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
  createdAt: number;
  updatedAt: number;

  statusChangedAt?: number;
  statusChangedBy?: string;
  unqualifiedReason?: string;
  unqualifiedNotes?: string;
  unqualifiedAt?: number;
  lostReason?: string;
  lostNotes?: string;
  lostAt?: number;
  requalifiedAt?: number;
  requalifiedBy?: string;
  requalificationReason?: string;
  customFields?: Record<string, any>;
}

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

function LeadsPageContent() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Filter & Search URL State ───
  const searchVal = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const sourceFilter = searchParams.get("source") || "all";
  const assignedFilter = searchParams.get("assignedTo") || "all";
  const datePresetFilter = searchParams.get("datePreset") || "all";
  const currencyFilter = searchParams.get("currency") || "all";
  const customStartVal = searchParams.get("customStart") || "";
  const customEndVal = searchParams.get("customEnd") || "";

  const [searchInput, setSearchInput] = useState(searchVal);
  const [debouncedSearch, setDebouncedSearch] = useState(searchVal);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      updateSearchParams("search", searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateSearchParams = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== "all") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSearchParams(new URLSearchParams());
  };

  // ─── Convex Query & Mutations ───
  const leads = useQuery(api.leads.list, {
    search: debouncedSearch || undefined,
    status: statusFilter,
    source: sourceFilter,
    assignedTo: assignedFilter,
    datePreset: datePresetFilter,
    customStart: customStartVal ? Number(customStartVal) : undefined,
    customEnd: customEndVal ? Number(customEndVal) : undefined,
    currency: currencyFilter,
  });

  const users = useQuery(api.users.list);

  const createLeadMutation = useMutation(api.leads.create);
  const updateLeadMutation = useMutation(api.leads.update);
  const deleteLeadMutation = useMutation(api.leads.softDelete);
  const transitionLeadStageMutation = useMutation(api.leads.transitionStage);
  const contactInteractionMutation = useMutation(api.leads.contactInteraction);
  const changeStatusMutation = useMutation(api.leads.changeStatus);
  const mergeMutation = useMutation(api.leads.mergeLeads);

  // ─── UI Modal & Drawer States ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Workflow Modals States
  const [isUnqualifiedModalOpen, setIsUnqualifiedModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isRequalifyModalOpen, setIsRequalifyModalOpen] = useState(false);
  const [isSpamModalOpen, setIsSpamModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    targetStatus: string;
    onConfirm: (extraFields: Record<string, string>) => void;
    onCancel?: () => void;
    leadId?: string;
  } | null>(null);

  // Contact Interaction Drawer State
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [isContactQualifyMode, setIsContactQualifyMode] = useState(false);

  // Redesign Lead Stage Transition and Reminders State
  const [isTransitionDrawerOpen, setIsTransitionDrawerOpen] = useState(false);
  const [transitionTargetStage, setTransitionTargetStage] = useState("");

  const handleStatusChangeRequest = (
    targetStatus: string,
    currentStatus: string,
    onConfirm: (extraFields: Record<string, string>) => void,
    onCancel?: () => void,
    leadId?: string
  ) => {
    if (targetStatus === "Unqualified") {
      setPendingStatusChange({ targetStatus, onConfirm, onCancel, leadId });
      setIsUnqualifiedModalOpen(true);
    } else if (targetStatus === "Lost") {
      setPendingStatusChange({ targetStatus, onConfirm, onCancel, leadId });
      setIsLostModalOpen(true);
    } else if (targetStatus === "Spam") {
      setPendingStatusChange({ targetStatus, onConfirm, onCancel, leadId });
      setIsSpamModalOpen(true);
    } else if (targetStatus === "Duplicate") {
      setPendingStatusChange({ targetStatus, onConfirm, onCancel, leadId });
      setIsDuplicateModalOpen(true);
    } else if (["Unqualified", "Lost", "Spam", "Duplicate"].includes(currentStatus) && targetStatus === "Contacted") {
      setPendingStatusChange({ targetStatus, onConfirm, onCancel, leadId });
      setIsRequalifyModalOpen(true);
    } else if (targetStatus === "Contacted" && currentStatus === "New") {
      // Open contact interaction drawer instead of inline status change
      setIsContactQualifyMode(false);
      setIsContactDrawerOpen(true);
      onCancel?.();
    } else if (targetStatus === "Qualified" && currentStatus === "Contacted") {
      setIsContactQualifyMode(true);
      setIsContactDrawerOpen(true);
      onCancel?.();
    } else {
      onConfirm({});
    }
  };

  // Form Field State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    status: "New",
    source: "Website",
    website: "",
    initialNotes: "",
    assignedTo: "" as any,
    unqualifiedReason: "",
    unqualifiedNotes: "",
    lostReason: "",
    lostNotes: "",
    requalificationReason: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFormOpen) {
      setTimeout(() => firstNameRef.current?.focus(), 150);
    }
  }, [isFormOpen]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      resetForm();
      setIsFormOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (leadId && leads) {
      const match = leads.find((l) => l._id === leadId);
      if (match) {
        setSelectedLead(match);
        setIsDetailsOpen(true);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete("leadId");
          return next;
        }, { replace: true });
      }
    }
  }, [searchParams, leads, setSearchParams]);

  const validateField = (name: string, value: any) => {
    let err = "";
    if (name === "firstName" && !value.trim()) err = "First Name is required";
    else if (name === "lastName" && !value.trim()) err = "Last Name is required";
    else if (name === "company" && !value.trim()) err = "Company is required";
    else if (name === "email" && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      err = "Invalid email address";
    }
    return err;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const isFormValid = () => {
    const required = ["firstName", "lastName", "company"];
    const hasRequired = required.every(f => form[f as keyof typeof form]?.toString().trim());
    const hasEmailOrPhone = !!(form.email.trim() || form.phone.trim());
    const hasErrors = Object.values(formErrors).some(err => err);
    return hasRequired && hasEmailOrPhone && !hasErrors;
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      status: "New",
      source: "Website",
      website: "",
      initialNotes: "",
      assignedTo: "",
      unqualifiedReason: "",
      unqualifiedNotes: "",
      lostReason: "",
      lostNotes: "",
      requalificationReason: "",
    });
    setFormErrors({});
    setEditingLeadId(null);
  };

  const handleEditLead = (lead: Lead) => {
    setForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || "",
      company: lead.company,
      jobTitle: lead.jobTitle || "",
      status: lead.status,
      source: lead.source,
      website: (lead as any).website || "",
      initialNotes: (lead as any).initialNotes || "",
      assignedTo: lead.assignedTo || "",
      unqualifiedReason: lead.unqualifiedReason || "",
      unqualifiedNotes: lead.unqualifiedNotes || "",
      lostReason: lead.lostReason || "",
      lostNotes: lead.lostNotes || "",
      requalificationReason: lead.requalificationReason || "",
    });
    setEditingLeadId(lead._id);
    setIsDetailsOpen(false);
    setTimeout(() => setIsFormOpen(true), 200);
  };

  const handleDeleteLead = async (leadId: string, company: string) => {
    if (window.confirm(`Delete "${company}"? This record will be moved to Trash and can be restored later.`)) {
      try {
        await deleteLeadMutation({ id: leadId as any });
        if (selectedLead?._id === leadId) {
          setIsDetailsOpen(false);
          setSelectedLead(null);
        }
        toast("success", "Lead moved to trash.");
      } catch (err: any) {
        toast("error", err.message || "Failed to delete lead");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setIsSubmitting(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      company: form.company.trim(),
      jobTitle: form.jobTitle.trim() || undefined,
      status: form.status,
      source: form.source,
      website: form.website.trim() || undefined,
      initialNotes: form.initialNotes.trim() || undefined,
      assignedTo: form.assignedTo ? form.assignedTo : undefined,
    };
    if (editingLeadId) {
      Object.assign(payload, {
        unqualifiedReason: form.unqualifiedReason || undefined,
        unqualifiedNotes: form.unqualifiedNotes || undefined,
        lostReason: form.lostReason || undefined,
        lostNotes: form.lostNotes || undefined,
        requalificationReason: form.requalificationReason || undefined,
      });
    }

    try {
      if (editingLeadId) {
        await updateLeadMutation({ id: editingLeadId as any, ...payload });
        toast("success", "Lead updated successfully.");
      } else {
        await createLeadMutation(payload);
        toast("success", "Lead created successfully.");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast("error", err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Excel Export Logic ───
  const handleExport = async () => {
    if (!leads) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Leads");

      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }
      ];

      // Double-row header configuration
      const headerRow1 = worksheet.getRow(1);
      headerRow1.height = 30;
      headerRow1.getCell(1).value = "Lead & Contact Info";
      headerRow1.getCell(7).value = "Value & Quality";
      headerRow1.getCell(10).value = "Dates";

      worksheet.mergeCells("A1:F1");
      worksheet.mergeCells("G1:I1");

      const primaryIndigoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
      const whiteBoldFont = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      const centerAlignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'C7D2FE' } },
        left: { style: 'thin', color: { argb: 'C7D2FE' } },
        bottom: { style: 'thin', color: { argb: 'C7D2FE' } },
        right: { style: 'thin', color: { argb: 'C7D2FE' } }
      };

      for (let col = 1; col <= 10; col++) {
        const cell = headerRow1.getCell(col);
        cell.fill = primaryIndigoFill as any;
        cell.font = whiteBoldFont;
        cell.alignment = centerAlignment as any;
        cell.border = thinBorder as any;
      }

      const subHeaders = [
        "Company", "Contact Name", "Email Address", "Phone Number",
        "Lead Source", "Lead Status", "Currency", "Value", "Quality Score",
        "Created Date"
      ];

      const headerRow2 = worksheet.getRow(2);
      headerRow2.height = 24;
      const lightIndigoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };
      const darkIndigoFont = { name: 'Inter', size: 10, bold: true, color: { argb: '312E81' } };

      subHeaders.forEach((sh, index) => {
        const cell = headerRow2.getCell(index + 1);
        cell.value = sh;
        cell.fill = lightIndigoFill as any;
        cell.font = darkIndigoFont;
        cell.alignment = centerAlignment as any;
        cell.border = thinBorder as any;
      });

      const zebraDarkFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      const zebraLightFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
      const dataFont = { name: 'Inter', size: 10, color: { argb: '1E293B' } };
      const dataBorder = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } }
      };

      const formatExcelDate = (epoch: number) => {
        const date = new Date(epoch);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
      };

      leads.forEach((l, rowIndex) => {
        const row = worksheet.getRow(rowIndex + 3);
        row.height = 20;

        const data = [
          l.company,
          `${l.firstName} ${l.lastName}`,
          l.email,
          l.phone || "Not Provided",
          l.source,
          l.status,
          l.currency || "INR",
          l.value !== undefined ? formatCurrency(l.value, l.currency || "INR") : "—",
          l.score !== undefined ? l.score : "N/A",
          formatExcelDate(l.createdAt),
        ];

        const isEven = rowIndex % 2 === 0;
        const currentFill = isEven ? zebraLightFill : zebraDarkFill;

        data.forEach((val, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = val;
          cell.fill = currentFill as any;
          cell.font = dataFont;
          cell.border = dataBorder as any;
          cell.alignment = {
            vertical: 'middle',
            horizontal: colIndex === 0 || colIndex === 1 || colIndex === 2 ? 'left' : 'center'
          } as any;
        });
      });

      worksheet.autoFilter = {
        from: { row: 2, column: 1 },
        to: { row: 2, column: 10 }
      };

      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
          const rowNum = typeof cell.row === "object" ? (cell.row as any).number : Number(cell.row);
          if (rowNum === 1) return;
          const len = cell.value ? String(cell.value).length : 0;
          if (len > maxLength) maxLength = len;
        });
        column.width = Math.max(maxLength + 4, 12);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      
      const filename = `leads-${yyyy}-${mm}-${dd}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsExportOpen(false);
      toast("success", "Leads exported to Excel successfully.");
    } catch (err: any) {
      toast("error", err.message || "Failed to export leads");
    } finally {
      setIsExporting(false);
    }
  };

  const statusColors = (s: string) => {
    return (
      {
        New: "blue",
        Contacted: "neutral",
        Qualified: "green",
        Converted: "purple",
        Lost: "red",
        Unqualified: "red",
        Spam: "red",
        Duplicate: "orange",
      }[s] as any ?? "neutral"
    );
  };

  const isLoading = leads === undefined;

  const filteredLeads = (leads || []).filter((lead: any) => {
    const isActive = ["New", "Contacted", "Qualified"].includes(lead.status);
    return activeTab === "active" ? isActive : !isActive;
  });

  if (selectedLead && isDetailsOpen) {
    return (
      <ErrorBoundary fallback={
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 p-6">
          <AlertCircle className="w-16 h-16 text-red-400" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Failed to load lead details</h3>
          <p className="text-xs text-slate-400">Something went wrong while loading this lead.</p>
          <button
            onClick={() => { setIsDetailsOpen(false); setSelectedLead(null); }}
            className="mt-2 h-9 px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Back to Leads
          </button>
        </div>
      }>
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm font-semibold">Loading Lead Workspace...</p>
          </div>
        }>
          <LeadDetailsDrawer
            leadId={selectedLead._id}
            onBack={() => { setIsDetailsOpen(false); setSelectedLead(null); }}
            onLeadDelete={() => { setIsDetailsOpen(false); setSelectedLead(null); }}
          />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl pb-6 p-6">
      {/* Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Leads</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {leads ? `${leads.length} total leads` : "Loading leads..."}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 border ${showFilters ? "border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"} text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm`}
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* ─── Active vs Closed pipeline tabs ─── */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/80 mb-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "active"
              ? "border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-655"
          }`}
        >
          Active Pipeline
        </button>
        <button
          onClick={() => setActiveTab("closed")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "closed"
              ? "border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-655"
          }`}
        >
          Closed & Archived
        </button>
      </div>

      {/* ─── Search & Quick Filters ─── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"><Search className="w-4 h-4" /></div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by company, contact name, email, phone..."
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Expanded Filter Panel ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-hidden shadow-sm"
          >
            {/* Status */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => updateSearchParams("status", e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                {activeTab === "active" ? (
                  <>
                    <option value="New">🆕 New</option>
                    <option value="Contacted">📞 Contacted</option>
                    <option value="Qualified">✅ Qualified</option>
                  </>
                ) : (
                  <>
                    <option value="Converted">🏆 Converted</option>
                    <option value="Lost">❌ Lost</option>
                    <option value="Unqualified">🚫 Unqualified</option>
                    <option value="Spam">⚠️ Spam</option>
                    <option value="Duplicate">👥 Duplicate</option>
                  </>
                )}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => updateSearchParams("source", e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="all">All Sources</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Partner">Partner</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Assigned User</label>
              <select
                value={assignedFilter}
                onChange={(e) => updateSearchParams("assignedTo", e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                 {users?.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Date Created */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Date Created</label>
              <select
                value={datePresetFilter}
                onChange={(e) => updateSearchParams("datePreset", e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="15days">Last 15 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Currency</label>
              <select
                value={currencyFilter}
                onChange={(e) => updateSearchParams("currency", e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="all">All Currencies</option>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="AED">AED (AED)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>

            {/* Clear Filters Option */}
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Clear All Filters & Reset URL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content Table / Skeletons / Empty States ─── */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-12 text-center shadow-sm">
          <EmptyState
            title="No leads found"
            description="No leads matched your search or filters. Create a new lead or clear filters to start fresh."
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/40">
                  {["Company", "Contact", "Status", "Source", "Notes", ""].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {filteredLeads.map(l => (
                  <tr
                    key={l._id}
                    onClick={() => { setSelectedLead(l); setIsDetailsOpen(true); }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-100/30">
                          <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{l.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{l.firstName} {l.lastName}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{l.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Chip label={l.status} v={statusColors(l.status)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{l.source}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] truncate">
                        {(l as any).initialNotes || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditLead(l)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(l._id, l.company)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── New/Edit Form Modal / Drawer ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-[rgba(15,23,42,0.55)]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg h-full bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-100 dark:border-slate-700/50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {editingLeadId ? "Edit Lead Details" : "Create New Lead"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fill in the fields below to update the lead database</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">First Name *</label>
                    <input
                      type="text"
                      ref={firstNameRef}
                      name="firstName"
                      value={form.firstName}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    />
                    {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    />
                    {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Company / Account Name *</label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                  {formErrors.company && <p className="text-xs text-red-500 mt-1">{formErrors.company}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="jane@company.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 019-2834"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Job Title</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={form.jobTitle}
                      onChange={handleInputChange}
                      placeholder="CTO / Founder"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Lead Status</label>
                    <LeadStatusSelect
                      value={form.status}
                      onChange={(val: string) => {
                        if (!editingLeadId) {
                          setForm(prev => ({ ...prev, status: val }));
                        } else {
                          const current = leads?.find(l => l._id === editingLeadId)?.status || "New";
                          handleStatusChangeRequest(
                            val,
                            current,
                            (extra) => {
                              setForm(prev => ({
                                ...prev,
                                status: val,
                                ...extra,
                              }));
                            }
                          );
                        }
                      }}
                      currentStatus={editingLeadId ? (leads?.find(l => l._id === editingLeadId)?.status) : undefined}
                      isNewLead={!editingLeadId}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Lead Source</label>
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Cold Call">Cold Call</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Partner">Partner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleInputChange}
                    placeholder="https://acme.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Initial Notes</label>
                  <textarea
                    name="initialNotes"
                    value={form.initialNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, initialNotes: e.target.value }))}
                    placeholder="Any initial context about this lead..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Assigned To</label>
                  <select
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select User...</option>
                    {users?.map((u: any) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </form>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingLeadId ? "Save Changes" : "Create Lead"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Excel Export Dialog Modal ─── */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExportOpen(false)} className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Export Filtered Leads</h3>
                <button onClick={() => setIsExportOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                Download the current filtered leads list directly as a fully styled Excel spreadsheet (with frozen headers, custom coloring, column autosizing, and numerical formatting).
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsExportOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Download .xlsx"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              duplicateLeadId: (selectedLead?._id || pendingStatusChange?.leadId) as any,
              targetLeadId: data.targetLeadId as any,
              mergeNotes: data.mergeNotes,
              mergeActivities: data.mergeActivities,
              mergeFiles: data.mergeFiles,
              mergeTimeline: data.mergeTimeline,
              notes: data.notes,
            });
            toast("success", "Duplicate lead merged successfully");
          } catch (err: any) {
            toast("error", err.message || "Failed to merge leads");
          }
          setIsDuplicateModalOpen(false);
          setPendingStatusChange(null);
        }}
        leads={leads}
        currentLeadId={selectedLead?._id || pendingStatusChange?.leadId || ""}
      />

      <ContactInteractionDrawer
        isOpen={isContactDrawerOpen}
        onClose={() => {
          setIsContactDrawerOpen(false);
          setIsContactQualifyMode(false);
        }}
        lead={selectedLead as any}
        onConfirm={async (data) => {
          try {
            if (isContactQualifyMode) {
              await contactInteractionMutation({
                leadId: selectedLead?._id as any,
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
              await changeStatusMutation({
                leadId: selectedLead?._id as any,
                status: "Qualified",
              });
              toast("success", "Lead qualified successfully");
            } else {
              await contactInteractionMutation({
                leadId: selectedLead?._id as any,
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
            setIsContactDrawerOpen(false);
            setIsContactQualifyMode(false);
          } catch (err: any) {
            toast("error", err.message || "Failed to process interaction");
          }
        }}
      />

      <LeadTransitionDrawer
        isOpen={isTransitionDrawerOpen}
        onClose={() => {
          setIsTransitionDrawerOpen(false);
          setTransitionTargetStage("");
        }}
        lead={selectedLead as any}
        targetStage={transitionTargetStage}
        onConfirm={async (data) => {
          try {
            await transitionLeadStageMutation({
              leadId: selectedLead?._id as any,
              toStage: transitionTargetStage,
              transitionData: data.transitionData,
              activityDetails: data.activityDetails as any,
              reminderDetails: data.reminderDetails,
              attachments: data.attachments as any,
            });
            toast("success", `Successfully transitioned lead to ${transitionTargetStage}`);
          } catch (err: any) {
            toast("error", err.message || "Failed to transition lead");
          }
        }}
      />
    </div>
  );
}
export function LeadsPage() {
  return (
    <ErrorBoundary fallback={<LeadsError />}>
      <LeadsPageContent />
    </ErrorBoundary>
  );
}

function LeadsError() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/60 rounded-2xl shadow-sm text-center max-w-xl mx-auto mt-6">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Something went wrong</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        An error occurred while loading the leads page. Please try refreshing or contact support.
      </p>
    </div>
  );
}

export default LeadsPage;
