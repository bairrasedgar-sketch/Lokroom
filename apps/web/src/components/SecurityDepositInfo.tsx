// apps/web/src/components/SecurityDepositInfo.tsx
"use client";

import {
  ShieldCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

type SecurityDepositInfoProps = {
  amountCents: number;
  currency: string;
  description?: string | null;
  refundDays?: number;
  variant?: "badge" | "card" | "checkout";
  className?: string;
};

/**
 * Composant pour afficher les informations sur le depot de garantie
 * Utilise dans la page de detail d'annonce et le checkout
 */
export default function SecurityDepositInfo({
  amountCents,
  currency,
  description,
  refundDays = 7,
  variant = "badge",
  className = "",
}: SecurityDepositInfoProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

  // Version badge simple
  if (variant === "badge") {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Caution {formattedAmount}
          <InformationCircleIcon className="h-4 w-4 text-amber-500" />
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-gray-900">
                  Depot de garantie
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Un montant de {formattedAmount} sera autorise sur votre carte
                  (non debite). Il sera libere {refundDays} jours apres votre
                  depart si aucun dommage n&apos;est signale.
                </p>
                {description && (
                  <p className="mt-2 text-sm text-gray-500 italic">
                    &quot;{description}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Version card pour la page de detail
  if (variant === "card") {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-amber-50 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheckIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">
              Caution: {formattedAmount}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Ce montant sera autorise sur votre carte mais pas debite. Il sera
              libere automatiquement {refundDays} jours apres votre depart si
              aucun dommage n&apos;est constate.
            </p>
            {description && (
              <p className="mt-2 text-sm text-amber-600 italic">
                Note de l&apos;hote: &quot;{description}&quot;
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Version checkout
  if (variant === "checkout") {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-gray-900">Depot de garantie</span>
          </div>
          <span className="font-semibold text-gray-900">{formattedAmount}</span>
        </div>

        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
            <span>
              Ce montant sera <strong>autorise</strong> sur votre carte mais{" "}
              <strong>pas debite</strong>. Il sera libere {refundDays} jours
              apres votre depart si aucun dommage n&apos;est signale par l&apos;hote.
            </span>
          </p>
        </div>

        {description && (
          <p className="mt-2 text-sm text-gray-500 italic pl-7">
            &quot;{description}&quot;
          </p>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Version inline pour les listes
 */
export function SecurityDepositInline({
  amountCents,
  currency,
  className = "",
}: {
  amountCents: number;
  currency: string;
  className?: string;
}) {
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm text-amber-600 ${className}`}
    >
      <ShieldCheckIcon className="h-4 w-4" />
      Caution {formattedAmount}
    </span>
  );
}
