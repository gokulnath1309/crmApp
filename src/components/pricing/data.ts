import { Zap, Building, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const pricingHero = {
  title: "Simple, transparent pricing",
  subtitle: "Start free and upgrade as you grow. No hidden fees, no surprise charges.",
};

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  badge: string;
  badgeVariant: "popular" | "enterprise";
  featured: boolean;
  features: string[];
  cta: string;
  ctaVariant: "primary" | "outline";
  icon: LucideIcon;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Free for startups and small businesses.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    badge: "Free Forever",
    badgeVariant: "popular",
    featured: false,
    features: [
      "1 Workspace",
      "Up to 50 Users",
      "Employee Management",
      "Teams",
      "Customers",
      "Projects",
      "Tasks",
      "Notifications",
      "Profile Management",
      "Community Support",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline",
    icon: Zap,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing teams scaling up operations.",
    monthlyPrice: 499,
    yearlyPrice: 5389,
    currency: "₹",
    badge: "Recommended",
    badgeVariant: "popular",
    featured: true,
    features: [
      "Everything in Basic",
      "51–1000 Users",
      "Unlimited Projects",
      "Advanced Team Management",
      "Priority Support",
      "Advanced Role Permissions",
      "Future Analytics & Reports",
      "Future Automation",
      "Workspace Administration",
      "Priority Feature Updates",
    ],
    cta: "Upgrade Now",
    ctaVariant: "primary",
    icon: Star,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with custom needs.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    badge: "Custom",
    badgeVariant: "enterprise",
    featured: false,
    features: [
      "Unlimited Users",
      "Unlimited Workspaces",
      "Dedicated Account Manager",
      "Priority Support",
      "Custom Integrations",
      "API Access",
      "Advanced Security & SSO",
      "Audit Logs",
      "Data Migration Assistance",
      "Dedicated Onboarding",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline",
    icon: Building,
  },
];

export interface ComparisonRow {
  feature: string;
  basic: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

export const comparisonData: ComparisonRow[] = [
  { feature: "Users", basic: "50", professional: "1000", enterprise: "Unlimited" },
  { feature: "Workspaces", basic: "1", professional: "3", enterprise: "Unlimited" },
  { feature: "Projects", basic: "10", professional: "Unlimited", enterprise: "Unlimited" },
  { feature: "Tasks", basic: true, professional: true, enterprise: true },
  { feature: "Teams", basic: true, professional: true, enterprise: true },
  { feature: "Customers", basic: true, professional: true, enterprise: true },
  { feature: "Notifications", basic: true, professional: true, enterprise: true },
  { feature: "Role Management", basic: "Basic", professional: "Advanced", enterprise: "Advanced" },
  { feature: "Priority Support", basic: false, professional: true, enterprise: true },
  { feature: "Analytics", basic: false, professional: true, enterprise: true },
  { feature: "Reports", basic: false, professional: true, enterprise: true },
  { feature: "Automation", basic: false, professional: true, enterprise: true },
  { feature: "API Access", basic: false, professional: false, enterprise: true },
  { feature: "Custom Integrations", basic: false, professional: false, enterprise: true },
  { feature: "Dedicated Manager", basic: false, professional: false, enterprise: true },
  { feature: "SSO", basic: false, professional: false, enterprise: true },
  { feature: "Audit Logs", basic: false, professional: false, enterprise: true },
];

export const pricingFaqs: { question: string; answer: string }[] = [
  {
    question: "Can I upgrade later?",
    answer: "Yes, you can upgrade from Basic to Professional or Enterprise at any time. All your data and settings will be preserved.",
  },
  {
    question: "Can I downgrade?",
    answer: "Yes, you can downgrade your plan. If you exceed the limits of a lower tier, you'll need to adjust your usage to stay within plan boundaries.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. There are no long-term contracts. You can cancel your subscription at any time from your billing settings.",
  },
  {
    question: "How does yearly billing work?",
    answer: "Yearly billing gives you the equivalent of 12 months for the price of 10.8 months, saving you 10%. It's billed as a single annual payment.",
  },
  {
    question: "What happens after 50 users?",
    answer: "The Basic plan supports up to 50 users. When you need more, upgrade to Professional for 51–1000 users, or Enterprise for unlimited users.",
  },
  {
    question: "Do you offer enterprise pricing?",
    answer: "Yes, Enterprise pricing is customized to your organization's needs. Contact our sales team for a tailored quote.",
  },
];

export const planLimits: Record<string, { maxUsers: number; maxWorkspaces: number }> = {
  basic: { maxUsers: 50, maxWorkspaces: 1 },
  professional: { maxUsers: 1000, maxWorkspaces: 3 },
  enterprise: { maxUsers: 999999, maxWorkspaces: 999999 },
};

export const planOrder = ["basic", "professional", "enterprise"] as const;

export function getPlanUpgrades(currentPlan: string): string[] {
  const idx = planOrder.indexOf(currentPlan as typeof planOrder[number]);
  if (idx === -1) return [];
  return planOrder.slice(idx + 1).map((id) => id);
}

export function getPlanDowngrades(currentPlan: string): string[] {
  const idx = planOrder.indexOf(currentPlan as typeof planOrder[number]);
  if (idx <= 0) return [];
  return planOrder.slice(0, idx).map((id) => id);
}

export const pricingBottomCta = {
  title: "Still unsure?",
  subtitle: "Start with the Basic plan and upgrade whenever your business grows.",
  primaryCta: "Get Started Free",
  secondaryCta: "Contact Sales",
};
