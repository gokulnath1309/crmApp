import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Building, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useAuth, useUser } from "@clerk/clerk-react";

export default function CreateWorkspace() {
  const { toast } = useToast();
  const createWorkspace = useMutation(api.workspaces.createWorkspace);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  console.log("[CreateWorkspace Debug]", {
    isLoaded,
    isSignedIn,
    userId: user?.id,
  });

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Real Estate",
    "Retail & E-commerce",
    "Manufacturing",
    "Consulting",
    "Other",
  ];

  const sizeOptions = [
    { label: "1-10 employees", value: 10 },
    { label: "11-50 employees", value: 50 },
    { label: "51-200 employees", value: 200 },
    { label: "201-500 employees", value: 500 },
    { label: "500+ employees", value: 1000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("error", "Company name is required");
      return;
    }

    if (!isLoaded || !isSignedIn) {
      toast("error", "Authentication is still loading. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorkspace({
        name: name.trim(),
        industry: industry || undefined,
        employeeCount: employeeCount,
      });
      toast("success", "Workspace created successfully!");
      // Force page refresh or navigation to let route guards re-evaluate the auth session with workspaceId
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      toast("error", err.message || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        {/* Logo and Greeting Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome to the Future of CRM
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Let's get your team started by setting up your company workspace.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-800/60 pb-5">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" /> Company Profile
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide basic information about your company to customize your workspace dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
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
              {/* Industry */}
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
                    <option key={ind} value={ind} className="bg-slate-950">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size */}
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
                    <option key={opt.value} value={opt.value} className="bg-slate-950">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Workspace...
                  </>
                ) : (
                  <>
                    Launch Workspace <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-600 mt-6">
          By launching this workspace, you will become the workspace owner & Super Admin.
        </p>
      </div>
    </div>
  );
}
