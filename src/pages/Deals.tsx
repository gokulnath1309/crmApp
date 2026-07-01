import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Building, Filter, Plus, Search, X, User as UserIcon,
  Loader2, Edit, Trash2, Download, Sparkles,
  Clock, ArrowRight, History, UserCheck, XCircle, CheckCircle2,
  Briefcase, Percent, ChevronDown, ChevronRight, Archive, RotateCcw,
  MoreVertical, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/Toast";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSearchParams } from "react-router-dom";
import ExcelJS from "exceljs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { DealStageSelect, dealStageOptions } from "@/components/DealStageSelect";

import { ClosedLostModal, ClosedWonSuccessModal } from "@/components/DealWorkflowModals";

const currencyOptions = [
  { value: "INR", label: "₹ INR — Indian Rupee", searchString: "INR Indian Rupee Rupee INR ₹" },
  { value: "USD", label: "$ USD — US Dollar", searchString: "USD US Dollar Dollar USD $" },
  { value: "EUR", label: "€ EUR — Euro", searchString: "EUR Euro Euro EUR €" },
  { value: "GBP", label: "£ GBP — British Pound", searchString: "GBP British Pound Pound GBP £" },
  { value: "AED", label: "د.إ AED — UAE Dirham", searchString: "AED UAE Dirham Dirham AED د.إ" },
  { value: "SGD", label: "S$ SGD — Singapore Dollar", searchString: "SGD Singapore Dollar Dollar SGD S$" },
  { value: "AUD", label: "A$ AUD — Australian Dollar", searchString: "AUD Australian Dollar Dollar AUD A$" },
  { value: "CAD", label: "C$ CAD — Canadian Dollar", searchString: "CAD Canadian Dollar Dollar CAD C$" },
  { value: "JPY", label: "¥ JPY — Japanese Yen", searchString: "JPY Japanese Yen Yen JPY ¥" },
  { value: "CNY", label: "¥ CNY — Chinese Yuan", searchString: "CNY Chinese Yuan Yuan CNY ¥" },
];

interface Deal {
  _id: string;
  title: string;
  value: number;
  status: string; // "Pipeline" | "Won" | "Lost"
  stage: string; // "Prospecting" | "Qualification" | "Proposal" | "Negotiation" | "Verbal Commit" | "Closed Won" | "Closed Lost"
  company?: string;
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  
  // Linked entities
  leadId?: string;
  workspaceId?: string;
  contactId?: string;

  // Pipeline tracking
  probability?: number;
  currency?: string;
  stageChangedAt?: number;
  stageChangedBy?: string;
  lostReason?: string;
  lostNotes?: string;

  // Deal metadata
  dealType?: string;
  expectedCloseDate?: number;
  priority?: string;

  // Contract details
  contractStartDate?: number;
  contractEndDate?: number;
  renewalDate?: number;
  billingFrequency?: string;
  poNumber?: string;
  referenceNumber?: string;
  notes?: string;

  // Lifecycle
  isArchived?: boolean;
  isDeleted?: boolean;
}



