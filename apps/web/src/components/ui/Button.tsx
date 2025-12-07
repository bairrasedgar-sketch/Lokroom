/**
 * Lok'Room - Design System
 * Composant Button standardisé style Airbnb
 *
 * Usage:
 * import { Button } from "@/components/ui/Button";
 *
 * <Button>Primary</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="outline">Outline</Button>
 * <Button size="sm">Small</Button>
 * <Button loading>Loading...</Button>
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

// Variantes de style
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Classes de base communes
const baseClasses = [
  "inline-flex items-center justify-center",
  "font-medium",
  "transition-all duration-200",
  "focus:outline-none focus:ring-2 focus:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

// Classes par variante
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-black focus:ring-gray-900 active:scale-[0.98]",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
};

// Classes par taille
const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1",
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-full gap-2",
  lg: "px-6 py-2.5 text-base rounded-full gap-2",
};

// Spinner de chargement
function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSize = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <svg
      className={`animate-spin ${spinnerSize}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      children,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// Export du type pour réutilisation
export type { ButtonProps, ButtonVariant, ButtonSize };
