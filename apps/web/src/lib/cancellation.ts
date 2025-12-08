// apps/web/src/lib/cancellation.ts
// Politique d'annulation Lok'Room

export type CancellationRole = "guest" | "host";

export type CancellationDecision = {
  allowed: boolean;
  refundRatio: number; // 0..1 basé sur le prix de base (hors frais de service)
  refundAmountCents: number;
  serviceFeeRetainedCents: number;
  hostPayoutCents: number;
  guestPenaltyCents: number;
  reasonCode: string;
  message: string;
  policyType: "daily" | "hourly";
};

const HOUR_MS = 1000 * 60 * 60;

// Frais de service : 5% plafonné à 2.50€ (ou équivalent dans autres devises)
const SERVICE_FEE_PERCENTAGE = 5;

// Maximum des frais de service en cents par devise (équivalent à 2.50€)
// Taux approximatifs basés sur 2.50€
const MAX_SERVICE_FEE_BY_CURRENCY: Record<string, number> = {
  EUR: 250,    // 2.50€
  CAD: 375,    // ~3.75$ CAD (1€ ≈ 1.50 CAD)
  USD: 275,    // ~2.75$ USD (1€ ≈ 1.10 USD)
  GBP: 215,    // ~2.15£ GBP (1€ ≈ 0.86 GBP)
  CHF: 240,    // ~2.40 CHF (1€ ≈ 0.96 CHF)
  XOF: 164000, // ~1640 XOF (1€ ≈ 656 XOF) - Franc CFA
  MAD: 2750,   // ~27.50 MAD (1€ ≈ 11 MAD) - Dirham marocain
};

// Fallback si devise non trouvée (utilise EUR)
const DEFAULT_MAX_SERVICE_FEE_CENTS = 250;

/**
 * Politique d'annulation Lok'Room
 *
 * 📅 RÉSERVATIONS JOURNÉE/NUITÉE (durée ≥ 24h) :
 *   - ≥ 72h avant l'arrivée : 100% remboursé (frais de service 5% retenus, max 2.50€)
 *   - Entre 24h et 72h avant : 50% remboursé (hors frais de service)
 *   - < 24h avant : 0% remboursé
 *
 * ⏰ RÉSERVATIONS À L'HEURE (durée < 24h) :
 *   - ≥ 6h avant le début : 100% remboursé (hors frais de service)
 *   - Entre 2h et 6h avant : 50% remboursé (hors frais de service)
 *   - < 2h avant : 0% remboursé
 *
 * 🏠 ANNULATION PAR L'HÔTE :
 *   - Toujours remboursement 100% pour le voyageur
 *   - Pénalités possibles pour l'hôte en cas d'annulations répétées
 */
export function evaluateCancellationPolicy(options: {
  role: CancellationRole;
  now: Date;
  startDate: Date;
  endDate: Date;
  totalPriceCents: number; // Prix total payé par le voyageur (incluant frais de service)
  currency?: string; // Devise (EUR, CAD, USD, etc.)
}): CancellationDecision {
  const { role, now, startDate, endDate, totalPriceCents, currency = "EUR" } = options;

  // Calcul de la durée de la réservation
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = durationMs / HOUR_MS;

  // Temps restant avant le début
  const diffMs = startDate.getTime() - now.getTime();
  const hoursUntilStart = diffMs / HOUR_MS;

  // Sécurité : si prix <= 0 -> rien à rembourser
  const safeTotal = Math.max(0, totalPriceCents);

  // Calcul des frais de service avec plafond selon la devise
  const maxServiceFee = MAX_SERVICE_FEE_BY_CURRENCY[currency.toUpperCase()] || DEFAULT_MAX_SERVICE_FEE_CENTS;
  const calculatedServiceFee = Math.round((safeTotal * SERVICE_FEE_PERCENTAGE) / 100);
  const serviceFeeCents = Math.min(calculatedServiceFee, maxServiceFee);

  // Montant de base (hors frais de service)
  const baseAmountCents = safeTotal - serviceFeeCents;

  // Déterminer le type de politique
  const isDaily = durationHours >= 24;
  const policyType: "daily" | "hourly" = isDaily ? "daily" : "hourly";

  // 🏠 Cas hôte : toujours remboursement intégral au guest
  if (role === "host") {
    return {
      allowed: true,
      refundRatio: 1,
      refundAmountCents: safeTotal, // Remboursement total incluant frais de service
      serviceFeeRetainedCents: 0,
      hostPayoutCents: 0,
      guestPenaltyCents: 0,
      reasonCode: "host_full_refund",
      message: "Annulation par l'hôte : remboursement intégral pour le voyageur.",
      policyType,
    };
  }

  // À partir d'ici, rôle = "guest"

  // Réservation déjà commencée / passée
  if (hoursUntilStart <= 0) {
    return {
      allowed: false,
      refundRatio: 0,
      refundAmountCents: 0,
      serviceFeeRetainedCents: serviceFeeCents,
      hostPayoutCents: baseAmountCents,
      guestPenaltyCents: safeTotal,
      reasonCode: "guest_too_late_started",
      message: "Impossible d'annuler une réservation déjà commencée ou passée.",
      policyType,
    };
  }

  let refundRatio = 0;
  let reasonCode = "";
  let message = "";

  if (isDaily) {
    // 📅 POLITIQUE JOURNÉE/NUITÉE (≥ 24h)
    if (hoursUntilStart >= 72) {
      // ≥ 72h avant : 100% remboursé (frais de service retenus)
      refundRatio = 1;
      reasonCode = "guest_full_72h";
      message = `Annulation plus de 72h avant l'arrivée. Remboursement intégral (frais de service de ${(serviceFeeCents / 100).toFixed(2)}€ retenus).`;
    } else if (hoursUntilStart >= 24) {
      // 24h-72h avant : 50% remboursé
      refundRatio = 0.5;
      reasonCode = "guest_partial_24_72h";
      message = "Annulation entre 24h et 72h avant l'arrivée. Remboursement de 50% du montant (hors frais de service).";
    } else {
      // < 24h avant : 0% remboursé
      return {
        allowed: false,
        refundRatio: 0,
        refundAmountCents: 0,
        serviceFeeRetainedCents: serviceFeeCents,
        hostPayoutCents: baseAmountCents,
        guestPenaltyCents: safeTotal,
        reasonCode: "guest_too_late_24h",
        message: "Annulation moins de 24h avant l'arrivée. Aucun remboursement possible.",
        policyType,
      };
    }
  } else {
    // ⏰ POLITIQUE À L'HEURE (< 24h)
    if (hoursUntilStart >= 6) {
      // ≥ 6h avant : 100% remboursé (frais de service retenus)
      refundRatio = 1;
      reasonCode = "guest_full_6h";
      message = `Annulation plus de 6h avant le début. Remboursement intégral (frais de service de ${(serviceFeeCents / 100).toFixed(2)}€ retenus).`;
    } else if (hoursUntilStart >= 2) {
      // 2h-6h avant : 50% remboursé
      refundRatio = 0.5;
      reasonCode = "guest_partial_2_6h";
      message = "Annulation entre 2h et 6h avant le début. Remboursement de 50% du montant (hors frais de service).";
    } else {
      // < 2h avant : 0% remboursé
      return {
        allowed: false,
        refundRatio: 0,
        refundAmountCents: 0,
        serviceFeeRetainedCents: serviceFeeCents,
        hostPayoutCents: baseAmountCents,
        guestPenaltyCents: safeTotal,
        reasonCode: "guest_too_late_2h",
        message: "Annulation moins de 2h avant le début. Aucun remboursement possible.",
        policyType,
      };
    }
  }

  // Calcul des montants
  const refundAmountCents = Math.round(baseAmountCents * refundRatio);
  const hostPayoutCents = baseAmountCents - refundAmountCents;
  const guestPenaltyCents = safeTotal - refundAmountCents;

  return {
    allowed: true,
    refundRatio,
    refundAmountCents,
    serviceFeeRetainedCents: serviceFeeCents,
    hostPayoutCents,
    guestPenaltyCents,
    reasonCode,
    message,
    policyType,
  };
}

