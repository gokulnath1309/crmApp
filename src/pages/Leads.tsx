import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Building, Filter, Plus, Search, X, Mail, Phone, User,
  Award, Loader2, Edit, Trash2, Download, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/Toast";
import { useSearchParams } from "react-router-dom";
import ExcelJS from "exceljs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

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
  score?: number;
  createdAt: number;
  updatedAt: number;
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

export function LeadsPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Filter & Search URL State ───
  const searchVal = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const sourceFilter = searchParams.get("source") || "all";
  const assignedFilter = searchParams.get("assignedTo") || "all";
  const datePresetFilter = searchParams.get("datePreset") || "all";
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
  });

  const users = useQuery(api.users.list);

  const createLeadMutation = useMutation(api.leads.create);
  const updateLeadMutation = useMutation(api.leads.update);
  const deleteLeadMutation = useMutation(api.leads.remove);

  // ─── UI Modal & Drawer States ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    assignedTo: "" as any,
    value: "" as any,
    score: "" as any,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFormOpen) {
      setTimeout(() => firstNameRef.current?.focus(), 150);
    }
  }, [isFormOpen]);

  const validateField = (name: string, value: any) => {
    let err = "";
    if (name === "firstName" && !value.trim()) err = "First Name is required";
    else if (name === "lastName" && !value.trim()) err = "Last Name is required";
    else if (name === "company" && !value.trim()) err = "Company is required";
    else if (name === "email") {
      if (!value.trim()) err = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) err = "Invalid email address";
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
    const required = ["firstName", "lastName", "email", "company"];
    const hasRequired = required.every(f => form[f as keyof typeof form]);
    const hasErrors = Object.values(formErrors).some(err => err);
    return hasRequired && !hasErrors;
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
      assignedTo: "",
      value: "",
      score: "",
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
      assignedTo: lead.assignedTo || "",
      value: lead.value?.toString() || "",
      score: lead.score?.toString() || "",
    });
    setEditingLeadId(lead._id);
    setIsDetailsOpen(false);
    setTimeout(() => setIsFormOpen(true), 200);
  };

  const handleDeleteLead = async (leadId: string, company: string) => {
    if (window.confirm(`Are you sure you want to delete lead "${company}"?`)) {
      try {
        await deleteLeadMutation({ id: leadId as any });
        if (selectedLead?._id === leadId) {
          setIsDetailsOpen(false);
          setSelectedLead(null);
        }
        toast("success", "Lead deleted successfully.");
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
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim(),
      jobTitle: form.jobTitle.trim() || undefined,
      status: form.status,
      source: form.source,
      assignedTo: form.assignedTo ? form.assignedTo : undefined,
      value: form.value ? Number(form.value) : undefined,
      score: form.score ? Number(form.score) : undefined,
    };

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
      headerRow1.getCell(7).value = "Assignment & Quality";
      headerRow1.getCell(10).value = "Dates";

      worksheet.mergeCells("A1:F1");
      worksheet.mergeCells("G1:I1");
      worksheet.mergeCells("J1:K1");

      const primaryIndigoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
      const whiteBoldFont = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      const centerAlignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'C7D2FE' } },
        left: { style: 'thin', color: { argb: 'C7D2FE' } },
        bottom: { style: 'thin', color: { argb: 'C7D2FE' } },
        right: { style: 'thin', color: { argb: 'C7D2FE' } }
      };

      for (let col = 1; col <= 11; col++) {
        const cell = headerRow1.getCell(col);
        cell.fill = primaryIndigoFill as any;
        cell.font = whiteBoldFont;
        cell.alignment = centerAlignment as any;
        cell.border = thinBorder as any;
      }

      const subHeaders = [
        "Company", "Contact Name", "Email Address", "Phone Number", "Job Title",
        "Lead Status", "Lead Source", "Value ($)", "Quality Score",
        "Created Date", "Last Updated"
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
          l.jobTitle || "Not Provided",
          l.status,
          l.source,
          l.value !== undefined ? l.value : 0,
          l.score !== undefined ? l.score : "N/A",
          formatExcelDate(l.createdAt),
          formatExcelDate(l.updatedAt),
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

          // Format value column as currency
          if (colIndex === 7 && typeof val === "number") {
            cell.numFmt = '"$"#,##0';
          }
        });
      });

      worksheet.autoFilter = {
        from: { row: 2, column: 1 },
        to: { row: 2, column: 11 }
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
        Proposal: "purple",
        Unqualified: "red",
      }[s] as any ?? "neutral"
    );
  };

  const isLoading = leads === undefined;

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
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden shadow-sm"
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
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Unqualified">Unqualified</option>
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
                {users?.map(u => (
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

            {/* Clear Filters Option */}
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
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
      ) : leads.length === 0 ? (
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
                  {["Company", "Contact", "Status", "Value", "Source", "Score", ""].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {leads.map(l => (
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
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {l.value !== undefined ? `$${l.value.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{l.source}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${l.score !== undefined && l.score >= 85 ? "bg-emerald-500" : l.score !== undefined && l.score >= 70 ? "bg-yellow-500" : "bg-orange-500"}`} style={{ width: `${l.score || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{l.score || 0}</span>
                      </div>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
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
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Unqualified">Unqualified</option>
                    </select>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Value ($)</label>
                    <input
                      type="number"
                      name="value"
                      value={form.value}
                      onChange={handleInputChange}
                      placeholder="25000"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
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
                      {users?.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
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

      {/* ─── Details Drawer ─── */}
      <AnimatePresence>
        {isDetailsOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg h-full bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-100 dark:border-slate-700/50 flex flex-col p-6 space-y-6 overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950 rounded-2xl flex items-center justify-center border border-indigo-100/30">
                    <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedLead.company}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedLead.firstName} {selectedLead.lastName}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              {/* Status Header */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700/40">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                  <Chip label={selectedLead.status} v={statusColors(selectedLead.status)} />
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estimated Value</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedLead.value !== undefined ? `$${selectedLead.value.toLocaleString()}` : "—"}
                  </span>
                </div>
              </div>

              {/* Contact Information Details */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Details</h4>
                <div className="space-y-3 bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{selectedLead.jobTitle || "No Title Provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${selectedLead.email}`} className="hover:underline text-indigo-600 dark:text-indigo-400">{selectedLead.email}</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedLead.phone || "No Phone Provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>Source: {selectedLead.source}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span>Quality Score: <strong className="text-slate-900 dark:text-white">{selectedLead.score || 0} / 100</strong></span>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dates & Ownership</h4>
                <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 text-sm text-slate-700 dark:text-slate-300">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Created Date</p>
                    <p className="font-medium">{new Date(selectedLead.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                    <p className="font-medium">{new Date(selectedLead.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  onClick={() => handleEditLead(selectedLead)}
                  className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Edit Lead
                </button>
                <button
                  onClick={() => handleDeleteLead(selectedLead._id, selectedLead.company)}
                  className="px-4 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExportOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
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
    </div>
  );
}
export default LeadsPage;
