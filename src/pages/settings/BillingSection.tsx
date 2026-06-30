import { useToast } from "@/components/ui/Toast";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ExternalLink } from "lucide-react";

export function BillingSection() {
  const { toast } = useToast();
  const company = useQuery(api.workspaces.getMyWorkspace);

  const plan = company?.plan || "basic";
  const planLabel = plan === "basic" ? "Basic" : plan === "professional" ? "Professional" : "Enterprise";
  const isActive = company?.subscriptionStatus === "active";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Billing</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your subscription and invoices</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Current Plan</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">{planLabel}</p>
            </div>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
              isActive
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
            }`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-700/20">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Next Invoice</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Due in 14 days</p>
            </div>
            <button
              type="button"
              onClick={() => toast("success", "Billing details coming soon")}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
