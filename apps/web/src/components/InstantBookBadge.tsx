// apps/web/src/components/InstantBookBadge.tsx
"use client";

import { useState } from "react";
import { BoltIcon } from "@heroicons/react/24/solid";

type InstantBookBadgeProps = {
  /** Taille du badge */
  size?: "sm" | "md" | "lg";
  /** Afficher le tooltip au survol */
  showTooltip?: boolean;
  /** Texte personnalisé */
  label?: string;
  /** Style variant */
  variant?: "default" | "outline" | "minimal";
  /** Classe CSS additionnelle */
  className?: string;
};

/**
 * Badge "Réservation instantanée" avec icône éclair
 * Style Airbnb avec fond jaune/orange
 */
export default function InstantBookBadge({
  size = "md",
  showTooltip = true,
  label,
  variant = "default",
  className = "",
}: InstantBookBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Tailles
  const sizeClasses = {
    sm: {
      container: "px-2 py-0.5 text-[10px]",
      icon: "h-3 w-3",
      gap: "gap-1",
    },
    md: {
      container: "px-2.5 py-1 text-xs",
      icon: "h-3.5 w-3.5",
      gap: "gap-1.5",
    },
    lg: {
      container: "px-3 py-1.5 text-sm",
      icon: "h-4 w-4",
      gap: "gap-2",
    },
  };

  // Variants
  const variantClasses = {
    default: "bg-amber-100 text-amber-800 border border-amber-200",
    outline: "bg-transparent text-amber-600 border border-amber-400",
    minimal: "bg-transparent text-amber-600",
  };

  const displayLabel = label ?? "Réservation instantanée";

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center rounded-full font-medium
          ${sizeClasses[size].container}
          ${sizeClasses[size].gap}
          ${variantClasses[variant]}
          ${className}
        `}
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <BoltIcon className={`${sizeClasses[size].icon} text-amber-500`} />
        <span>{displayLabel}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg"
          role="tooltip"
        >
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            <BoltIcon className="h-4 w-4 text-amber-400" />
            Réservation instantanée
          </div>
          <p className="text-gray-300 leading-relaxed">
            Réservez immédiatement sans attendre l&apos;approbation de l&apos;hôte.
            Votre réservation sera confirmée dès le paiement.
          </p>
          {/* Flèche du tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * Version compacte du badge (juste l'icône)
 */
export function InstantBookIcon({
  size = "md",
  showTooltip = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center justify-center rounded-full
          bg-amber-100 p-1
          ${className}
        `}
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <BoltIcon className={`${sizeClasses[size]} text-amber-500`} />
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg"
          role="tooltip"
        >
          <div className="font-medium flex items-center gap-1">
            <BoltIcon className="h-3 w-3 text-amber-400" />
            Réservation instantanée
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * Badge pour les cartes de listing (version condensée)
 */
export function InstantBookCardBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full
        bg-amber-500 text-white px-2 py-0.5 text-[10px] font-semibold
        shadow-sm
        ${className}
      `}
    >
      <BoltIcon className="h-3 w-3" />
      <span>Instant</span>
    </div>
  );
}

/**
 * Indicateur pour le formulaire de réservation
 */
export function InstantBookIndicator({
  eligible,
  reasons = [],
}: {
  eligible: boolean | null;
  reasons?: string[];
}) {
  if (eligible === null) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm">
        <BoltIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900">Réservation instantanée disponible</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Connectez-vous pour vérifier votre éligibilité
          </p>
        </div>
      </div>
    );
  }

  if (eligible) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
        <BoltIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Vous êtes éligible à la réservation instantanée</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Votre réservation sera confirmée immédiatement après le paiement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm">
      <BoltIcon className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-gray-700">Réservation instantanée non disponible</p>
        {reasons.length > 0 && (
          <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
            {reasons.map((reason, i) => (
              <li key={i}>• {reason}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-1">
          L&apos;hôte devra approuver votre demande de réservation
        </p>
      </div>
    </div>
  );
}
