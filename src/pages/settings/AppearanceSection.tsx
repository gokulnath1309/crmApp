import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { Sun, Moon, Monitor, Palette } from "lucide-react";

function Toggle({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-offset-slate-900",
        on ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-600"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          on ? "translate-x-[22px]" : "translate-x-1"
        )}
      />
    </button>
  );
}

function ThemeOption({ value, current, label, icon: Icon, onChange }: {
  value: "light" | "dark" | "system";
  current: string;
  label: string;
  icon: typeof Sun;
  onChange: (v: "light" | "dark" | "system") => void;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-offset-slate-900",
        selected
          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-700/50"
      )}
      aria-pressed={selected}
    >
      <Icon className={cn("h-4 w-4", selected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
      {label}
    </button>
  );
}

function SettingRow({ icon: Icon, label, description, control, className }: {
  icon?: typeof Palette;
  label: string;
  description?: string;
  control?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-3",
      "border-b border-slate-50 dark:border-slate-700/20 last:border-b-0",
      className
    )}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {control}
      </div>
    </div>
  );
}

export function AppearanceSection() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const stored = localStorage.getItem("crm_pro_theme");
    if (stored === "light" || stored === "dark") return stored;
    return "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    localStorage.setItem("crm_pro_theme", theme);
  }, [theme]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Customize your interface experience</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 shadow-sm">
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider">
              Theme
            </label>
            <div className="flex gap-2">
              <ThemeOption value="light" current={theme} label="Light" icon={Sun} onChange={setTheme} />
              <ThemeOption value="dark" current={theme} label="Dark" icon={Moon} onChange={setTheme} />
              <ThemeOption value="system" current={theme} label="System" icon={Monitor} onChange={setTheme} />
            </div>
          </div>

          <SettingRow
            label="Accent Color"
            description="Choose your primary brand color"
            control={
              <div className="flex gap-1.5">
                {["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#10b981", "#06b6d4"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-700 shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    style={{ backgroundColor: c }}
                    onClick={() => toast("success", "Accent color customization coming soon")}
                    aria-label={`Set accent color ${c}`}
                  />
                ))}
              </div>
            }
          />

          <SettingRow
            label="Compact Mode"
            description="Reduce spacing and density"
            control={<Toggle on={false} onChange={() => toast("success", "Compact mode coming soon")} />}
          />

          <SettingRow
            label="Animations"
            description="Enable interface motion effects"
            control={<Toggle on={true} onChange={() => toast("success", "Animation preference coming soon")} />}
          />
        </div>
      </div>
    </div>
  );
}
