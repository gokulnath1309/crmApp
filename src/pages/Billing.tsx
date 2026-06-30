import { useQuery, useMutation } from 'convex/react';
import { Check, Zap, Star, Building, Users, Layout, CreditCard, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../../convex/_generated/api';
import { pricingPlans, planLimits, planOrder } from '../components/pricing/data';

const iconMap: Record<string, React.ReactNode> = {
  basic: <Zap className="w-5 h-5 text-indigo-500" />,
  professional: <Star className="w-5 h-5 text-indigo-500" />,
  enterprise: <Building className="w-5 h-5 text-indigo-500" />,
};

function PlanCard({ plan, isCurrent, onUpgrade, onDowngrade, usage }: {
  plan: typeof pricingPlans[number];
  isCurrent: boolean;
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  usage: { currentUsers: number; maxUsers: number } | null;
}) {
  const planIdx = planOrder.indexOf(plan.id as typeof planOrder[number]);
  const limits = planLimits[plan.id] ?? planLimits.basic;

  return (
    <motion.div
      className={`relative rounded-2xl border p-6 backdrop-blur-sm transition-all hover:shadow-lg ${
        isCurrent
          ? 'border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-900/20 shadow-md shadow-indigo-500/10'
          : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isCurrent && (
        <div className="absolute -top-2.5 left-4 px-3 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold rounded-full shadow-sm">
          Current Plan
        </div>
      )}
      <div className="flex flex-col h-full pt-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            {iconMap[plan.id] ?? <Zap className="w-5 h-5 text-indigo-500" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {plan.monthlyPrice > 0 ? `${plan.currency}${plan.monthlyPrice}` : 'Custom'}
          </span>
          {plan.monthlyPrice > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
          )}
        </div>

        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>Up to {limits.maxUsers === 999999 ? 'unlimited' : limits.maxUsers} users</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Layout className="w-3.5 h-3.5" />
            <span>Up to {limits.maxWorkspaces === 999999 ? 'unlimited' : limits.maxWorkspaces} workspace{limits.maxWorkspaces !== 1 ? 's' : ''}</span>
          </div>
          {plan.features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        {isCurrent && usage && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>User usage</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {usage.currentUsers} / {usage.maxUsers === 999999 ? '∞' : usage.maxUsers}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${Math.min(100, (usage.currentUsers / (usage.maxUsers || 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {!isCurrent && (
          <button
            onClick={onUpgrade || onDowngrade}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer"
          >
            {planIdx > planOrder.indexOf('basic') ? 'Upgrade' : 'Downgrade'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function BillingPage() {
  const subscription = useQuery(api.subscriptions.getWorkspaceSubscription);
  const userLimit = useQuery(api.subscriptions.getUserLimitStatus);
  const upgradePlan = useMutation(api.subscriptions.upgradePlan);
  const downgradePlan = useMutation(api.subscriptions.downgradePlan);

  const isLoading = subscription === undefined || userLimit === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md p-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/70 shadow-sm">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Unable to load subscription data.</p>
        </div>
      </div>
    );
  }

  const currentPlanId = subscription.plan;
  const currentPlan = pricingPlans.find((p) => p.id === currentPlanId);
  const currentIdx = planOrder.indexOf(currentPlanId as typeof planOrder[number]);

  const handleUpgrade = async (planId: string) => {
    try {
      await upgradePlan({ targetPlan: planId, billingCycle: 'monthly' });
    } catch (err: any) {
      alert(err.message || 'Upgrade failed');
    }
  };

  const handleDowngrade = async (planId: string) => {
    try {
      await downgradePlan({ targetPlan: planId });
    } catch (err: any) {
      alert(err.message || 'Downgrade failed');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your plan, view usage, and billing information.</p>
        </motion.div>

        {/* Current Plan Summary */}
        <motion.div
          className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-700/30">
                <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Plan</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentPlan?.name ?? 'Free'} &middot; {subscription.billingCycle === 'annual' ? 'Annual' : 'Monthly'} billing
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-xs font-semibold text-green-700 dark:text-green-400">
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </div>
          </div>

          {/* Usage Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Users</span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Used</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {userLimit?.currentCount ?? 0} / {userLimit?.maxUsers === 999999 ? '∞' : userLimit?.maxUsers ?? 50}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${(userLimit?.atLimit) ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                  style={{ width: `${Math.min(100, ((userLimit?.currentCount ?? 0) / (userLimit?.maxUsers ?? 1)) * 100)}%` }}
                />
              </div>
              {userLimit?.atLimit && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>User limit reached. Upgrade to add more users.</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Plan Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Plan</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{subscription.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Billing</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{subscription.billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Member since</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{new Date(subscription.assignedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plan Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pricingPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const planIdx = planOrder.indexOf(plan.id as typeof planOrder[number]);

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={isCurrent}
                  usage={isCurrent && userLimit ? { currentUsers: userLimit.currentCount, maxUsers: userLimit.maxUsers } : null}
                  onUpgrade={planIdx > currentIdx ? () => handleUpgrade(plan.id) : undefined}
                  onDowngrade={planIdx < currentIdx ? () => handleDowngrade(plan.id) : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Billing History placeholder */}
        <motion.div
          className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Billing History</h2>
          <div className="flex items-center justify-center py-8 text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Payment history will appear here once a payment gateway is configured.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
