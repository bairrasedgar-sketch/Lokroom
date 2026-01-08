// apps/web/src/components/SecurityDepositStatus.tsx
"use client";

import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { SecurityDepositStatus as DepositStatus } from "@prisma/client";

type SecurityDepositStatusProps = {
  status: DepositStatus;
  amountCents: number;
  currency: string;
  capturedAmountCents?: number | null;
  captureReason?: string | null;
  expiresAt?: Date | string;
  releasedAt?: Date | string | null;
  capturedAt?: Date | string | null;
  showDetails?: boolean;
  className?: string;
};

const STATUS_CONFIG: Record<
  DepositStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: {
    label: "En attente",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    icon: ClockIcon,
  },
  AUTHORIZED: {
    label: "Autorisee",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    icon: ShieldCheckIcon,
  },
  CAPTURED: {
    label: "Capturee",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    icon: ShieldExclamationIcon,
  },
  RELEASED: {
    label: "Liberee",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    icon: CheckCircleIcon,
  },
  PARTIALLY_CAPTURED: {
    label: "Partiellement capturee",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    icon: ExclamationTriangleIcon,
  },
  FAILED: {
    label: "Echec",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    icon: XCircleIcon,
  },
  EXPIRED: {
    label: "Expiree",
    bgColor: "bg-gray-50",
    textColor: "text-gray-500",
    borderColor: "border-gray-200",
    icon: ClockIcon,
  },
};

/**
 * Affichage du statut d'un depot de garantie avec couleurs
 */
export default function SecurityDepositStatus({
  status,
  amountCents,
  currency,
  capturedAmountCents,
  captureReason,
  expiresAt,
  releasedAt,
  capturedAt,
  showDetails = false,
  className = "",
}: SecurityDepositStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(cents / 100);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 ${className}`}
    >
      {/* Header avec statut */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor} border ${config.borderColor}`}
        >
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        </div>
        <div>
          <p className={`font-semibold ${config.textColor}`}>
            Caution {config.label.toLowerCase()}
          </p>
          <p className="text-sm text-gray-600">
            Montant: {formatAmount(amountCents)}
          </p>
        </div>
      </div>

      {/* Details supplementaires */}
      {showDetails && (
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
          {/* Montant capture */}
          {(status === "CAPTURED" || status === "PARTIALLY_CAPTURED") &&
            capturedAmountCents && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant retenu:</span>
                <span className="font-medium text-red-600">
                  {formatAmount(capturedAmountCents)}
                </span>
              </div>
            )}

          {/* Raison de la capture */}
          {captureReason && (
            <div className="text-sm">
              <span className="text-gray-600">Raison:</span>
              <p className="mt-1 text-gray-900">{captureReason}</p>
            </div>
          )}

          {/* Date de liberation */}
          {status === "RELEASED" && releasedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Liberee le:</span>
              <span className="font-medium text-green-600">
                {formatDate(releasedAt)}
              </span>
            </div>
          )}

          {/* Date de capture */}
          {(status === "CAPTURED" || status === "PARTIALLY_CAPTURED") &&
            capturedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Capturee le:</span>
                <span className="font-medium text-red-600">
                  {formatDate(capturedAt)}
                </span>
              </div>
            )}

          {/* Date d'expiration (pour les depots autorises) */}
          {status === "AUTHORIZED" && expiresAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sera liberee le:</span>
              <span className="font-medium text-amber-600">
                {formatDate(expiresAt)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Version compacte du badge de statut
 */
export function SecurityDepositStatusBadge({
  status,
  className = "",
}: {
  status: DepositStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
