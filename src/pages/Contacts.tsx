import React, { useState, useEffect, useRef } from "react";
import { Mail, Phone, Plus, X, Search, User, Tag, AlertCircle, Loader2, Edit, Trash2, Copy, ExternalLink, Check, Calendar, Clock, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/Toast";
import ExcelJS from "exceljs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  status: string;
  tags: string[];
  createdAt: string | number;
  updatedAt: string | number;
  workPhone?: string;
  website?: string;
  linkedinUrl?: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  profileImage?: string;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all cursor-pointer flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}



const CONTACT_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-orange-500"
];

// Status badge styling helper
function getStatusBadgeConfig(status: string) {
  switch (status.toLowerCase()) {
    case "lead":
      return { label: "Lead", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    case "prospect":
      return { label: "Prospect", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" };
    case "customer":
    case "active":
      return { label: "Customer", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    case "inactive":
    default:
      return { label: "Inactive", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
  }
}

// Available Tags
const AVAILABLE_TAGS = ["Tech", "VIP", "Sales", "Partner", "Executive", "Enterprise", "Founder", "Startup", "Follow-up"];

export function ContactsPage() {
  return (
    <ErrorBoundary fallback={<ContactsError />}>
      <ContactsPageContent />
    </ErrorBoundary>
  );
}

function ContactsPageContent() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Convex Hooks
  const contactsData = useQuery(api.contacts.list, {});
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

  // Map contacts to have `id` as `_id` so we don't have to rewrite the JSX
  const contacts = contactsData
    ? contactsData.map((c) => ({ ...c, id: c._id }))
    : undefined;

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
    jobTitle: "",
    company: "",
    department: "",
    workPhone: "",
    website: "",
    linkedinUrl: "",
    tags: [] as string[],
    status: "Lead",
    notes: "",
    address: "",
    city: "",
    state: "",
    country: ""
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation & drawer closing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isEditOpen) {
          handleCloseDrawer();
        } else if (isDetailsOpen) {
          setIsDetailsOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditOpen, isDetailsOpen, form, editingContactId]);

  // Autofocus first input when drawer opens
  useEffect(() => {
    if (isEditOpen) {
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 150);
    }
  }, [isEditOpen]);



  useEffect(() => {
    if (searchParams.get("new") === "true") {
      resetForm();
      setIsEditOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const contactId = searchParams.get("contactId");
    if (contactId && contacts) {
      const match = contacts.find((c) => c.id === contactId);
      if (match) {
        setSelectedContact(match);
        setIsDetailsOpen(true);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.delete("contactId");
          return next;
        }, { replace: true });
      }
    }
  }, [searchParams, contacts, setSearchParams]);

  // Form dirtiness checker
  const isFormDirty = () => {
    return Object.values(form).some(val => {
      if (Array.isArray(val)) return val.length > 0;
      if (val === "Lead") return false; // Default status
      return val !== "";
    });
  };

  const handleCloseDrawer = () => {
    if (isFormDirty() && !editingContactId) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        resetForm();
        setIsEditOpen(false);
      }
    } else {
      resetForm();
      setIsEditOpen(false);
    }
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      profileImage: "",
      jobTitle: "",
      company: "",
      department: "",
      workPhone: "",
      website: "",
      linkedinUrl: "",
      tags: [],
      status: "Lead",
      notes: "",
      address: "",
      city: "",
      state: "",
      country: ""
    });
    setFormErrors({});
    setEditingContactId(null);
  };

  // Validators
  const validateField = (name: string, value: any) => {
    let error = "";
    if (name === "firstName" && !value.trim()) {
      error = "First Name is required";
    } else if (name === "lastName" && !value.trim()) {
      error = "Last Name is required";
    } else if (name === "company" && !value.trim()) {
      error = "Company is required";
    } else if (name === "email") {
      if (!value.trim()) {
        error = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address";
      } else if (contacts?.some(c => c.id !== editingContactId && c.email.toLowerCase() === value.trim().toLowerCase())) {
        error = "A contact with this email already exists";
      }
    } else if ((name === "phone" || name === "workPhone") && value) {
      if (/[^\d+\-\s()]/.test(value)) {
        error = "Phone number can only contain digits and +, -, (), spaces";
      }
    }
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const toggleTag = (tag: string) => {
    setForm(prev => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const isFormValid = () => {
    const requiredFields = ["firstName", "lastName", "email", "company"];
    const hasRequired = requiredFields.every(field => form[field as keyof typeof form]);
    const hasErrors = Object.values(formErrors).some(err => err);
    return hasRequired && !hasErrors;
  };

  const handleEditContact = (contact: Contact) => {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || "",
      profileImage: contact.profileImage || "",
      jobTitle: contact.jobTitle || "",
      company: contact.company,
      department: contact.department || "",
      workPhone: contact.workPhone || "",
      website: contact.website || "",
      linkedinUrl: contact.linkedinUrl || "",
      tags: contact.tags,
      status: contact.status,
      notes: contact.notes || "",
      address: contact.address || "",
      city: contact.city || "",
      state: contact.state || "",
      country: contact.country || ""
    });
    setEditingContactId(contact.id);
    setIsDetailsOpen(false);

    setTimeout(() => {
      setIsEditOpen(true);
    }, 200);
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContact({ id: contactId as any })
        .then(() => {
          if (selectedContact?.id === contactId) {
            setIsDetailsOpen(false);
            setSelectedContact(null);
          }
          toast("success", "Contact deleted successfully.");
        })
        .catch((err) => {
          toast("error", err.message || "Failed to delete contact.");
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
      status: form.status,
      tags: form.tags,
      workPhone: form.workPhone.trim() || undefined,
      website: form.website.trim() || undefined,
      linkedinUrl: form.linkedinUrl.trim() || undefined,
      department: form.department.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      notes: form.notes.trim() || undefined,
      profileImage: form.profileImage.trim() || undefined,
    };

    if (editingContactId) {
      updateContact({ id: editingContactId as any, ...payload })
        .then(() => {
          toast("success", "Contact updated successfully.");
          setIsEditOpen(false);
          setSelectedContact({
            ...payload,
            _id: editingContactId,
            id: editingContactId,
            createdAt: selectedContact?.createdAt || Date.now(),
            updatedAt: Date.now(),
          } as any);
          setTimeout(() => {
            setIsDetailsOpen(true);
          }, 250);
        })
        .catch((err) => {
          toast("error", err.message || "Failed to update contact.");
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      createContact(payload)
        .then(() => {
          toast("success", "Contact created successfully.");
          setIsEditOpen(false);
          resetForm();
        })
        .catch((err) => {
          toast("error", err.message || "Failed to create contact.");
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  // Add defensive loading state:
  if (contacts === undefined) {
    return <ContactsSkeleton />;
  }

  const filterContactsByDate = (contactsList: Contact[], preset: string, customStart?: string, customEnd?: string) => {
    const now = new Date();
    if (preset === "all") return contactsList;

    let minDate = new Date();

    switch (preset) {
      case "12months":
        minDate.setFullYear(now.getFullYear() - 1);
        break;
      case "6months":
        minDate.setMonth(now.getMonth() - 6);
        break;
      case "90days":
        minDate.setDate(now.getDate() - 90);
        break;
      case "60days":
        minDate.setDate(now.getDate() - 60);
        break;
      case "30days":
        minDate.setDate(now.getDate() - 30);
        break;
      case "28days":
        minDate.setDate(now.getDate() - 28);
        break;
      case "15days":
        minDate.setDate(now.getDate() - 15);
        break;
      case "7days":
        minDate.setDate(now.getDate() - 7);
        break;
      case "thismonth":
        minDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "lastmonth": {
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const startOfLastMonth = new Date(year, month, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return contactsList.filter(c => {
          const created = new Date(c.createdAt);
          return created >= startOfLastMonth && created <= endOfLastMonth;
        });
      }
      case "thisyear":
        minDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom": {
        if (!customStart) return [];
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        const end = customEnd ? new Date(customEnd) : new Date();
        end.setHours(23, 59, 59, 999);
        return contactsList.filter(c => {
          const created = new Date(c.createdAt);
          return created >= start && created <= end;
        });
      }
      default:
        return contactsList;
    }

    minDate.setHours(0, 0, 0, 0);
    return contactsList.filter(c => new Date(c.createdAt) >= minDate);
  };

  const generateExcelWorkbook = async (filteredContactsList: Contact[], presetLabel: string, customStart?: string, customEnd?: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Contacts");

    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 2, activeCell: 'A3' }
    ];

    const headerRow1 = worksheet.getRow(1);
    headerRow1.height = 30;
    
    headerRow1.getCell(1).value = "Contact Information";
    headerRow1.getCell(7).value = "Work Information";
    headerRow1.getCell(10).value = "Location";
    headerRow1.getCell(14).value = "Additional Information";
    headerRow1.getCell(17).value = "Activity";

    worksheet.mergeCells("A1:F1");
    worksheet.mergeCells("G1:I1");
    worksheet.mergeCells("J1:M1");
    worksheet.mergeCells("N1:P1");
    worksheet.mergeCells("Q1:R1");

    const primaryIndigoFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' }
    };

    const whiteBoldFont = {
      name: 'Inter',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFF' }
    };

    const centerAlignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };

    const thinBorder = {
      top: { style: 'thin', color: { argb: 'C7D2FE' } },
      left: { style: 'thin', color: { argb: 'C7D2FE' } },
      bottom: { style: 'thin', color: { argb: 'C7D2FE' } },
      right: { style: 'thin', color: { argb: 'C7D2FE' } }
    };

    const mergedHeaderRanges = [
      { start: 1, end: 6 },
      { start: 7, end: 9 },
      { start: 10, end: 13 },
      { start: 14, end: 16 },
      { start: 17, end: 18 }
    ];

    mergedHeaderRanges.forEach(range => {
      for (let col = range.start; col <= range.end; col++) {
        const cell = headerRow1.getCell(col);
        cell.fill = primaryIndigoFill as any;
        cell.font = whiteBoldFont;
        cell.alignment = centerAlignment as any;
        cell.border = thinBorder as any;
      }
    });

    const subHeaders = [
      "Full Name", "Email Address", "Phone Number", "Work Phone", "Website", "LinkedIn Profile",
      "Job Title", "Company", "Department",
      "Address", "City", "State", "Country",
      "Status", "Tags", "Notes",
      "Created Date", "Last Updated"
    ];

    const headerRow2 = worksheet.getRow(2);
    headerRow2.height = 24;

    const lightIndigoFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E7FF' }
    };

    const darkIndigoFont = {
      name: 'Inter',
      size: 10,
      bold: true,
      color: { argb: '312E81' }
    };

    subHeaders.forEach((sh, index) => {
      const colIndex = index + 1;
      const cell = headerRow2.getCell(colIndex);
      cell.value = sh;
      cell.fill = lightIndigoFill as any;
      cell.font = darkIndigoFont;
      cell.alignment = centerAlignment as any;
      cell.border = thinBorder as any;
    });

    const formatExcelDate = (dateStr?: string | number) => {
      if (!dateStr) return "Not Provided";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Not Provided";
      
      const day = String(date.getDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hrStr = String(hours).padStart(2, '0');
      
      return `${day}-${month}-${year} ${hrStr}:${minutes} ${ampm}`;
    };

    const zebraDarkFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F8FAFC' }
    };

    const zebraLightFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF' }
    };

    const dataFont = {
      name: 'Inter',
      size: 10,
      color: { argb: '1E293B' }
    };

    const dataBorder = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } }
    };

    filteredContactsList.forEach((c, rowIndex) => {
      const rowNumber = rowIndex + 3;
      const row = worksheet.getRow(rowNumber);
      row.height = 20;

      const data = [
        `${c.firstName} ${c.lastName}`,
        c.email,
        c.phone || "Not Provided",
        c.workPhone || "Not Provided",
        c.website || "Not Provided",
        c.linkedinUrl || "Not Provided",
        c.jobTitle || "Not Provided",
        c.company || "Not Provided",
        c.department || "Not Provided",
        c.address || "Not Provided",
        c.city || "Not Provided",
        c.state || "Not Provided",
        c.country || "Not Provided",
        c.status,
        c.tags && c.tags.length > 0 ? c.tags.join(", ") : "Not Provided",
        c.notes || "Not Provided",
        formatExcelDate(c.createdAt),
        formatExcelDate(c.updatedAt)
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
          horizontal: colIndex === 0 || colIndex === 1 || colIndex === 14 || colIndex === 15 ? 'left' : 'center',
          wrapText: true
        } as any;
      });
    });

    worksheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: 18 }
    };

    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const rowNum = typeof cell.row === "object" ? (cell.row as any).number : Number(cell.row);
        if (rowNum === 1) return;
        const columnLength = cell.value ? String(cell.value).length : 0;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.max(maxLength + 4, 12);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    
    let cleanPreset = presetLabel.toLowerCase().replace(/\s+/g, "-");
    let filename = `contacts-${cleanPreset}.xlsx`;
    if (presetLabel === "Custom Range" && customStart) {
      const formatFn = (dStr: string) => {
        const d = new Date(dStr);
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStrVal = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mStr}-${dStrVal}`;
      };
      const startStr = formatFn(customStart);
      const endStr = customEnd ? formatFn(customEnd) : formatFn(new Date().toISOString());
      filename = `contacts-${startStr}-to-${endStr}.xlsx`;
    } else if (presetLabel === "All Contacts") {
      filename = "contacts.xlsx";
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Filter contacts by Search Query
  const filteredContacts = contacts.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const emailMatch = c.email.toLowerCase().includes(query);
    const companyMatch = c.company.toLowerCase().includes(query);
    const nameMatch = fullName.includes(query);
    const tagsMatch = c.tags.some(tag => tag.toLowerCase().includes(query));
    return nameMatch || emailMatch || companyMatch || tagsMatch;
  });

  return (
    <div className="space-y-5 max-w-7xl pb-6 p-6">
      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contacts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{contacts.length} total contacts</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Desktop Export Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="hidden sm:flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all hover:shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          <button
            onClick={() => { resetForm(); setIsEditOpen(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>

          {/* Mobile Overflow Menu */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsMobileMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg z-40 py-1.5"
                  >
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsExportOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-55 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export Contacts
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {contacts.length > 0 && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, email, company, or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {filteredContacts && filteredContacts.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredContacts?.map((c, i) => {
              const initials = `${c.firstName[0] || ""}${c.lastName[0] || ""}`.toUpperCase();
              const badge = getStatusBadgeConfig(c.status);
              const colorClass = CONTACT_COLORS[i % CONTACT_COLORS.length];
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 16px -8px rgba(0, 0, 0, 0.05)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => { setSelectedContact(c); setIsDetailsOpen(true); }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {c.jobTitle ? `${c.jobTitle} · ` : ""}{c.company}
                          </p>
                        </div>
                        <Chip label={badge.label} v={c.status.toLowerCase() === "active" || c.status.toLowerCase() === "customer" ? "green" : c.status.toLowerCase() === "lead" ? "blue" : c.status.toLowerCase() === "prospect" ? "purple" : "neutral"} />
                      </div>
                      
                      {/* Contact metadata */}
                      <div className="mt-3 space-y-1.5 border-t border-slate-50 dark:border-slate-700/50 pt-2.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> 
                          <span className="truncate">{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> 
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Display Tags */}
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3.5">
                          {c.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-600/40">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm text-center max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No contacts yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
            Create your first contact to start managing relationships.
          </p>
          <button
            onClick={() => { resetForm(); setIsEditOpen(true); }}
            className="mt-6 flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Contact
          </button>
        </div>
      )}

      {/* Drawer and Modal Overlay for Add Contact */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-60 flex justify-end">
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="absolute inset-0 bg-[rgba(15,23,42,0.55)] z-10"
            />

            {/* Slide-over Drawer (Desktop: 460px right side panel, Mobile: full-screen) */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-50 w-full md:w-[480px] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 id="drawer-title" className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {editingContactId ? "Edit Contact" : "Create Contact"}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {editingContactId ? "Update this contact's details in your workspace" : "Add a new partner or client to your workspace"}
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  aria-label="Close drawer"
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Scrollable Area */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* 1. Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    1. Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="firstName">
                        First Name *
                      </label>
                      <input
                        ref={firstNameInputRef}
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${formErrors.firstName ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 ${formErrors.firstName ? "focus:ring-red-400/40" : "focus:ring-indigo-500/60"} transition-all`}
                        placeholder="John"
                        required
                      />
                      {formErrors.firstName && (
                        <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="lastName">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${formErrors.lastName ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 ${formErrors.lastName ? "focus:ring-red-400/40" : "focus:ring-indigo-500/60"} transition-all`}
                        placeholder="Doe"
                        required
                      />
                      {formErrors.lastName && (
                        <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="email">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${formErrors.email ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 ${formErrors.email ? "focus:ring-red-400/40" : "focus:ring-indigo-500/60"} transition-all`}
                      placeholder="john.doe@company.com"
                      required
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${formErrors.phone ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 ${formErrors.phone ? "focus:ring-red-400/40" : "focus:ring-indigo-500/60"} transition-all`}
                      placeholder="+1 (555) 000-0000"
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="profileImage">
                      Profile Image URL (optional)
                    </label>
                    <input
                      type="text"
                      id="profileImage"
                      name="profileImage"
                      value={form.profileImage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* 2. Work Information Section */}
                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    2. Work Information
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="jobTitle">
                        Job Title
                      </label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={form.jobTitle}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="Project Manager"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="company">
                        Company *
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={form.company}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${formErrors.company ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 ${formErrors.company ? "focus:ring-red-400/40" : "focus:ring-indigo-500/60"} transition-all`}
                        placeholder="Acme Corp"
                        required
                      />
                      {formErrors.company && (
                        <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="department">
                        Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={form.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="Product Team"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="workPhone">
                        Work Phone
                      </label>
                      <input
                        type="text"
                        id="workPhone"
                        name="workPhone"
                        value={form.workPhone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${formErrors.workPhone ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"} rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 ${formErrors.workPhone ? "focus:ring-red-400/40" : "focus:ring-indigo-500/60"} transition-all`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {formErrors.workPhone && (
                        <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {formErrors.workPhone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="website">
                        Website
                      </label>
                      <input
                        type="text"
                        id="website"
                        name="website"
                        value={form.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="www.company.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="linkedinUrl">
                        LinkedIn URL
                      </label>
                      <input
                        type="text"
                        id="linkedinUrl"
                        name="linkedinUrl"
                        value={form.linkedinUrl}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Additional Information Section */}
                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    3. Additional Information
                  </h3>

                  {/* Multi-select Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      {AVAILABLE_TAGS.map(tag => {
                        const isSelected = form.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <Tag className="w-3 h-3 flex-shrink-0" />
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Customer">Customer</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Notes Area */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="notes">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all resize-none"
                      placeholder="Add brief details about interactions, deal updates, etc."
                    />
                  </div>

                  {/* Address Fields */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="address">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="city">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="SF"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="state">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="CA"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="country">
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all"
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Drawer Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingContactId ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    editingContactId ? "Save Changes" : "Create Contact"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Contact View Drawer (Details Panel Modal) */}
      <AnimatePresence>
        {selectedContact && isDetailsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="absolute inset-0 bg-[rgba(15,23,42,0.55)] z-10"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-50 w-full md:w-[480px] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 z-20 border-b border-slate-100 dark:border-slate-800/80 px-6 py-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {selectedContact.profileImage ? (
                    <img
                      src={selectedContact.profileImage}
                      alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-200 dark:shadow-none">
                      {`${selectedContact.firstName[0] || ""}${selectedContact.lastName[0] || ""}`.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Profile Meta details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleEditContact(selectedContact)}
                        title="Edit Contact"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all border border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(selectedContact.id)}
                        title="Delete Contact"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all border border-slate-100 dark:border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsDetailsOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {selectedContact.jobTitle || "Executive"} · {selectedContact.company}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Chip label={getStatusBadgeConfig(selectedContact.status).label} v={selectedContact.status.toLowerCase() === "active" || selectedContact.status.toLowerCase() === "customer" ? "green" : selectedContact.status.toLowerCase() === "lead" ? "blue" : selectedContact.status.toLowerCase() === "prospect" ? "purple" : "neutral"} />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Updated {(() => {
                        const date = new Date(selectedContact.updatedAt);
                        if (isNaN(date.getTime())) return "recently";
                        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                        if (seconds < 60) return "just now";
                        const minutes = Math.floor(seconds / 60);
                        if (minutes < 60) return `${minutes}m ago`;
                        const hours = Math.floor(minutes / 60);
                        if (hours < 24) return `${hours}h ago`;
                        const days = Math.floor(hours / 24);
                        return `${days}d ago`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable details panel contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* SECTION 1 - CONTACT INFORMATION */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      const renderField = (label: string, value: string | undefined, icon: React.ReactNode, type?: "copy" | "link") => {
                        const isEmpty = !value || !value.trim();
                        const displayValue = isEmpty ? "Not provided" : value;
                        return (
                          <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:shadow-xs transition-all group/field">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">{label}</span>
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 text-xs">{icon}</span>
                                <span className={`text-xs font-semibold truncate ${isEmpty ? "text-slate-400 dark:text-slate-500 italic font-normal" : "text-slate-800 dark:text-slate-200"}`}>{displayValue}</span>
                              </div>
                              {!isEmpty && type === "copy" && <CopyButton text={value!} />}
                              {!isEmpty && type === "link" && (
                                <a
                                  href={value!.startsWith("http") ? value! : `https://${value!}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all flex-shrink-0 cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderField("Email Address", selectedContact.email, "📧", "copy")}
                          {renderField("Phone Number", selectedContact.phone, "📱", "copy")}
                          {renderField("Work Phone", selectedContact.workPhone, "📞")}
                          {renderField("Website", selectedContact.website, "🌐", "link")}
                          {renderField("LinkedIn Profile", selectedContact.linkedinUrl, "🔗", "link")}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 2 - WORK INFORMATION */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Work Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      const renderField = (label: string, value: string | undefined, icon: React.ReactNode) => {
                        const isEmpty = !value || !value.trim();
                        const displayValue = isEmpty ? "Not provided" : value;
                        return (
                          <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:shadow-xs transition-all">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">{label}</span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 text-xs">{icon}</span>
                              <span className={`text-xs font-semibold truncate ${isEmpty ? "text-slate-400 dark:text-slate-500 italic font-normal" : "text-slate-800 dark:text-slate-200"}`}>{displayValue}</span>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderField("Job Title", selectedContact.jobTitle, "💼")}
                          {renderField("Company", selectedContact.company, "🏢")}
                          {renderField("Department", selectedContact.department, "🏷")}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 3 - LOCATION */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                      const renderField = (label: string, value: string | undefined, icon: React.ReactNode) => {
                        const isEmpty = !value || !value.trim();
                        const displayValue = isEmpty ? "Not provided" : value;
                        return (
                          <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:shadow-xs transition-all">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">{label}</span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 text-xs">{icon}</span>
                              <span className={`text-xs font-semibold truncate ${isEmpty ? "text-slate-400 dark:text-slate-500 italic font-normal" : "text-slate-800 dark:text-slate-200"}`}>{displayValue}</span>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderField("Address", selectedContact.address, "📍")}
                          {renderField("City", selectedContact.city, "🏙")}
                          {renderField("State", selectedContact.state, "📌")}
                          {renderField("Country", selectedContact.country, "🌍")}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 4 - TAGS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Tags
                  </h4>
                  {selectedContact?.tags && selectedContact.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedContact?.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl shadow-2xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Not provided</p>
                  )}
                </div>

                {/* SECTION 5 - NOTES */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Notes
                  </h4>
                  <div className="bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4">
                    {selectedContact.notes ? (
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedContact.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">No notes available.</p>
                    )}
                  </div>
                </div>

                {/* SECTION 6 - ACTIVITY */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Activity
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                          {(() => {
                            const date = new Date(selectedContact.createdAt);
                            if (isNaN(date.getTime())) return "Not provided";
                            return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) + " • " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Updated</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                          {(() => {
                            const date = new Date(selectedContact.updatedAt);
                            if (isNaN(date.getTime())) return "Not provided";
                            return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) + " • " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Contacts Popover Modal */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isExporting) setIsExportOpen(false); }}
              className="absolute inset-0 bg-[rgba(15,23,42,0.55)] z-40"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl z-50 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Export Contacts
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Select a date range to export contacts</p>
                </div>
                <button
                  disabled={isExporting}
                  onClick={() => setIsExportOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-left">
                
                {/* Presets Range Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                    Select Range Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "All Contacts" },
                      { id: "thisyear", label: "This Year" },
                      { id: "thismonth", label: "This Month" },
                      { id: "lastmonth", label: "Last Month" },
                      { id: "12months", label: "Last 12 Months" },
                      { id: "6months", label: "Last 6 Months" },
                      { id: "90days", label: "Last 90 Days" },
                      { id: "60days", label: "Last 60 Days" },
                      { id: "30days", label: "Last 30 Days" },
                      { id: "28days", label: "Last 28 Days" },
                      { id: "15days", label: "Last 15 Days" },
                      { id: "7days", label: "Last 7 Days" },
                      { id: "custom", label: "Custom Range" },
                    ].map(preset => {
                      const isSelected = exportPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          disabled={isExporting}
                          onClick={() => setExportPreset(preset.id)}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date Pickers */}
                {exportPreset === "custom" && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Custom Date Range
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400" htmlFor="exportStart">
                          From:
                        </label>
                        <input
                          type="date"
                          id="exportStart"
                          disabled={isExporting}
                          max={new Date().toISOString().split("T")[0]}
                          value={customStartDate}
                          onChange={e => {
                            setCustomStartDate(e.target.value);
                            if (customEndDate && e.target.value && new Date(customEndDate) < new Date(e.target.value)) {
                              setCustomEndDate("");
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400" htmlFor="exportEnd">
                          To:
                        </label>
                        <input
                          type="date"
                          id="exportEnd"
                          disabled={isExporting}
                          max={new Date().toISOString().split("T")[0]}
                          min={customStartDate}
                          value={customEndDate}
                          onChange={e => setCustomEndDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {customStartDate && (
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                        Exporting contacts created between{" "}
                        {new Date(customStartDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                        {" → "}
                        {customEndDate 
                          ? new Date(customEndDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                          : new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                      </p>
                    )}
                  </div>
                )}

                {/* EXPORT SUMMARY */}
                {(() => {
                  const filtered = filterContactsByDate(
                    contacts,
                    exportPreset,
                    exportPreset === "custom" ? customStartDate : undefined,
                    exportPreset === "custom" ? customEndDate : undefined
                  );

                  const presetLabel = {
                    all: "All Contacts",
                    thisyear: "This Year",
                    thismonth: "This Month",
                    lastmonth: "Last Month",
                    "12months": "Last 12 Months",
                    "6months": "Last 6 Months",
                    "90days": "Last 90 Days",
                    "60days": "Last 60 Days",
                    "30days": "Last 30 Days",
                    "28days": "Last 28 Days",
                    "15days": "Last 15 Days",
                    "7days": "Last 7 Days",
                    custom: "Custom Range",
                  }[exportPreset] || "All Contacts";

                  const isRangeEmpty = filtered.length === 0;

                  return (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Export Summary
                      </span>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/60 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span>Contacts Found:</span>
                          <span className={`font-bold ${isRangeEmpty ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{filtered.length}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span>Date Range:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{presetLabel}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span>File Format:</span>
                          <span className="font-bold text-slate-900 dark:text-white">Excel (.xlsx)</span>
                        </div>
                      </div>

                      {contacts.length === 0 ? (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          No contacts available to export.
                        </p>
                      ) : isRangeEmpty ? (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          No contacts were created during this date range.
                        </p>
                      ) : null}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          disabled={isExporting}
                          onClick={() => setIsExportOpen(false)}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        
                        <button
                          type="button"
                          disabled={isRangeEmpty || isExporting || (exportPreset === "custom" && !customStartDate)}
                          onClick={async () => {
                            setIsExporting(true);
                            try {
                              await generateExcelWorkbook(
                                filtered,
                                presetLabel,
                                exportPreset === "custom" ? customStartDate : undefined,
                                exportPreset === "custom" ? customEndDate : undefined
                              );
                              toast("success", "Contacts exported successfully.");
                              setIsExportOpen(false);
                            } catch (err) {
                              console.error(err);
                              toast("error", "Failed to generate Excel file.");
                            } finally {
                              setIsExporting(false);
                            }
                          }}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Exporting Contacts...
                            </>
                          ) : (
                            "Export"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── HELPER COMPONENTS ───

function ContactsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl pb-6 p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/70 h-48">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-4" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsError() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/60 rounded-2xl shadow-sm text-center max-w-xl mx-auto mt-6">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Something went wrong</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        An error occurred while loading the contacts page. Please try refreshing or contact support.
      </p>
    </div>
  );
}
