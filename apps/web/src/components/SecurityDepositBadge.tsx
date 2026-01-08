// apps/web/src/components/SecurityDepositBadge.tsx
"use client";

import { ShieldCheckIcon } from "@heroicons/react/24/outline";

type SecurityDepositBadgeProps = {
  amountCents: number;
  currency: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
};

/**
 * Badge affichant le montant de la caution
 */
export default function SecurityDepositBadge({
  amountCents,
  currency,
  className = "",
  showIcon = true,
  size = "md",
}: SecurityDepositBadgeProps) {
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200 ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <ShieldCheckIcon className={`${iconSizes[size]} text-amber-500`} />
      )}
      <span>Caution {formattedAmount}</span>
    </span>
  );
}
