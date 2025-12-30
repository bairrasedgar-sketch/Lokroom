/**
 * Badges de statut pour l'admin
 */
import { cn } from "@/lib/utils";

type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "pending";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  size?: "sm" | "md";
}

// Mapping des statuts vers les types de badge
const STATUS_TYPES: Record<string, StatusType> = {
  // User roles
  ADMIN: "error",
  HOST: "info",
  GUEST: "neutral",
  BOTH: "info",
  // Booking status
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "error",
  // Listing status
  APPROVED: "success",
  PENDING_REVIEW: "warning",
  REJECTED: "error",
  SUSPENDED: "error",
  DRAFT: "neutral",
  ARCHIVED: "neutral",
  // Identity status
  VERIFIED: "success",
  UNVERIFIED: "neutral",
  // Dispute status
  OPEN: "warning",
  UNDER_REVIEW: "info",
  AWAITING_HOST: "pending",
  AWAITING_GUEST: "pending",
  MEDIATION: "info",
  RESOLVED_GUEST: "success",
  RESOLVED_HOST: "success",
  RESOLVED_PARTIAL: "success",
  CLOSED: "neutral",
  ESCALATED: "error",
  // Promo status
  active: "success",
  inactive: "neutral",
  expired: "error",
};

// Labels traduits
const STATUS_LABELS: Record<string, string> = {
  // Roles
  ADMIN: "Admin",
  HOST: "Hôte",
  GUEST: "Voyageur",
  BOTH: "Hôte & Voyageur",
  // Booking
  CONFIRMED: "Confirmée",
  PENDING: "En attente",
  CANCELLED: "Annulée",
  // Listing
  APPROVED: "Approuvée",
  PENDING_REVIEW: "En révision",
  REJECTED: "Rejetée",
  SUSPENDED: "Suspendue",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivée",
  // Identity
  VERIFIED: "Vérifié",
  UNVERIFIED: "Non vérifié",
  // Dispute
  OPEN: "Ouvert",
  UNDER_REVIEW: "En cours",
  AWAITING_HOST: "Attente hôte",
  AWAITING_GUEST: "Attente voyageur",
  MEDIATION: "Médiation",
  RESOLVED_GUEST: "Résolu (voyageur)",
  RESOLVED_HOST: "Résolu (hôte)",
  RESOLVED_PARTIAL: "Résolu (partiel)",
  CLOSED: "Fermé",
  ESCALATED: "Escaladé",
};

const TYPE_STYLES: Record<StatusType, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-800",
  pending: "bg-orange-100 text-orange-800",
};

export default function StatusBadge({
  status,
  type,
  size = "md",
}: StatusBadgeProps) {
  const badgeType = type || STATUS_TYPES[status] || "neutral";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        TYPE_STYLES[badgeType],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      {label}
    </span>
  );
}

// Composant pour afficher un indicateur de priorité (litiges)
interface PriorityBadgeProps {
  priority: number;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = {
    1: { label: "Critique", class: "bg-red-100 text-red-800" },
    2: { label: "Haute", class: "bg-orange-100 text-orange-800" },
    3: { label: "Moyenne", class: "bg-yellow-100 text-yellow-800" },
    4: { label: "Basse", class: "bg-blue-100 text-blue-800" },
    5: { label: "Très basse", class: "bg-gray-100 text-gray-800" },
  }[priority] || { label: `P${priority}`, class: "bg-gray-100 text-gray-800" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
        config.class
      )}
    >
      {config.label}
    </span>
  );
}

// Composant pour afficher le montant formaté
interface AmountBadgeProps {
  amount: number;
  currency?: string;
  cents?: boolean;
}

export function AmountBadge({
  amount,
  currency = "EUR",
  cents = false,
}: AmountBadgeProps) {
  const value = cents ? amount / 100 : amount;
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(value);

  return (
    <span className="font-medium text-gray-900">{formatted}</span>
  );
}