/**
 * Formater le temps restant avant la deadline d'annulation
 */
export function formatTimeRemaining(startDate: Date): string {
  const now = new Date();
  const start = new Date(startDate);
  const diffMs = start.getTime() - now.getTime();

  if (diffMs < 0) return "Réservation commencée";

  const hours = Math.floor(diffMs / HOUR_MS);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return `${days}j ${remainingHours}h avant le début`;
  }
  return `${hours}h avant le début`;
}

/**
 * Obtenir les deadlines d'annulation
 */
export function getCancellationDeadlines(startDate: Date, durationHours: number) {
  const start = new Date(startDate);
  const isDaily = durationHours >= 24;

  if (isDaily) {
    return {
      fullRefundDeadline: new Date(start.getTime() - 72 * HOUR_MS),
      partialRefundDeadline: new Date(start.getTime() - 24 * HOUR_MS),
      noRefundAfter: new Date(start.getTime() - 24 * HOUR_MS),
      policyType: "daily" as const,
    };
  } else {
    return {
      fullRefundDeadline: new Date(start.getTime() - 6 * HOUR_MS),
      partialRefundDeadline: new Date(start.getTime() - 2 * HOUR_MS),
      noRefundAfter: new Date(start.getTime() - 2 * HOUR_MS),
      policyType: "hourly" as const,
    };
  }
}

/**
 * Obtenir le montant maximum des frais de service formaté selon la devise
 */
export function getMaxServiceFeeFormatted(currency: string = "EUR"): string {
  const maxCents = MAX_SERVICE_FEE_BY_CURRENCY[currency.toUpperCase()] || DEFAULT_MAX_SERVICE_FEE_CENTS;
  const amount = maxCents / 100;

  const currencySymbols: Record<string, string> = {
    EUR: "€",
    CAD: "$ CAD",
    USD: "$",
    GBP: "£",
    CHF: "CHF",
    XOF: "XOF",
    MAD: "MAD",
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency;

  // Format selon la devise
  if (currency.toUpperCase() === "EUR") {
    return `${amount.toFixed(2)}€`;
  } else if (currency.toUpperCase() === "XOF") {
    return `${Math.round(amount)} ${symbol}`;
  } else {
    return `${amount.toFixed(2)} ${symbol}`;
  }
}

/**
 * Obtenir un résumé de la politique d'annulation pour affichage
 */
export function getCancellationPolicySummary(durationHours: number, currency: string = "EUR"): string {
  const isDaily = durationHours >= 24;
  const maxFee = getMaxServiceFeeFormatted(currency);

  if (isDaily) {
    return `• ≥ 72h avant : remboursement 100% (frais de service retenus, max ${maxFee})
• 24h-72h avant : remboursement 50%
• < 24h avant : aucun remboursement`;
  } else {
    return `• ≥ 6h avant : remboursement 100% (frais de service retenus, max ${maxFee})
• 2h-6h avant : remboursement 50%
• < 2h avant : aucun remboursement`;
  }
}
