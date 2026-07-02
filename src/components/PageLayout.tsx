import type { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export function PageLayout({
  title,
  subtitle,
  actions,
  children,
  maxWidth = "max-w-7xl",
}: PageLayoutProps) {
  return (
    <div className={`px-4 md:px-6 pt-4 pb-6 ${maxWidth}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <h1
            className="text-lg max-sm:text-[24px] max-sm:font-semibold text-slate-900 dark:text-white truncate"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm max-sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 w-full sm:w-auto flex justify-start sm:justify-end">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
