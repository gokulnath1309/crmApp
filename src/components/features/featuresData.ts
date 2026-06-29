import { 
  Lock, 
  Layers, 
  Mail, 
  Users, 
  ShieldCheck, 
  FolderHeart, 
  Target, 
  Flame, 
  Activity, 
  CheckSquare, 
  BarChart3, 
  Bell,
  Search,
  Monitor
} from "lucide-react";
import React from "react";

export interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  categories: string[];
  benefits: string[];
}

export const CATEGORIES = [
  "All",
  "CRM",
  "Sales",
  "Customers",
  "Workspace",
  "Employees",
  "Analytics",
  "Security"
];

export const FEATURES: FeatureItem[] = [
  {
    id: "auth",
    icon: Lock,
    title: "Secure Authentication",
    description: "Enterprise-grade authentication with email verification, password resets, and session management.",
    categories: ["Security"],
    benefits: [
      "Clerk Authentication integration",
      "Secure OTP verification flow",
      "Seamless password reset workflow"
    ]
  },
  {
    id: "multi-workspace",
    icon: Layers,
    title: "Multi Workspace Hub",
    description: "Create, manage, and toggle between multiple company workspaces under a single user profile.",
    categories: ["Workspace"],
    benefits: [
      "Isolated workspace databases",
      "Fast switcher interface",
      "Custom workspace profiles"
    ]
  },
  {
    id: "invitations",
    icon: Mail,
    title: "Email Invitations",
    description: "Invite team members and employees to join your workspace securely via system-generated email invites.",
    categories: ["Workspace", "Security"],
    benefits: [
      "Token-based invitation links",
      "Pre-assigned team roles",
      "Automated notification triggers"
    ]
  },
  {
    id: "employee-mgmt",
    icon: Users,
    title: "Employee & Team Management",
    description: "Structure your business operations by grouping employees into functional teams and departments.",
    categories: ["Employees", "Workspace"],
    benefits: [
      "Organize teams & departments",
      "Track team leads and members",
      "Manage active/inactive employee status"
    ]
  },
  {
    id: "rbac",
    icon: ShieldCheck,
    title: "Role-Based Access Control",
    description: "Ensure security and compliance with granular permissions tailored to different employee tiers.",
    categories: ["Security", "Employees"],
    benefits: [
      "Manager and Employee permission tiers",
      "Action guards on critical paths",
      "Secure backend schema rules"
    ]
  },
  {
    id: "customers",
    icon: FolderHeart,
    title: "Customer Directory",
    description: "Maintain a comprehensive directory of business accounts, contacts, and customer relationships.",
    categories: ["Customers", "CRM"],
    benefits: [
      "Deep profile details panel",
      "Quick contact search & filters",
      "Integrated history logs"
    ]
  },
  {
    id: "leads",
    icon: Target,
    title: "Lead Tracking",
    description: "Capture, assign, and qualify sales prospects through status transition pipelines.",
    categories: ["CRM", "Sales"],
    benefits: [
      "Status workflow transition controls",
      "Assigned sales agent tracking",
      "Lead source metadata fields"
    ]
  },
  {
    id: "pipeline",
    icon: Flame,
    title: "Sales Pipeline",
    description: "Visualize and track active business deals across multi-stage pipeline boards.",
    categories: ["Sales", "CRM"],
    benefits: [
      "Visual board representation",
      "Expected revenue values",
      "Deal status transition timeline"
    ]
  },
  {
    id: "activity-timeline",
    icon: Activity,
    title: "Activity Timeline",
    description: "Keep track of every customer touchpoint, update, email, and meeting in a visual log.",
    categories: ["CRM", "Customers"],
    benefits: [
      "Real-time event logging",
      "Historical action audit trail",
      "Filtered action categories"
    ]
  },
  {
    id: "tasks",
    icon: CheckSquare,
    title: "Task Management",
    description: "Assign, prioritize, and monitor actionable tasks linked directly to leads, deals, or customers.",
    categories: ["CRM", "Workspace"],
    benefits: [
      "Priority tiers (Low to Urgent)",
      "Assignees and due dates tracking",
      "Associated task linking"
    ]
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Gain actionable business insights with visual charts, conversion rates, and performance indicators.",
    categories: ["Analytics"],
    benefits: [
      "Revenue pipeline forecasts",
      "Win/loss ratios and statistics",
      "Visual dashboard widgets"
    ]
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Real-time Notifications",
    description: "Keep teams aligned with instant in-app alerts for task assignments, lead transitions, and status updates.",
    categories: ["Workspace", "CRM"],
    benefits: [
      "In-app notification bell",
      "Read / unread status toggle",
      "Event-triggered alert notifications"
    ]
  },
  {
    id: "search",
    icon: Search,
    title: "Search & Filters",
    description: "Quickly locate contacts, tasks, leads, or companies with instant indexing and robust query filters.",
    categories: ["CRM", "Workspace"],
    benefits: [
      "Typeahead search queries",
      "Status, priority, and date filters",
      "Saved custom filters"
    ]
  },
  {
    id: "responsive",
    icon: Monitor,
    title: "Responsive Design & Security",
    description: "Work on the go with custom layouts designed for mobile, tablet, and desktops under a secure architecture.",
    categories: ["Security", "Workspace"],
    benefits: [
      "Mobile and tablet optimized layouts",
      "HTTPS & Clerk secure token validation",
      "Convex reactive data sync"
    ]
  }
];
