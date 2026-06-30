import {
  Users, Briefcase, CheckSquare, UserPlus, Layers, Bell,
  User, Shield, BarChart3, Calendar, Monitor,
  Globe, BookOpen, Video, FileText,
  Mail, Zap, Building, Search, MessageSquare, Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const heroData = {
  title: "Everything You Need to Master CRMPro",
  subtitle:
    "Learn how CRMPro helps you manage customers, teams, projects, employees and your entire business from one place.",
  primaryCta: "Get Started",
  secondaryCta: "View Documentation",
};

export const whatIsData = {
  title: "What is CRMPro?",
  description:
    "CRMPro is a modern Customer Relationship Management platform designed to help businesses manage customers, leads, projects, employees, teams and business operations in one centralized workspace.",
  benefits: [
    { icon: Users, text: "Centralized customer management" },
    { icon: UserPlus, text: "Employee collaboration" },
    { icon: CheckSquare, text: "Task tracking" },
    { icon: Layers, text: "Team management" },
    { icon: Briefcase, text: "Project management" },
    { icon: BarChart3, text: "Activity monitoring" },
    { icon: Zap, text: "Productivity improvement" },
    { icon: TrendingUp, text: "Business growth" },
  ],
};

import { TrendingUp } from "lucide-react";

export interface WhyCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const whyCards: WhyCard[] = [
  { icon: Users, title: "Customer Management", description: "Store customer information securely in one place." },
  { icon: Briefcase, title: "Projects", description: "Manage ongoing business projects with ease." },
  { icon: CheckSquare, title: "Tasks", description: "Assign tasks with deadlines and track progress." },
  { icon: UserPlus, title: "Employee Management", description: "Invite employees and assign roles." },
  { icon: Layers, title: "Teams", description: "Create teams and collaborate effectively." },
  { icon: Bell, title: "Notifications", description: "Get real-time updates on all activities." },
  { icon: User, title: "User Profiles", description: "Professional employee profiles with photos." },
  { icon: Shield, title: "Role Based Access", description: "Admin, Manager, and Employee roles." },
  { icon: Building, title: "Workspaces", description: "Separate businesses into different workspaces." },
  { icon: BarChart3, title: "Analytics", description: "Monitor productivity and track growth." },
  { icon: Calendar, title: "Calendar", description: "Track schedules and manage events." },
  { icon: Monitor, title: "Modern UI", description: "Fast responsive interface that users love." },
];

export interface GuideStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const guideSteps: GuideStep[] = [
  { icon: Mail, title: "Create an Account", description: "Sign up with your email and create your secure account." },
  { icon: Mail, title: "Verify Email", description: "Confirm your email address to activate your account." },
  { icon: Building, title: "Create Workspace", description: "Set up your business workspace with a name and details." },
  { icon: UserPlus, title: "Invite Employees", description: "Send invitations to your team members." },
  { icon: Shield, title: "Assign Roles", description: "Set permissions: Admin, Manager, or Employee." },
  { icon: Layers, title: "Create Teams", description: "Organize employees into focused teams." },
  { icon: Users, title: "Add Customers", description: "Import or add customer information securely." },
  { icon: Briefcase, title: "Create Projects", description: "Define projects with goals and deadlines." },
  { icon: CheckSquare, title: "Assign Tasks", description: "Distribute tasks with priorities and due dates." },
  { icon: BarChart3, title: "Track Progress", description: "Monitor completion and team performance." },
  { icon: Bell, title: "Receive Notifications", description: "Stay updated on task changes and mentions." },
  { icon: Zap, title: "Grow Your Business", description: "Use insights to scale your operations." },
];

export interface DocSection {
  icon: LucideIcon;
  title: string;
  items: { label: string; description: string }[];
}

export const docSections: DocSection[] = [
  {
    icon: Building,
    title: "Workspace",
    items: [
      { label: "Creating workspace", description: "Click 'Create Workspace', enter your business name, industry, and set your preferences." },
      { label: "Editing workspace", description: "Navigate to Settings > Workspace to update your business name, logo, and preferences." },
      { label: "Managing members", description: "Go to Employees to view all members. Admins can remove or reassign roles." },
      { label: "Workspace permissions", description: "Workspace settings control who can manage billing, employees, teams, and settings." },
    ],
  },
  {
    icon: UserPlus,
    title: "Employees",
    items: [
      { label: "Invite employee", description: "Go to Employees > Invite, enter their email, select a role, and send the invitation." },
      { label: "Accept invitation", description: "New users receive an email with a link. Clicking it joins them to your workspace." },
      { label: "Employee roles", description: "Roles control access: Admin has full control, Manager oversees teams, Employee has task-level access." },
      { label: "Removing employee", description: "Admins can remove employees from Settings > Employees. Their data is preserved." },
    ],
  },
  {
    icon: Layers,
    title: "Teams",
    items: [
      { label: "Create team", description: "Go to Teams > Create Team, give it a name, and optionally add members right away." },
      { label: "Add employees", description: "From the team page, click 'Add Members' and select employees to include." },
      { label: "Remove members", description: "Team leads can remove members from the team settings panel." },
      { label: "Team permissions", description: "Team leads can manage their team's projects, tasks, and member roster." },
    ],
  },
  {
    icon: Users,
    title: "Customers",
    items: [
      { label: "Add customer", description: "Click 'Add Customer' and fill in contact details, company info, and notes." },
      { label: "Edit customer", description: "Open any customer profile and click 'Edit' to update their information." },
      { label: "Search customer", description: "Use the global search bar or filter by name, company, or status." },
      { label: "Customer history", description: "View all interactions, deals, and notes associated with a customer." },
    ],
  },
  {
    icon: Briefcase,
    title: "Projects",
    items: [
      { label: "Create project", description: "Go to Projects > New Project, set a name, description, deadline, and assign members." },
      { label: "Project status", description: "Track projects as Planning, Active, On Hold, or Completed." },
      { label: "Assign members", description: "From the project page, add team members who will work on it." },
      { label: "Deadlines", description: "Set start and end dates. Overdue projects are highlighted in the dashboard." },
    ],
  },
  {
    icon: CheckSquare,
    title: "Tasks",
    items: [
      { label: "Create task", description: "Click 'New Task', enter a title, description, set priority, and assign it." },
      { label: "Assign employee", description: "Tasks can be assigned to any employee in your workspace." },
      { label: "Priority", description: "Set priority levels: Low, Medium, High, or Urgent." },
      { label: "Status", description: "Track as To Do, In Progress, In Review, or Done." },
      { label: "Comments", description: "Collaborate on tasks by adding comments and mentions." },
    ],
  },
  {
    icon: User,
    title: "Profile",
    items: [
      { label: "Upload profile picture", description: "Go to Profile and click your avatar to upload a new photo." },
      { label: "Cover image", description: "Personalize your profile with a cover image from the profile settings." },
      { label: "Edit profile", description: "Update your name, job title, phone, and bio from the profile page." },
      { label: "Social links", description: "Add links to your LinkedIn, Twitter, or other professional profiles." },
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    items: [
      { label: "Task updates", description: "Get notified when tasks are assigned, updated, or completed." },
      { label: "Mentions", description: "Receive alerts when colleagues mention you in comments." },
      { label: "Invitations", description: "Get notified when you're added to a team or workspace." },
      { label: "Team updates", description: "Stay informed about team changes, new members, and role updates." },
    ],
  },
  {
    icon: Search,
    title: "Search",
    items: [
      { label: "Global search", description: "Press Cmd/Ctrl+K or click the search bar to search across customers, tasks, projects, and employees." },
    ],
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What is CRMPro?",
    answer: "CRMPro is a comprehensive customer relationship management platform that helps businesses manage customers, employees, projects, tasks, and teams in one centralized workspace.",
  },
  {
    question: "Is CRMPro free?",
    answer: "Yes! CRMPro offers a generous Free plan that includes 1 workspace, up to 50 users, employee management, teams, customers, projects, tasks, and notifications. Upgrade to Professional when your team grows.",
  },
  {
    question: "Can I invite employees?",
    answer: "Absolutely. From the Employees page, you can invite team members by email. They'll receive an invitation link to join your workspace with the role you assign.",
  },
  {
    question: "Can I create multiple workspaces?",
    answer: "Yes. The Free plan includes 1 workspace. Enterprise plans support unlimited workspaces, perfect for agencies or companies managing multiple brands.",
  },
  {
    question: "Can employees have different permissions?",
    answer: "Yes. CRMPro has three role levels: Admin (full access), Manager (team oversight), and Employee (task-level access). Enterprise plans include advanced role permissions.",
  },
  {
    question: "Can I upgrade later?",
    answer: "Yes, you can upgrade from Free to Professional or Enterprise at any time. Your data and settings will be preserved seamlessly.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. CRMPro uses industry-standard encryption, secure authentication via Clerk, and follows data protection best practices. Enterprise plans include SSO and audit logs.",
  },
  {
    question: "How many users are supported?",
    answer: "The Free plan supports up to 50 users. Professional supports 51–1000 users. Enterprise plans support unlimited users.",
  },
  {
    question: "Can I export my data?",
    answer: "Yes. You can export customer data, project reports, and other information from your workspace settings.",
  },
];

export const bestPractices: { icon: LucideIcon; text: string }[] = [
  { icon: Layers, text: "Organize employees into teams for better collaboration." },
  { icon: CheckSquare, text: "Use task priorities to focus on what matters most." },
  { icon: Users, text: "Keep customer information updated and complete." },
  { icon: Briefcase, text: "Archive completed projects to keep your workspace clean." },
  { icon: Bell, text: "Use notifications effectively to stay on top of changes." },
  { icon: BarChart3, text: "Review dashboards weekly to track team performance." },
];

export interface ResourceCard {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export const resourceLibrary: ResourceCard[] = [
  { icon: BookOpen, title: "Documentation", description: "Comprehensive guides for every CRMPro feature." },
  { icon: Video, title: "Video Tutorials", description: "Watch step-by-step video walkthroughs." },
  { icon: FileText, title: "User Guide", description: "Download the complete CRMPro user manual." },
  { icon: Bell, title: "Release Notes", description: "Stay updated with the latest features and fixes." },
  { icon: Zap, title: "Feature Updates", description: "Learn about new features as they launch." },
  { icon: Star, title: "CRM Best Practices", description: "Tips and strategies to get the most out of CRMPro." },
  { icon: Globe, title: "API Documentation", description: "Build custom integrations with our API.", badge: "Coming Soon" },
  { icon: MessageSquare, title: "Community", description: "Join discussions and share with other users.", badge: "Coming Soon" },
];

export const finalCtaData = {
  title: "Ready to grow your business?",
  subtitle: "Start free and upgrade whenever you need more power.",
  primaryCta: "Start Free",
  secondaryCta: "View Pricing",
};
