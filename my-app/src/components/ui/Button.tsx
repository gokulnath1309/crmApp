import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

const variants = {
  variant: {
    primary:
      "bg-primary text-white hover:bg-primary-container focus-visible:ring-primary/40 shadow-sm",
    secondary:
      "bg-surface-alt text-text border border-outline-variant hover:bg-surface-container-low focus-visible:ring-primary/40",
    ghost:
      "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface focus-visible:ring-primary/40",
    danger:
      "bg-error text-white hover:bg-error-container hover:text-on-error-container focus-visible:ring-error/40 shadow-sm",
    outline:
      "border-2 border-primary text-primary hover:bg-primary-container/10 focus-visible:ring-primary/40",
  },
  size: {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-[50px] px-6 text-sm gap-2",
    lg: "h-[52px] px-8 text-base gap-2.5",
  },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants.variant;
  size?: keyof typeof variants.size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variants.variant[variant],
          variants.size[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
