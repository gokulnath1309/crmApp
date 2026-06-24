import { CreditCard } from "lucide-react";

export function BillingPage() {
  return (
    <div className="flex items-center justify-center h-full pb-6 p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-12 text-center max-w-md">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-6 h-6 text-indigo-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Billing</h2>
        <p className="text-sm text-slate-400">Billing and subscription management is coming soon. Check back later.</p>
      </div>
    </div>
  );
}
