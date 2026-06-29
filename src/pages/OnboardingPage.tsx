import { useState, useEffect, useCallback, lazy, Suspense, type ComponentType } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Building, ArrowRight, Loader2, Sparkles, UserPlus, LogIn, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useWorkspace } from "@/features/auth/WorkspaceProvider";

let WorkspaceCreator: ComponentType<{
  name: string;
  industry: string;
  employeeCount: number;
  onCreate: () => void;
  onError: (msg: string) => void;
}> | null = null;

function loadWorkspaceCreator() {
  if (!WorkspaceCreator) {
    WorkspaceCreator = lazy(() => import("@/components/WorkspaceCreator"));
  }
}

export default function OnboardingPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasMemberships } = useWorkspace();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"create" | "join">(
    (searchParams.get("mode") as "create" | "join") || "create"
  );
  const [creatorKey, setCreatorKey] = useState(0);

  // After workspace creation, AuthGate will detect the new membership
  // and redirect to /dashboard automatically.

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState<number>(10);
  const [inviteCode, setInviteCode] = useState("");

  const handleCreateStart = useCallback(() => {
    if (!name.trim()) {
      toast("error", "Company name is required");
      return;
    }
    loadWorkspaceCreator();
    setCreatorKey((k) => k + 1);
  }, [name, toast]);

  const handleCreated = useCallback(() => {
    // AuthGate will detect the new membership and redirect to /dashboard
  }, []);

  const handleError = useCallback((msg: string) => {
    toast("error", msg);
  }, [toast]);

  // "Join Workspace" tab: navigate to the invite acceptance page directly.
  // The form submit is unused — the button's onClick handles navigation.
  const handleJoinWorkspaceSubmit = (e: React.FormEvent) => e.preventDefault();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome to CRM Pro
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Get started by creating a new workspace or joining an existing one.
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl p-6 sm:p-10 space-y-6">
          
          {!hasMemberships && (
            <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-400">No workspace found</h4>
                <p className="text-xs text-amber-500/90 mt-1 leading-relaxed">
                  You are not part of any workspace. Please create or join one.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setMode("create")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mode === "create"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Building className="w-4 h-4" /> Create Workspace
            </button>
            <button
              onClick={() => setMode("join")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mode === "join"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <UserPlus className="w-4 h-4" /> Join Workspace
            </button>
          </div>

          {mode === "create" ? (
            <>
              <div className="border-b border-slate-800/60 pb-5">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" /> Company Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Provide basic information to customize your workspace.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateStart(); }} className="space-y-5">
                <div>
                  <label htmlFor="company-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Company Name *
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="industry" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Industry
                    </label>
                    <select
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="text-slate-600">Select Industry</option>
                      {industries.map((ind) => (
                        <option key={ind} value={ind} className="bg-slate-950">{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="company-size" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Company Size
                    </label>
                    <select
                      id="company-size"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      {sizeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-950">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" /> Launch Workspace
                  </button>
                </div>
              </form>

              {creatorKey > 0 && WorkspaceCreator && (
                <Suspense fallback={
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  </div>
                }>
                  <WorkspaceCreator
                    key={creatorKey}
                    name={name}
                    industry={industry}
                    employeeCount={employeeCount}
                    onCreate={handleCreated}
                    onError={handleError}
                  />
                </Suspense>
              )}
            </>
          ) : (
          <form onSubmit={handleJoinWorkspaceSubmit} className="space-y-5">
              <div className="border-b border-slate-800/60 pb-5">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-indigo-400" /> Join a Workspace
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Invitations are sent to your email. Click the link in the email to join.
                </p>
              </div>

              <div>
                <label htmlFor="invite-code" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Invite Code (from link)
                </label>
                <input
                  id="invite-code"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. invite link token"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (inviteCode.trim()) {
                      navigate(`/invite/${inviteCode.trim()}`);
                    } else {
                      toast("error", "Please enter the invite token.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
                >
                  <LogIn className="w-4 h-4" /> Go to Accept Page
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By launching a workspace, you will become the workspace owner & Super Admin.
        </p>
      </div>
    </div>
  );
}

const industries = [
  "Technology", "Healthcare", "Finance", "Education",
  "Real Estate", "Retail & E-commerce", "Manufacturing",
  "Consulting", "Other",
];

const sizeOptions = [
  { label: "1-10 employees", value: 10 },
  { label: "11-50 employees", value: 50 },
  { label: "51-200 employees", value: 200 },
  { label: "201-500 employees", value: 500 },
  { label: "500+ employees", value: 1000 },
];
