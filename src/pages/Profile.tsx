import { useAuth } from "@/features/auth/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Edit2, User, Mail, Phone, Building, Shield, Target, Calendar, Clock,
  CheckCircle, Award, Globe, MapPin
} from "lucide-react";

function Chip({ label, v = "neutral" }: { label: string; v?: "neutral" | "green" | "blue" | "orange" | "red" | "purple" }) {
  const styles = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }[v];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles}`}>{label}</span>;
}

export function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6 md:p-8 space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl pb-6 p-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 relative">
          <button className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/20 hover:bg-black/35 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Edit2 className="w-3 h-3" /> Edit Cover
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl border-[3px] border-white dark:border-slate-800 flex items-center justify-center shadow-xl">
              <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {user.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user.name}</h1>
          <div className="flex items-center gap-2.5 mt-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <Chip label={user.role || "Admin"} v="blue" />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><Building className="w-3.5 h-3.5" /> Acme Corp</div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><MapPin className="w-3.5 h-3.5" /> San Francisco, CA</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Personal Information</h2>
            <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { I: User, l: "Full Name", v: user.name },
              { I: Mail, l: "Email", v: user.email },
              { I: Phone, l: "Phone", v: "+1 (415) 555-0192" },
              { I: Building, l: "Company", v: "Acme Corp" },
              { I: Shield, l: "Role", v: user.role || "Admin" }
            ].map(({ I, l, v }) => (
              <div key={l} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <I className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/70">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Account Information</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { I: Calendar, l: "Member Since", v: "January 15, 2024" },
              { I: Clock, l: "Last Login", v: "Today at 9:42 AM" },
              { I: CheckCircle, l: "Account Status", v: "Active & Verified" },
              { I: Award, l: "Plan", v: "Enterprise" },
              { I: Globe, l: "Timezone", v: "America/Los_Angeles" }
            ].map(({ I, l, v }) => (
              <div key={l} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <I className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h2>
        </div>
        <div className="px-6 py-5">
          <div className="relative space-y-5">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
            {[
              { I: CheckCircle, text: "Signed in from San Francisco, CA", time: "Today, 9:42 AM", cls: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" },
              { I: Edit2, text: "Updated profile information and timezone", time: "Yesterday, 3:15 PM", cls: "text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400" },
              { I: Target, text: "Created 3 new leads — TechCorp, Globex, Initech", time: "Jun 16, 11:00 AM", cls: "text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400" },
              { I: Award, text: "Account verified and workspace set up completed", time: "Jan 15, 2024", cls: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`relative z-10 w-6 h-6 rounded-full ${item.cls} flex items-center justify-center flex-shrink-0`}>
                  <item.I className="w-3 h-3" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{item.text}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}