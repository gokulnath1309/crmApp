import { useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import {
  DollarSign,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

const DEAL_TYPES: SelectOption[] = [
  { value: "One-Time Sale", label: "One-Time Sale" },
  { value: "Service Agreement", label: "Service Agreement" },
  { value: "Project-Based", label: "Project-Based" },
  { value: "Recurring Contract", label: "Recurring Contract" },
  { value: "Subscription", label: "Subscription" },
  { value: "Maintenance Contract", label: "Maintenance Contract" },
  { value: "Custom", label: "Custom" },
];

const INITIAL_STAGES: SelectOption[] = [
  { value: "Prospecting", label: "🔍 Prospecting" },
  { value: "Qualification", label: "📋 Qualification" },
  { value: "Proposal", label: "📄 Proposal" },
  { value: "Negotiation", label: "🤝 Negotiation" },
];

const PRIORITIES: SelectOption[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const CURRENCIES: SelectOption[] = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "SGD", label: "SGD" },
  { value: "AED", label: "AED" },
];

const BILLING_FREQUENCIES: SelectOption[] = [
  { value: "One-Time", label: "One-Time" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Semi-Annual", label: "Semi-Annual" },
  { value: "Annual", label: "Annual" },
  { value: "Custom", label: "Custom" },
];

interface ConvertToDealModalProps {
  open: boolean;
  onClose: () => void;
  lead: {
    _id: Id<"leads">;
    company: string;
    firstName: string;
    lastName: string;
    value?: number;
    currency?: string;
  };
  isCreatingDeal?: boolean;
  pipelineName?: string;
}

export const ConvertToDealModal: FC<ConvertToDealModalProps> = ({
  open,
  onClose,
  lead,
  isCreatingDeal: isCreatingDealProp = false,
  pipelineName,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const convertToDeal = useMutation(api.leads.convertToDeal);

  const [dealName, setDealName] = useState(
    `${lead.company} - ${lead.firstName} ${lead.lastName}`,
  );
  const [dealValue, setDealValue] = useState(lead.value?.toString() || "");
  const [dealCurrency, setDealCurrency] = useState(lead.currency || "INR");
  const [initialStage, setInitialStage] = useState("Prospecting");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [dealType, setDealType] = useState("");

  const [contractOpen, setContractOpen] = useState(false);
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [billingFrequency, setBillingFrequency] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [isConverting, setIsConverting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRequiredFilled = dealName.trim().length > 0;

  const dateToTimestamp = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined;
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d.getTime();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!dealName.trim()) errs.dealName = "Deal name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConvert = async () => {
    if (!validate()) return;
    if (isConverting || isCreatingDealProp) return;
    setIsConverting(true);
    try {
      const result = await convertToDeal({
        leadId: lead._id,
        dealName: dealName.trim(),
        dealValue: dealValue ? Number(dealValue) : undefined,
        dealCurrency,
        initialStage,
        dealType: dealType || undefined,
        expectedCloseDate: dateToTimestamp(expectedCloseDate),
        priority: priority || undefined,
        contractStartDate: dateToTimestamp(contractStart),
        contractEndDate: dateToTimestamp(contractEnd),
        renewalDate: dateToTimestamp(renewalDate),
        billingFrequency: billingFrequency || undefined,
        poNumber: poNumber.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast("success", "Lead converted to deal successfully");
      onClose();
      if (result?.dealId) {
        navigate("/deals");
      }
    } catch (err: any) {
      toast("error", err.message || "Failed to convert lead");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="" className="max-w-2xl p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-outline-variant">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Convert to Deal
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lead.company} &mdash; {lead.firstName} {lead.lastName}
            {pipelineName && (
              <span className="ml-2 text-xs text-gray-400">| {pipelineName}</span>
            )}
          </p>
        </div>
      </div>

      <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-6">
        {/* Section 1: Deal Information (Required) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">1</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Deal Information
            </h4>
            <span className="text-xs text-gray-400 font-medium ml-auto">Required</span>
          </div>

          <div className="space-y-4">
            <Input
              label="Deal Name *"
              placeholder="e.g. Enterprise Package"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              error={errors.dealName}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                  Deal Value
                </label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="flex h-[50px] w-full rounded-xl border border-outline-variant bg-surface-alt px-4 py-2 text-sm text-on-surface placeholder:text-outline/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                  Currency
                </label>
                <Select
                  options={CURRENCIES}
                  value={dealCurrency}
                  onChange={setDealCurrency}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                  Initial Stage
                </label>
                <Select
                  options={INITIAL_STAGES}
                  value={initialStage}
                  onChange={setInitialStage}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                Priority
              </label>
              <Select
                options={PRIORITIES}
                value={priority}
                onChange={setPriority}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Deal Type (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Deal Type
            </h4>
            <span className="text-xs text-gray-400 font-medium ml-auto">Optional</span>
          </div>

          <Select
            options={DEAL_TYPES}
            value={dealType}
            onChange={setDealType}
            placeholder="Select a deal type..."
          />
        </div>

        {/* Section 3: Contract Details (Collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setContractOpen(!contractOpen)}
            className="flex items-center gap-2 w-full text-left"
          >
            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Contract Details
            </h4>
            <span className="text-xs text-gray-400 font-medium ml-auto">
              {contractOpen ? "Click to collapse" : "Optional \u00B7 Click to expand"}
            </span>
            {contractOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {contractOpen && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={contractStart}
                    onChange={(e) => setContractStart(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                    Renewal Date
                  </label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all focus:shadow-[0_0_0_3px_rgba(79,70,229,0.08)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                    Billing Frequency
                  </label>
                  <Select
                    options={BILLING_FREQUENCIES}
                    value={billingFrequency}
                    onChange={setBillingFrequency}
                    placeholder="Select billing..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Purchase Order (PO) Number"
                  placeholder="e.g. PO-2024-001"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
                <Input
                  label="Reference Number"
                  placeholder="e.g. REF-001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1E293B] dark:text-gray-200">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-xl border border-outline-variant bg-surface-alt px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
                  placeholder="Additional notes about this deal..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
          <p className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            This will create a deal record, mark the lead as Converted, and move
            it to read-only mode.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant bg-surface-alt/50">
        <p className="text-xs text-gray-400">
          {isRequiredFilled
            ? "All required fields complete"
            : "Fill in required fields to continue"}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <button
            onClick={handleConvert}
            disabled={!isRequiredFilled || isConverting || isCreatingDealProp}
            className={cn(
              "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
              "h-9 px-5 text-sm gap-1.5",
              "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white",
              "hover:from-emerald-700 hover:to-emerald-800",
              "disabled:pointer-events-none disabled:opacity-50",
              "shadow-sm",
            )}
          >
            {isConverting || isCreatingDealProp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting...
              </>
            ) : (
              "Convert"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
