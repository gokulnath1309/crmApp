import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Building, Check, Sparkles, Loader2, UserPlus, LogIn,
  Globe, Clock, Shield, CreditCard, X,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth as useAppAuth } from "@/features/auth/AuthProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Select } from "@/components/ui/Select";

const ONBOARDING_PLANS = [
  {
    id: "basic" as const,
    name: "Basic",
    description: "Free forever. Everything you need to get started.",
    badge: "Recommended",
    features: [
      "Free Forever",
      "Unlimited Workspace Members",
      "Contacts",
      "Leads",
      "Deals",
      "Tasks",
      "Calendar",
      "Email Invitations",
      "CRM Dashboard",
    ],
  },
  {
    id: "professional" as const,
    name: "Advanced",
    description: "For teams that need more power and automation.",
    badge: null,
    features: [
      "Everything in Basic",
      "AI Features",
      "Workflow Automation",
      "Advanced Reports",
      "Premium Integrations",
      "Priority Support",
    ],
  },
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education",
  "Real Estate", "Retail & E-commerce", "Manufacturing",
  "Consulting", "Other",
];

const SIZE_OPTIONS = [
  { label: "1-10 employees", value: 10 },
  { label: "11-50 employees", value: 50 },
  { label: "51-200 employees", value: 200 },
  { label: "201-500 employees", value: 500 },
  { label: "500+ employees", value: 1000 },
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "India",
  "Germany", "France", "Brazil", "Japan", "Singapore",
  "Netherlands", "Spain", "Italy", "Sweden", "Norway",
  "Denmark", "Switzerland", "New Zealand", "UAE", "South Africa",
  "Mexico", "Ireland", "Austria", "Belgium", "Portugal",
  "Finland", "Poland", "China", "South Korea", "Hong Kong",
  "Malaysia", "Thailand", "Vietnam", "Philippines", "Indonesia",
  "Argentina", "Chile", "Colombia", "Nigeria", "Kenya",
  "Morocco", "Egypt", "Saudi Arabia", "Israel", "Turkey",
  "Russia", "Other",
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (EST)" },
  { value: "America/Chicago", label: "Central (CST)" },
  { value: "America/Denver", label: "Mountain (MST)" },
  { value: "America/Los_Angeles", label: "Pacific (PST)" },
  { value: "America/Sao_Paulo", label: "Brasilia (BRT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART)" },
];

const industrySelectOptions = [
  { value: "", label: "Select Industry" },
  ...INDUSTRIES.map((ind) => ({ value: ind, label: ind }))
];

const countrySelectOptions = [
  { value: "", label: "Select Country" },
  ...COUNTRIES.map((c) => ({ value: c, label: c }))
];

const sizeSelectOptions = SIZE_OPTIONS.map((opt) => ({
  value: String(opt.value),
  label: opt.label,
}));

const timezoneSelectOptions = [
  { value: "", label: "Select Timezone" },
  ...TIMEZONES
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  useAppAuth();
  const [searchParams] = useSearchParams();

  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const workspaceLimit = useQuery(api.subscriptions.getWorkspaceLimitStatus);
  const atWorkspaceLimit = workspaceLimit?.atLimit === true;

  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (workspaceLimit && atWorkspaceLimit) {
      setShowUpgrade(true);
    }
  }, [workspaceLimit, atWorkspaceLimit]);

  const [mode, setMode] = useState<"create" | "join">(
    (searchParams.get("mode") as "create" | "join") || "create"
  );
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "professional">("basic");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState<number>(10);
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paying, setPaying] = useState(false);

  const isBasic = selectedPlan === "basic";

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      toast("error", "Workspace name is required");
      return;
    }
    setCreating(true);
    try {
      await createWorkspace({
        name: name.trim(),
        industry: industry || undefined,
        employeeCount: employeeCount || undefined,
        plan: selectedPlan,
        billingCycle: "monthly",
      });
    } catch (err: any) {
      toast("error", err?.message || "Failed to create workspace");
      setCreating(false);
    }
  }, [name, industry, employeeCount, selectedPlan, createWorkspace, toast]);

  const handleButtonClick = useCallback(() => {
    if (!name.trim()) {
      toast("error", "Workspace name is required");
      return;
    }
    if (isBasic) {
      handleCreate();
    } else {
      setShowPayment(true);
    }
  }, [name, isBasic, handleCreate, toast]);

  const handlePayAndCreate = useCallback(async () => {
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      await createWorkspace({
        name: name.trim(),
        industry: industry || undefined,
        employeeCount: employeeCount || undefined,
        plan: "professional",
        billingCycle: "monthly",
      });
    } catch (err: any) {
      toast("error", err?.message || "Payment failed. Please try again.");
      setPaying(false);
    }
  }, [name, industry, employeeCount, createWorkspace, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to CRMPro
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Create your first workspace or join an existing one.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-full max-w-md mx-auto mb-8">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              mode === "create"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building className="w-4 h-4" />
            Create Workspace
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              mode === "join"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Join Workspace
          </button>
        </div>

        {mode === "create" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6 lg:gap-8 items-start">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Workspace Details</h2>
                <p className="text-sm text-slate-500 mt-1">Set up your company workspace.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Workspace Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Industry
                  </label>
                  <Select
                    options={industrySelectOptions}
                    value={industry}
                    onChange={(val) => setIndustry(val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Company Size
                  </label>
                  <Select
                    options={sizeSelectOptions}
                    value={String(employeeCount)}
                    onChange={(val) => setEmployeeCount(Number(val))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Country
                    </label>
                    <Select
                      options={countrySelectOptions}
                      value={country}
                      onChange={(val) => setCountry(val)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Timezone
                    </label>
                    <Select
                      options={timezoneSelectOptions}
                      value={timezone}
                      onChange={(val) => setTimezone(val)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={handleButtonClick}
                  disabled={!name.trim() || creating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/20 disabled:shadow-none active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : isBasic ? (
                    <><Building className="w-4 h-4" /> Create Workspace</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Continue to Payment</>
                  )}
                </button>
                {isBasic && (
                  <p className="text-center text-xs text-slate-400 mt-3">
                    <Shield className="w-3 h-3 inline mr-1" />
                    No payment required. Start free, upgrade anytime.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {ONBOARDING_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {plan.badge && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold uppercase tracking-wider mb-3">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{plan.description}</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    {isSelected && plan.id === "basic" && (
                      <div className="mt-4 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        Selected &mdash; no payment required
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Join Existing Workspace</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the invitation token or paste the invitation link you received by email.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Invitation Token
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Paste your invitation token or link here"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                  />
                </div>

                <button
                  onClick={() => {
                    if (inviteCode.trim()) {
                      navigate(`/invite/${inviteCode.trim()}`);
                    } else {
                      toast("error", "Please enter the invitation token.");
                    }
                  }}
                  disabled={!inviteCode.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/20 disabled:shadow-none active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4" /> Join Workspace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" onClick={() => !paying && setShowPayment(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => !paying && setShowPayment(false)}
              disabled={paying}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200">
              <CreditCard className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Complete Payment</h3>
            <p className="text-sm text-slate-500 mb-6">You're subscribing to the Advanced plan.</p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Plan</span>
                <span className="font-semibold text-slate-900">Advanced</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Billing</span>
                <span className="font-semibold text-slate-900">Monthly</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">₹499/mo</span>
              </div>
            </div>

            {paying ? (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                Processing payment...
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayAndCreate}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹499
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          navigate("/dashboard");
        }}
      />
    </div>
  );
}
