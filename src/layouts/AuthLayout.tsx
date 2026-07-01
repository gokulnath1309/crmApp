import type { ReactNode } from "react";
import { Database, Bolt, Shield } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  features?: { label: string; desc: string; icon: typeof Bolt }[];
}

const defaultFeatures = [
  { label: "Velocity", desc: "Real-time sync across all modules.", icon: Bolt },
  { label: "Security", desc: "Enterprise-tier data encryption.", icon: Shield },
];

export function AuthLayout({ children, title, subtitle, features = defaultFeatures }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex md:w-1/2 lg:w-3/5 relative bg-primary overflow-hidden items-center justify-center p-8">
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-12 w-64 h-64 bg-white/30 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-start max-w-xl">
          <div className="mb-8">
            <span className="inline-flex items-center justify-center p-3 bg-white/20 rounded-xl backdrop-blur-md mb-4">
              <Database className="h-8 w-8 text-white" />
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-lg xl:text-xl text-white/80 max-w-lg leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="bg-white/80 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-lg"
                >
                  <Icon className="h-6 w-6 text-white mb-2" />
                  <h3 className="text-lg font-semibold text-white">{f.label}</h3>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-surface-container-lowest">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">CRM Pro</span>
          </div>

          <div className="space-y-8">
            {children}
          </div>

          <footer className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-xs text-outline font-medium">&copy; 2024 CRM Pro Enterprise</p>
            <nav className="flex gap-4">
              <a className="text-xs text-outline font-medium hover:text-on-surface-variant transition-colors" href="#">Privacy</a>
              <a className="text-xs text-outline font-medium hover:text-on-surface-variant transition-colors" href="#">Terms</a>
              <a className="text-xs text-outline font-medium hover:text-on-surface-variant transition-colors" href="#">Security</a>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
