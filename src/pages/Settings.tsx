import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Palette, Bell, Database, Building, Shield, CreditCard,
  Skull, ChevronRight,
} from "lucide-react";
import { AppearanceSection } from "./settings/AppearanceSection";
import { NotificationsSection } from "./settings/NotificationsSection";
import { CustomFieldsSection } from "./settings/CustomFieldsSection";
import { WorkspaceSection } from "./settings/WorkspaceSection";
import { SecuritySection } from "./settings/SecuritySection";
import { BillingSection } from "./settings/BillingSection";
import { DangerZoneSection } from "./settings/DangerZoneSection";

const sections = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "crm-fields", label: "CRM Fields", icon: Database },
  { id: "workspace", label: "Workspace", icon: Building },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "danger-zone", label: "Danger Zone", icon: Skull },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("appearance");

  const renderSection = () => {
    switch (activeSection) {
      case "appearance":
        return <AppearanceSection />;
      case "notifications":
        return <NotificationsSection />;
      case "crm-fields":
        return <CustomFieldsSection />;
      case "workspace":
        return <WorkspaceSection />;
      case "security":
        return <SecuritySection />;
      case "billing":
        return <BillingSection />;
      case "danger-zone":
        return <DangerZoneSection />;
      default:
        return <AppearanceSection />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl pb-6 p-6">
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Configure appearance, notifications, workspace, and more.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 xl:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm p-2 sticky top-6">
            <div className="flex flex-col gap-0.5">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left",
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <section.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    <span className="flex-1">{section.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