function StatCard({ title, value, subLabel, Icon, iconBg }: { title: string; value: React.ReactNode; subLabel: string; Icon: React.ComponentType<{ className?: string }>; iconBg: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/70 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
        <div className="mt-1.5">{value}</div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">{subLabel}</p>
      </div>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

export function DealsPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isMobileLayout = useMediaQuery("(max-width: 1023px)");
  const isSmallMobile = useMediaQuery("(max-width: 639px)");
  const [mobileSelectedStage, setMobileSelectedStage] = useState<string>("Prospecting");
  const [activeMenuDealId, setActiveMenuDealId] = useState<string | null>(null);
  const [stageChangeDealId, setStageChangeDealId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the menu or its trigger
      if (target.closest?.('[data-deals-menu]')) return;
      setActiveMenuDealId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Filter & Search URL State ───
  const searchVal = searchParams.get("search") || "";
  const assignedFilter = searchParams.get("assignedTo") || "all";
  const currencyFilter = searchParams.get("currency") || "all";
  const stageFilter = searchParams.get("stage") || "all";

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
    setSearchParams(new URLSearchParams());
  };

  // ─── Pipeline Filter State ───
  const [pipelineFilter, setPipelineFilter] = useState("active");

  // ─── Convex Query & Mutations ───
  const deals = useQuery(api.deals.list, { filter: pipelineFilter });
  const users = useQuery(api.users.list);
  const analytics = useQuery(api.analytics.getDealAnalytics);

  const createDealMutation = useMutation(api.deals.create);
  const updateDealMutation = useMutation(api.deals.update);
  const softDeleteDealMutation = useMutation(api.deals.softDelete);
  const archiveDealMutation = useMutation(api.deals.archive);
  const restoreDealMutation = useMutation(api.deals.restore);
  const clearTrashMutation = useMutation(api.deals.clearTrash);
  const removeDealMutation = useMutation(api.deals.remove);

  // Local Deals State for Optimistic Updates
  const [localDeals, setLocalDeals] = useState<Deal[] | null>(null);

  useEffect(() => {
    if (deals) {
      setLocalDeals(deals);
    }
  }, [deals]);

  // ─── UI Modal & Drawer States ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Workflow Modals States
  const [isClosedLostModalOpen, setIsClosedLostModalOpen] = useState(false);
  const [isClosedWonSuccessModalOpen, setIsClosedWonSuccessModalOpen] = useState(false);
  const [wonCelebrationTitle, setWonCelebrationTitle] = useState("");
  const [pendingStageChange, setPendingStageChange] = useState<{
    dealId: string;
    targetStage: string;
    onConfirm: (extraFields: Record<string, string>) => void;
  } | null>(null);

  // Query activities for selected deal
  const dealActivities = useQuery(
    api.activities.list,
    selectedDeal ? { entityType: "deal", entityId: selectedDeal._id } : "skip"
  );

  // Form Field State
  const [form, setForm] = useState({
    title: "",
    value: "" as any,
    currency: "INR",
    stage: "Prospecting",
    company: "",
    assignedTo: "" as any,
    dealType: "",
    expectedCloseDate: "",
    priority: "Medium",
    contractStartDate: "",
    contractEndDate: "",
    renewalDate: "",
    billingFrequency: "",
    poNumber: "",
    referenceNumber: "",
    notes: "",
  });
  const [contractOpen, setContractOpen] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFormOpen) {
      setTimeout(() => titleRef.current?.focus(), 150);
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
    const dealId = searchParams.get("dealId");
    if (dealId && deals) {
      const match = deals.find((d) => d._id === dealId);
      if (match) {
        setSelectedDeal(match);
        setIsDetailsOpen(true);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete("dealId");
          return next;
        }, { replace: true });
      }
    }
  }, [searchParams, deals, setSearchParams]);

  const validateField = (name: string, value: any) => {
    let err = "";
    if (name === "title" && !value.trim()) err = "Deal Title is required";
    else if (name === "company" && !value.trim()) err = "Company Name is required";
    else if (name === "value") {
      if (!value || !value.toString().trim()) {
        err = "Value is required";
      } else {
        const num = Number(value);
        if (isNaN(num)) {
          err = "Value must be a number";
        } else if (num < 0) {
          err = "Value must be positive";
        }
      }
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
    const required = ["title", "company", "value"];
    const hasRequired = required.every(f => form[f as keyof typeof form]?.toString().trim());
    const hasErrors = Object.values(formErrors).some(err => err);
    return hasRequired && !hasErrors;
  };

  const resetForm = () => {
    setForm({
      title: "",
      value: "",
      currency: "INR",
      stage: "Prospecting",
      company: "",
      assignedTo: "",
      dealType: "",
      expectedCloseDate: "",
      priority: "Medium",
      contractStartDate: "",
      contractEndDate: "",
      renewalDate: "",
      billingFrequency: "",
      poNumber: "",
      referenceNumber: "",
      notes: "",
    });
    setContractOpen(false);
    setFormErrors({});
    setEditingDealId(null);
  };

  const handleEditDeal = (deal: Deal) => {
    const d = deal as any;
    setForm({
      title: d.title,
      value: d.value?.toString() || "",
      currency: d.currency || "INR",
      stage: d.stage,
      company: d.company || "",
      assignedTo: d.assignedTo || "",
      dealType: d.dealType || "",
      expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().split("T")[0] : "",
      priority: d.priority || "Medium",
      contractStartDate: d.contractStartDate ? new Date(d.contractStartDate).toISOString().split("T")[0] : "",
      contractEndDate: d.contractEndDate ? new Date(d.contractEndDate).toISOString().split("T")[0] : "",
      renewalDate: d.renewalDate ? new Date(d.renewalDate).toISOString().split("T")[0] : "",
      billingFrequency: d.billingFrequency || "",
      poNumber: d.poNumber || "",
      referenceNumber: d.referenceNumber || "",
      notes: d.notes || "",
    });
    setEditingDealId(deal._id);
    setIsDetailsOpen(false);
    setTimeout(() => setIsFormOpen(true), 200);
  };

  const handleDeleteDeal = (dealId: string, title: string) => {
    setConfirmDialog({
      title: `Delete "${title}"?`,
      message: "This record will be moved to Trash and can be restored later.",
      confirmLabel: "Move to Trash",
      destructive: false,
      onConfirm: async () => {
        try {
          await softDeleteDealMutation({ id: dealId as any });
          if (selectedDeal?._id === dealId) {
            setIsDetailsOpen(false);
            setSelectedDeal(null);
          }
          toast("success", "Deal moved to trash.");
        } catch (err: any) {
          toast("error", err.message || "Failed to delete deal");
        }
      },
    });
  };

  const handleArchiveDeal = async (dealId: string) => {
    try {
      await archiveDealMutation({ id: dealId as any });
      if (selectedDeal?._id === dealId) {
        setIsDetailsOpen(false);
        setSelectedDeal(null);
      }
      toast("success", "Deal archived.");
    } catch (err: any) {
      toast("error", err.message || "Failed to archive deal");
    }
  };

  const handleRestoreDeal = (dealId: string, title: string) => {
    setConfirmDialog({
      title: `Restore "${title}"?`,
      message: "This deal will be returned to active deals.",
      confirmLabel: "Restore",
      destructive: false,
      onConfirm: async () => {
        try {
          await restoreDealMutation({ id: dealId as any });
          if (selectedDeal?._id === dealId) {
            setIsDetailsOpen(false);
            setSelectedDeal(null);
          }
          toast("success", "Deal restored.");
        } catch (err: any) {
          toast("error", err.message || "Failed to restore deal");
        }
      },
    });
  };

  const handlePermanentDelete = (dealId: string, title: string) => {
    setConfirmDialog({
      title: `Delete "${title}" permanently?`,
      message: "This action cannot be undone.",
      confirmLabel: "Delete Permanently",
      destructive: true,
      onConfirm: async () => {
        try {
          await removeDealMutation({ id: dealId as any });
          if (selectedDeal?._id === dealId) {
            setIsDetailsOpen(false);
            setSelectedDeal(null);
          }
          toast("success", "Deal permanently deleted.");
        } catch (err: any) {
          toast("error", err.message || "Failed to delete deal");
        }
      },
    });
  };

  const handleClearTrash = async () => {
    const trashCount = deals?.filter((d: any) => d.isDeleted).length || 0;
    if (trashCount === 0) {
      toast("info", "Trash is already empty.");
      return;
    }
    if (window.confirm(`Permanently delete all ${trashCount} deal(s) in Trash? This action cannot be undone.`)) {
      try {
        const result = await clearTrashMutation({});
        setSelectedDeal(null);
        setIsDetailsOpen(false);
        toast("success", `${result.deleted} deal(s) permanently deleted.`);
      } catch (err: any) {
        toast("error", err.message || "Failed to clear trash");
      }
    }
  };

  const handlePermanentDeleteDeal = async (dealId: string, title: string) => {
    if (window.confirm(`Permanently delete "${title}"? This action cannot be undone.`)) {
      try {
        await removeDealMutation({ id: dealId as any });
        if (selectedDeal?._id === dealId) {
          setIsDetailsOpen(false);
          setSelectedDeal(null);
        }
        toast("success", "Deal permanently deleted.");
      } catch (err: any) {
        toast("error", err.message || "Failed to permanently delete deal");
      }
    }
  };

  const dateToTimestamp = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined;
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d.getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setIsSubmitting(true);

    const payload: any = {
      title: form.title.trim(),
      value: Number(form.value),
      currency: form.currency,
      stage: form.stage,
      status: form.stage === "Closed Won" ? "Won" : form.stage === "Closed Lost" ? "Lost" : "Pipeline",
      company: form.company.trim(),
      assignedTo: form.assignedTo ? form.assignedTo : undefined,
      dealType: form.dealType || undefined,
      expectedCloseDate: dateToTimestamp(form.expectedCloseDate),
      priority: form.priority || undefined,
      contractStartDate: dateToTimestamp(form.contractStartDate),
      contractEndDate: dateToTimestamp(form.contractEndDate),
      renewalDate: dateToTimestamp(form.renewalDate),
      billingFrequency: form.billingFrequency || undefined,
      poNumber: form.poNumber.trim() || undefined,
      referenceNumber: form.referenceNumber.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (editingDealId) {
        await updateDealMutation({ id: editingDealId as any, ...payload });
        toast("success", "Deal updated successfully.");
      } else {
        await createDealMutation(payload);
        toast("success", "Deal created successfully.");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      toast("error", err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Stage Change Workflow Enforcer (Forward-Only) ───
  const stageOrder: Record<string, number> = {
    Prospecting: 1, Qualification: 2, Proposal: 3, Negotiation: 4,
    "Verbal Commit": 5, "Closed Won": 6, "Closed Lost": 7,
  };
  const terminalStages = new Set(["Closed Won", "Closed Lost"]);

  const isForwardTransition = (from: string, to: string) => {
    return (stageOrder[to] || 0) > (stageOrder[from] || 0);
  };

  const validateAndTriggerStageChange = (
    dealId: string,
    targetStage: string,
    onConfirm: (extraFields: Record<string, string>) => void
  ) => {
    const deal = localDeals?.find(d => d._id === dealId);
    if (!deal) return;

    if (deal.stage === targetStage) return;

    // Forward-only validation
    if (terminalStages.has(deal.stage)) {
      toast("error", "This deal has reached a terminal stage and cannot be moved. Only a Workspace Owner or Administrator can reopen it.");
      return;
    }

    if (!isForwardTransition(deal.stage, targetStage)) {
      toast("error", `This deal has already progressed beyond this stage and cannot be moved backwards.`);
      return;
    }

    if (targetStage === "Closed Lost") {
      setPendingStageChange({ dealId, targetStage, onConfirm });
      setIsClosedLostModalOpen(true);
    } else {
      onConfirm({});
    }
  };

  const handleStageChangeSubmit = async (
    dealId: string,
    targetStage: string,
    extraFields: Record<string, string>
  ) => {
    const deal = localDeals?.find(d => d._id === dealId);
    if (!deal) return;

    // Optimistic Update
    setLocalDeals(prev => {
      if (!prev) return null;
      return prev.map(d => {
        if (d._id === dealId) {
          const stageProbabilities: Record<string, number> = {
            Prospecting: 10,
            Qualification: 25,
            Proposal: 50,
            Negotiation: 75,
            "Verbal Commit": 90,
            "Closed Won": 100,
            "Closed Lost": 0,
          };
          return {
            ...d,
            stage: targetStage,
            probability: stageProbabilities[targetStage] ?? 10,
            status: targetStage === "Closed Won" ? "Won" : targetStage === "Closed Lost" ? "Lost" : "Pipeline",
            ...extraFields,
          };
        }
        return d;
      });
    });

    try {
      await updateDealMutation({
        id: dealId as any,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        company: deal.company,
        assignedTo: deal.assignedTo as any,
        leadId: deal.leadId as any,
        workspaceId: deal.workspaceId as any,
        contactId: deal.contactId as any,
        stage: targetStage,
        status: targetStage === "Closed Won" ? "Won" : targetStage === "Closed Lost" ? "Lost" : "Pipeline",
        ...extraFields,
      });

      // Update selectedDeal details if open
      if (selectedDeal?._id === dealId) {
        setSelectedDeal(prev => prev ? {
          ...prev,
          stage: targetStage,
          status: targetStage === "Closed Won" ? "Won" : targetStage === "Closed Lost" ? "Lost" : "Pipeline",
          ...extraFields
        } : null);
      }

      toast("success", `Deal moved to ${targetStage}`);

      if (targetStage === "Closed Won") {
        setWonCelebrationTitle(deal.title);
        setIsClosedWonSuccessModalOpen(true);
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to update deal stage");
      // Revert optimistic update
      if (deals) {
        setLocalDeals(deals);
      }
    }
  };

  // ─── Drag and Drop Card Handlers ───
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;

    validateAndTriggerStageChange(dealId, targetStage, (extra) => {
      handleStageChangeSubmit(dealId, targetStage, extra);
    });
  };

  // ─── Excel Export Logic ───
  const handleExport = async () => {
    if (!filteredDeals) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Deals Pipeline");

      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }
      ];

      // Double-row header
      const headerRow1 = worksheet.getRow(1);
      headerRow1.height = 30;
      headerRow1.getCell(1).value = "Deal & Company Information";
      headerRow1.getCell(5).value = "Pipeline Details";
      headerRow1.getCell(9).value = "Dates";

      worksheet.mergeCells("A1:D1");
      worksheet.mergeCells("E1:H1");

      const primaryIndigoFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
      const whiteBoldFont = { name: 'Inter', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      const centerAlignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'C7D2FE' } },
        left: { style: 'thin', color: { argb: 'C7D2FE' } },
        bottom: { style: 'thin', color: { argb: 'C7D2FE' } },
        right: { style: 'thin', color: { argb: 'C7D2FE' } }
      };

      for (let col = 1; col <= 9; col++) {
        const cell = headerRow1.getCell(col);
        cell.fill = primaryIndigoFill as any;
        cell.font = whiteBoldFont;
        cell.alignment = centerAlignment as any;
        cell.border = thinBorder as any;
      }

      const subHeaders = [
        "Deal Title", "Company", "Owner", "Status",
        "Stage", "Probability", "Currency", "Value",
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

      filteredDeals.forEach((d, rowIndex) => {
        const row = worksheet.getRow(rowIndex + 3);
        row.height = 20;

        const assignedName = users?.find((u: any) => u._id === d.assignedTo)?.name || "Unassigned";

        const data = [
          d.title,
          d.company || "—",
          assignedName,
          d.status,
          d.stage,
          `${d.probability ?? 10}%`,
          d.currency || "INR",
          d.value !== undefined ? formatCurrency(d.value, d.currency || "INR") : "—",
          new Date(d.createdAt).toLocaleDateString(),
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
            horizontal: colIndex === 0 || colIndex === 1 ? 'left' : 'center'
          } as any;
        });
      });

      worksheet.autoFilter = {
        from: { row: 2, column: 1 },
        to: { row: 2, column: 9 }
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deals-pipeline-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast("success", "Deals exported successfully.");
    } catch (err: any) {
      toast("error", err.message || "Failed to export deals");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Filter & Search Logic on Local State ───
  const filteredDeals = localDeals?.filter(d => {
    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase().trim();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchCompany = d.company?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) return false;
    }
    // Assigned
    if (assignedFilter !== "all" && d.assignedTo !== assignedFilter) return false;
    // Currency
    if (currencyFilter !== "all" && (d.currency || "INR") !== currencyFilter) return false;
    // Stage
    if (stageFilter !== "all" && d.stage !== stageFilter) return false;

    return true;
  });

  const searchOwnerFilteredDeals = localDeals?.filter(d => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase().trim();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchCompany = d.company?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) return false;
    }
    if (assignedFilter !== "all" && d.assignedTo !== assignedFilter) return false;
    if (currencyFilter !== "all" && (d.currency || "INR") !== currencyFilter) return false;
    return true;
  });

  const mobileDisplayDeals = searchOwnerFilteredDeals?.filter(d => d.stage === mobileSelectedStage) || [];

  const getMobileStageCount = (stageVal: string) => {
    return searchOwnerFilteredDeals?.filter(d => d.stage === stageVal).length || 0;
  };

  // Calculate Column Totals per currency
  const getStageTotal = (stage: string) => {
    const stageDeals = filteredDeals?.filter(d => d.stage === stage) || [];
    const totals: Record<string, number> = {};
    for (const d of stageDeals) {
      const cur = d.currency || "INR";
      totals[cur] = (totals[cur] || 0) + (d.value || 0);
    }
    return totals;
  };

  // ─── Stat calculation from centralized analytics ───
  const totalPipeline: Record<string, number> = analytics?.totalPipelineValue ?? {};
  const weightedPipeline: Record<string, number> = analytics?.weightedPipelineValue ?? {};
  const closedRevenue: Record<string, number> = analytics?.closedRevenue ?? {};
  const wonCount = analytics?.wonCount ?? 0;
  const lostCount = analytics?.lostCount ?? 0;
  const totalClosed = wonCount + lostCount;
  const winRate = analytics ? Math.round(analytics.winRate) : 0;



  const isLoading = localDeals === null;

  return (
    <div className="space-y-6 max-w-8xl pb-6 p-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Deals Pipeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {localDeals ? `${localDeals.length} total deals in process` : "Loading pipeline..."}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
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
            <Plus className="w-4 h-4" /> New Deal
          </button>
        </div>
      </div>

      {/* Pipeline Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {[
            { key: "active", label: "Active" },
            { key: "archived", label: "Archived" },
            { key: "trash", label: "Trash" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPipelineFilter(tab.key)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
                pipelineFilter === tab.key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {pipelineFilter === "trash" && (
          <button
            onClick={handleClearTrash}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Trash
          </button>
        )}
      </div>

      {/* Top Metrics Row */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Pipeline"
            value={
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                {Object.keys(totalPipeline).length === 0 ? (
                  <span className="text-xl font-bold text-slate-900 dark:text-white">—</span>
                ) : (
                  Object.entries(totalPipeline).map(([cur, val]) => (
                    <span key={cur} className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {formatCurrency(val, cur)}
                    </span>
                  ))
                )}
              </div>
            }
            subLabel="Sum of all active deals"
            Icon={Briefcase}
            iconBg="bg-indigo-500"
          />

          <StatCard
            title="Weighted Pipeline"
            value={
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                {Object.keys(weightedPipeline).length === 0 ? (
                  <span className="text-xl font-bold text-slate-900 dark:text-white">—</span>
                ) : (
                  Object.entries(weightedPipeline).map(([cur, val]) => (
                    <span key={cur} className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {formatCurrency(Math.round(val), cur)}
                    </span>
                  ))
                )}
              </div>
            }
            subLabel="Value multiplied by probability"
            Icon={Sparkles}
            iconBg="bg-purple-500"
          />

          <StatCard
            title="Closed Won Revenue"
            value={
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                {Object.keys(closedRevenue).length === 0 ? (
                  <span className="text-xl font-bold text-slate-900 dark:text-white">—</span>
                ) : (
                  Object.entries(closedRevenue).map(([cur, val]) => (
                    <span key={cur} className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                      {formatCurrency(val, cur)}
                    </span>
                  ))
                )}
              </div>
            }
            subLabel="Closed Won deals total value"
            Icon={CheckCircle2}
            iconBg="bg-emerald-500"
          />

          <StatCard
            title="Pipeline Win Rate"
            value={
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {winRate}%
              </span>
            }
            subLabel={`${wonCount} won / ${totalClosed} closed deals`}
            Icon={Percent}
            iconBg="bg-orange-500"
          />
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"><Search className="w-4 h-4" /></div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search deals by title or company name..."
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden shadow-sm"
          >
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Owner</label>
              <Select
                options={ownerOptions}
                value={assignedFilter}
                onChange={(v) => updateSearchParams("assignedTo", v)}
                placeholder="All Owners"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Currency</label>
              <Select
                options={currencyOptions}
                value={currencyFilter}
                onChange={(v) => updateSearchParams("currency", v)}
                placeholder="All Currencies"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider">Pipeline Stage</label>
              <DealStageSelect
                value={stageFilter}
                onChange={(v) => updateSearchParams("stage", v)}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button onClick={handleClearFilters} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Responsive Layout: Mobile Selector & Lists vs. Desktop Kanban Board ─── */}
      {isMobileLayout ? (
        // Mobile Layout
        <div className="space-y-4">
          {/* Horizontally Scrollable Stage Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin snap-x">
            {dealStageOptions.map((stg) => {
              const count = getMobileStageCount(stg.value);
              const isActive = mobileSelectedStage === stg.value;
              return (
                <button
                  key={stg.value}
                  onClick={() => setMobileSelectedStage(stg.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap snap-align-start transition-all cursor-pointer shadow-2xs border",
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <span>{stg.emoji}</span>
                  <span>{stg.label}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-extrabold",
                      isActive ? "bg-indigo-700 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Deal Cards list */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {mobileDisplayDeals.map((d) => {
                const assignedUser = users?.find((u: any) => u._id === d.assignedTo);
                const ownerInitials = assignedUser
                  ? assignedUser.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "UA";

                const priorityColors: Record<string, string> = {
                  High: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
                  Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30",
                  Low: "bg-slate-50 text-slate-705 border-slate-200 dark:bg-slate-900/35 dark:text-slate-400 dark:border-slate-800",
                };

                return (
                  <motion.div
                    key={d._id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700/60 p-4.5 shadow-xs flex flex-col gap-3 relative"
                  >
                    {/* Top Row: Title and 3-dot Menu */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1" onClick={() => { setSelectedDeal(d); setIsDetailsOpen(true); }}>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                          {d.title}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-505 mt-1 flex items-center gap-1.5 font-semibold">
                          <Building className="w-3.5 h-3.5" />
                          <span>{d.company || "No Company"}</span>
                        </p>
                      </div>

                      {/* Three dot actions */}
                      <div className="relative" data-deals-menu>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuDealId(activeMenuDealId === d._id ? null : d._id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuDealId === d._id && (
                          <div className="absolute right-0 top-9 z-20 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl shadow-lg py-1.5 w-44 animate-in fade-in duration-100">
                            {d.isDeleted ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestoreDeal(d._id, d.title);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePermanentDelete(d._id, d.title);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20"
                                >
                                  Delete Permanently
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeal(d);
                                    setIsDetailsOpen(true);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDeal(d);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                  Edit Deal
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStageChangeDealId(d._id);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                  Change Stage
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveDeal(d._id);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                  Archive
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDeal(d._id, d.title);
                                    setActiveMenuDealId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20"
                                >
                                  Move to Trash
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Priority, Owner, and Date */}
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                      {d.priority && (
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", priorityColors[d.priority] || priorityColors.Medium)}>
                          {d.priority} Priority
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-slate-450" />
                        <span className="font-medium">{assignedUser?.name || "Unassigned"}</span>
                      </div>

                      {d.expectedCloseDate && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-455" />
                          <span className="font-medium">Close: {new Date(d.expectedCloseDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Value & Progress */}
                    <div className="flex items-center justify-between gap-4 mt-1 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(d.value, d.currency || "INR")}
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {d.probability ?? 10}%
                        </span>
                        <div className="w-20 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${d.probability ?? 10}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {mobileDisplayDeals.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No deals found in this stage
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        // Desktop Kanban Board
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none">
            {dealStageOptions.map(col => {
              const columnDeals = filteredDeals?.filter(d => d.stage === col.value) || [];
              const colTotals = getStageTotal(col.value);

              return (
                <div
                  key={col.value}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, col.value)}
                  className="flex-shrink-0 w-72 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/80 p-3.5 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-start justify-between mb-3 px-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{col.emoji}</span>
                        <span className="text-xs font-bold text-slate-855 dark:text-slate-200 tracking-tight leading-none">{col.label}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-bold ml-1">
                          {columnDeals.length}
                        </span>
                      </div>
                      {/* Sum of Deals in Column */}
                      <div className="mt-1 px-5">
                        {Object.keys(colTotals).length === 0 ? (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Deals</span>
                        ) : (
                          Object.entries(colTotals).map(([cur, sum]) => (
                            <span key={cur} className="text-[10px] text-slate-550 dark:text-slate-400 font-extrabold block">
                              {formatCurrency(sum, cur)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-1.5 scrollbar-thin">
                    {columnDeals.map(d => {
                      const assignedUser = users?.find((u: any) => u._id === d.assignedTo);
                      const ownerInitials = assignedUser
                        ? assignedUser.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "UA";

                      return (
                        <motion.div
                          key={d._id}
                          draggable
                          onDragStart={(e: any) => handleDragStart(e, d._id)}
                          onClick={() => { setSelectedDeal(d); setIsDetailsOpen(true); }}
                          whileHover={{ y: -2, boxShadow: "0 8px 30px -10px rgba(0,0,0,0.06)" }}
                          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-xs hover:border-slate-205 dark:hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing group relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-xs text-slate-905 dark:text-slate-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {d.title}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded flex-shrink-0">
                              {d.probability ?? 10}%
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 dark:text-slate-505 mt-1 flex items-center gap-1 font-medium">
                            <Building className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{d.company || "No Company"}</span>
                          </p>

                          <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-50 dark:border-slate-700/40">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {formatCurrency(d.value, d.currency || "INR")}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              <div
                                title={assignedUser?.name || "Unassigned"}
                                className="w-5.5 h-5.5 rounded-full bg-slate-100 dark:bg-slate-700 border border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-650 dark:text-slate-300"
                              >
                                {ownerInitials}
                              </div>
                              <span className="text-[9px] text-slate-400">
                                {Math.round((Date.now() - d.createdAt) / (1000 * 60 * 60 * 24))}d
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {columnDeals.length === 0 && (
                      <div className="py-8 text-center text-[10px] text-slate-400 dark:text-slate-550 border border-dashed border-slate-205/60 dark:border-slate-800/80 rounded-2xl">
                        Drag deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ─── Create/Edit Deal Drawer Form ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormOpen(false)} className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" />
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
                    {editingDealId ? "Edit Deal Details" : "Create New Deal"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fill in the fields below to update the deals pipeline</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Deal Title *</label>
                  <input
                    type="text"
                    ref={titleRef}
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="E.g. Acme Corp Enterprise License"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                  />
                  {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Company Name *</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Deal Value *</label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          step="any"
                          name="value"
                          value={form.value}
                          onChange={handleInputChange}
                          placeholder="50000"
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="w-[120px] flex-shrink-0">
                        <Select
                          options={currencyOptions}
                          value={form.currency}
                          onChange={(val) => setForm(prev => ({ ...prev, currency: val }))}
                        />
                      </div>
                    </div>
                    {formErrors.value && <p className="text-xs text-red-500 mt-1">{formErrors.value}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Owner / Assigned To</label>
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
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Pipeline Stage</label>
                  <DealStageSelect
                    value={form.stage}
                    onChange={(val) => setForm(prev => ({ ...prev, stage: val }))}
                  />
                </div>

                {/* ───── Section 2: Deal Type (Optional) ───── */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Deal Type
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium ml-auto">Optional</span>
                  </div>
                  <Select
                    options={[
                      { value: "One-Time Sale", label: "One-Time Sale" },
                      { value: "Service Agreement", label: "Service Agreement" },
                      { value: "Project-Based", label: "Project-Based" },
                      { value: "Recurring Contract", label: "Recurring Contract" },
                      { value: "Subscription", label: "Subscription" },
                      { value: "Maintenance Contract", label: "Maintenance Contract" },
                      { value: "Custom", label: "Custom" },
                    ]}
                    value={form.dealType}
                    onChange={(val) => setForm(prev => ({ ...prev, dealType: val }))}
                    placeholder="Select a deal type..."
                  />
                </div>

                {/* ───── Section 3: Contract Details (Collapsible) ───── */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setContractOpen(!contractOpen)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Contract Details
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium ml-auto">
                      {contractOpen ? "Click to collapse" : "Optional \u00B7 Click to expand"}
                    </span>
                    {contractOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {contractOpen && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Contract Start Date</label>
                          <input
                            type="date"
                            value={form.contractStartDate}
                            onChange={(e) => setForm(prev => ({ ...prev, contractStartDate: e.target.value }))}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Contract End Date</label>
                          <input
                            type="date"
                            value={form.contractEndDate}
                            onChange={(e) => setForm(prev => ({ ...prev, contractEndDate: e.target.value }))}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Renewal Date</label>
                          <input
                            type="date"
                            value={form.renewalDate}
                            onChange={(e) => setForm(prev => ({ ...prev, renewalDate: e.target.value }))}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Billing Frequency</label>
                          <Select
                            options={[
                              { value: "One-Time", label: "One-Time" },
                              { value: "Monthly", label: "Monthly" },
                              { value: "Quarterly", label: "Quarterly" },
                              { value: "Semi-Annual", label: "Semi-Annual" },
                              { value: "Annual", label: "Annual" },
                              { value: "Custom", label: "Custom" },
                            ]}
                            value={form.billingFrequency}
                            onChange={(val) => setForm(prev => ({ ...prev, billingFrequency: val }))}
                            placeholder="Select billing..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Purchase Order Number</label>
                          <input
                            type="text"
                            value={form.poNumber}
                            onChange={(e) => setForm(prev => ({ ...prev, poNumber: e.target.value }))}
                            placeholder="e.g. PO-2024-001"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Reference Number</label>
                          <input
                            type="text"
                            value={form.referenceNumber}
                            onChange={(e) => setForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                            placeholder="e.g. REF-001"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Notes</label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)] resize-none"
                          placeholder="Additional notes about this deal..."
                        />
                      </div>
                    </div>
                  )}
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
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingDealId ? "Save Changes" : "Create Deal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Deal Details side Drawer ─── */}
      <AnimatePresence>
        {isDetailsOpen && selectedDeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailsOpen(false)} className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" />
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
                    <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{selectedDeal.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedDeal.company || "No Company linked"}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedDeal(null); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Status Header with DealStageSelect / Mobile override */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-100 dark:border-slate-700/40">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Deal Stage Workflow</span>
                  {isSmallMobile ? (
                    <button
                      type="button"
                      onClick={() => setStageChangeDealId(selectedDeal._id)}
                      className="flex w-full h-11 items-center justify-between px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base flex-shrink-0">
                          {dealStageOptions.find(o => o.value === selectedDeal.stage)?.emoji || "🔍"}
                        </span>
                        <span className="font-semibold text-slate-955 dark:text-slate-50">
                          {dealStageOptions.find(o => o.value === selectedDeal.stage)?.label || selectedDeal.stage}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-bold">
                          {dealStageOptions.find(o => o.value === selectedDeal.stage)?.probability ?? 10}%
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
                    </button>
                  ) : (
                    <DealStageSelect
                      value={selectedDeal.stage}
                      onChange={(val) => {
                        validateAndTriggerStageChange(
                          selectedDeal._id,
                          val,
                          (extra) => {
                            handleStageChangeSubmit(selectedDeal._id, val, extra);
                          }
                        );
                      }}
                      currentStage={selectedDeal.stage}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1 text-left sm:text-right flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Deal Value</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(selectedDeal.value, selectedDeal.currency || "INR")}
                  </span>
                </div>
              </div>

              {/* Deal & Contact Information details */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Linked Records & Ownership</h4>
                <div className="space-y-3 bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5">
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>Company: <strong className="text-slate-900 dark:text-white">{selectedDeal.company || "—"}</strong></span>
                  </div>
                  {selectedDeal.workspaceId && (
                    <div className="flex items-center gap-3 text-sm pl-7 text-indigo-650 dark:text-indigo-400">
                      <a href={`/contacts?search=${encodeURIComponent(selectedDeal.company || "")}`} className="hover:underline text-xs font-semibold flex items-center gap-1">
                        View linked contacts <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Probability: <strong className="text-slate-900 dark:text-white">{selectedDeal.probability ?? 10}%</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>
                      Owner: <strong className="text-slate-900 dark:text-white">{users?.find((u: any) => u._id === selectedDeal.assignedTo)?.name || "Unassigned"}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Metadata */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dates & History</h4>
                <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 text-sm text-slate-700 dark:text-slate-305">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Deal Created</p>
                    <p className="font-semibold">{new Date(selectedDeal.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                    <p className="font-semibold">{new Date(selectedDeal.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {selectedDeal.stageChangedAt && (
                    <div className="col-span-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                      <p className="text-xs text-slate-400 mb-1">Last Stage Change</p>
                      <p className="font-medium">
                        Moved to <strong>{selectedDeal.stage}</strong> by <strong>{selectedDeal.stageChangedBy || "System"}</strong> on {new Date(selectedDeal.stageChangedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Exit status reason panel */}
              {selectedDeal.stage === "Closed Lost" && selectedDeal.lostReason && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">Lost Details</h4>
                  <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 space-y-3.5 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Lost Reason</p>
                      <p className="font-bold text-red-700 dark:text-red-400 mt-0.5">{selectedDeal.lostReason}</p>
                      {selectedDeal.lostNotes && (
                        <div className="mt-2.5 p-3 bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/60 whitespace-pre-wrap leading-relaxed">
                          {selectedDeal.lostNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Won tasks generation status panel */}
              {selectedDeal.stage === "Closed Won" && (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">Closed Won Automated Tasks</h4>
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 space-y-2.5 text-xs text-slate-650 dark:text-slate-400">
                    <p className="font-medium text-slate-800 dark:text-slate-200">The following tasks were automatically generated and assigned:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Onboarding Task (Kickoff, credentials set up)</li>
                      <li>Implementation Setup Task (Developer deployment)</li>
                      <li>Invoice Generation Placeholder Task</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Pipeline History
                </h4>
                {dealActivities === undefined ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ) : dealActivities.length === 0 ? (
                  <p className="text-xs text-slate-450 italic px-2">No activity events recorded.</p>
                ) : (
                  <div className="relative pl-4 border-l border-slate-200 dark:border-slate-750 space-y-5 ml-2.5 py-1">
                    {dealActivities.map((a) => {
                      let IconComponent = Clock;
                      let iconColor = "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
                      
                      if (a.type === "deal_created") {
                        IconComponent = Plus;
                        iconColor = "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400";
                      } else if (a.type === "deal_won") {
                        IconComponent = CheckCircle2;
                        iconColor = "text-emerald-650 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400";
                      } else if (a.type === "deal_lost") {
                        IconComponent = XCircle;
                        iconColor = "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400";
                      } else if (a.type === "deal_stage_changed") {
                        IconComponent = ArrowRight;
                        iconColor = "text-violet-650 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400";
                      }

                      return (
                        <div key={a._id} className="relative group">
                          <div className={`absolute -left-[24px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-800 shadow-sm ${iconColor} z-10`}>
                            <IconComponent className="w-2.5 h-2.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-805 dark:text-slate-205">
                              {a.description}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              by {a.userName || "System"} • {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                {selectedDeal.isDeleted ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRestoreDeal(selectedDeal._id, selectedDeal.title)}
                      className="flex-1 min-w-[100px] h-12 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(selectedDeal._id, selectedDeal.title)}
                      className="px-4 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-650 dark:text-red-400 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Permanently
                    </button>
                  </>
                ) : selectedDeal.isArchived ? (
                  <button
                    type="button"
                    onClick={() => handleRestoreDeal(selectedDeal._id, selectedDeal.title)}
                    className="flex-1 min-w-[100px] h-12 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Restore
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditDeal(selectedDeal)}
                      className="flex-1 min-w-[100px] h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveDeal(selectedDeal._id)}
                      className="flex-1 min-w-[100px] h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400 font-semibold text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDeal(selectedDeal._id, selectedDeal.title)}
                      className="px-4 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-650 dark:text-red-400 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Move to Trash
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Exit Workflow Modals ─── */}
      <ClosedLostModal
        open={isClosedLostModalOpen}
        onClose={() => {
          setIsClosedLostModalOpen(false);
          setPendingStageChange(null);
        }}
        onConfirm={(data) => {
          if (pendingStageChange) {
            handleStageChangeSubmit(pendingStageChange.dealId, pendingStageChange.targetStage, {
              lostReason: data.reason,
              lostNotes: data.notes || "",
            });
          }
          setIsClosedLostModalOpen(false);
          setPendingStageChange(null);
        }}
      />

      <ClosedWonSuccessModal
        open={isClosedWonSuccessModalOpen}
        onClose={() => setIsClosedWonSuccessModalOpen(false)}
        dealTitle={wonCelebrationTitle}
      />

      {/* ─── Change Stage Responsive UI (Bottom Sheet / Overlay Modal) ─── */}
      <AnimatePresence>
        {stageChangeDealId && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[rgba(15,23,42,0.55)] backdrop-blur-xs">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setStageChangeDealId(null)} />

            {isSmallMobile ? (
              // Mobile Bottom Sheet
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative bg-white dark:bg-slate-800 rounded-t-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col z-10 max-h-[85vh]"
              >
                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto my-3 flex-shrink-0" />
                <div className="px-5 pb-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Change Deal Stage</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-505 mt-0.5">Select a stage workflow status below</p>
                  </div>
                  <button onClick={() => setStageChangeDealId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh] pr-1.5 scrollbar-thin">
                  {dealStageOptions.map((stg) => {
                    const targetDeal = localDeals?.find(d => d._id === stageChangeDealId);
                    const isCurrent = targetDeal?.stage === stg.value;
                    const orderFrom = stageOrder[targetDeal?.stage || "Prospecting"] || 0;
                    const orderTo = stageOrder[stg.value] || 0;
                    const isAllowed = isCurrent || (orderFrom < 6 && orderTo > orderFrom);

                    return (
                      <label
                        key={stg.value}
                        onClick={() => {
                          if (!isAllowed) {
                            if (orderFrom >= 6) {
                              toast("error", "This deal has reached a terminal stage and cannot be moved.");
                            } else {
                              toast("error", "This deal has already progressed beyond this stage and cannot be moved backwards.");
                            }
                            return;
                          }
                          setStageChangeDealId(null);
                          validateAndTriggerStageChange(
                            stageChangeDealId,
                            stg.value,
                            (extra) => {
                              handleStageChangeSubmit(stageChangeDealId, stg.value, extra);
                            }
                          );
                        }}
                        className={cn(
                          "flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer min-h-[44px]",
                          isCurrent
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500"
                            : isAllowed
                              ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                              : "bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/50 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0 pr-2">
                          <span className="text-lg mt-0.5">{stg.emoji}</span>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{stg.label}</span>
                              <span className="text-[9px] font-extrabold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded">
                                {stg.probability}%
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{stg.description}</p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="mobile-stage-select"
                          checked={isCurrent}
                          readOnly
                          className="mt-1 focus:ring-indigo-500 h-4.5 w-4.5 text-indigo-600 border-slate-305 dark:border-slate-700"
                        />
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              // Desktop/Tablet Centered Modal Dropdown
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col z-10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Select Stage</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Move this deal to another stage</p>
                  </div>
                  <button onClick={() => setStageChangeDealId(null)} className="p-1.5 text-slate-400 hover:text-slate-605 dark:hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {dealStageOptions.map((stg) => {
                    const targetDeal = localDeals?.find(d => d._id === stageChangeDealId);
                    const isCurrent = targetDeal?.stage === stg.value;
                    const orderFrom = stageOrder[targetDeal?.stage || "Prospecting"] || 0;
                    const orderTo = stageOrder[stg.value] || 0;
                    const isAllowed = isCurrent || (orderFrom < 6 && orderTo > orderFrom);

                    return (
                      <button
                        key={stg.value}
                        onClick={() => {
                          if (!isAllowed) {
                            if (orderFrom >= 6) {
                              toast("error", "This deal has reached a terminal stage and cannot be moved.");
                            } else {
                              toast("error", "This deal has already progressed beyond this stage and cannot be moved backwards.");
                            }
                            return;
                          }
                          setStageChangeDealId(null);
                          validateAndTriggerStageChange(
                            stageChangeDealId,
                            stg.value,
                            (extra) => {
                              handleStageChangeSubmit(stageChangeDealId, stg.value, extra);
                            }
                          );
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer",
                          isCurrent
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-700 dark:text-indigo-400"
                            : isAllowed
                              ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                              : "bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-850/50 text-slate-400 opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{stg.emoji}</span>
                          <span>{stg.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {stg.probability}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ─── Confirm Dialog ─── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" onClick={() => setConfirmDialog(null)} />
          <div className="relative z-10 w-[calc(100%-2rem)] sm:w-full max-w-sm bg-white dark:bg-slate-800 rounded-[20px] border border-slate-200 dark:border-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.12)] p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer",
                  confirmDialog.destructive
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DealsPage;
