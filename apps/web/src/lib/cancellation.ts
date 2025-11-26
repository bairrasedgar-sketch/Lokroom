// apps/web/src/lib/cancellation.ts

export type CancellationRole = "guest" | "host";

export type CancellationDecision = {
  allowed: boolean;
  refundRatio: number; // 0..1 basé sur le prix de base
  refundAmountCents: number;
  guestPenaltyCents: number;
  reasonCode: string;
  message: string;
};

const HOUR_MS = 1000 * 60 * 60;

/**
 * Politique d'annulation Lok'Room (MVP)
 *
 * 🔹 Côté guest :
 *   - ≥ 7 jours avant l'arrivée : remboursement 100%
 *   - 2 à 7 jours avant : remboursement 50%
 *   - 24h à 48h avant : remboursement 25%
 *   - < 24h avant : annulation refusée (0% remboursé)
 *
 * 🔹 Côté host :
 *   - Toujours remboursement 100% pour le guest (l'hôte prend tout le risque)
 */
export function evaluateCancellationPolicy(options: {
  role: CancellationRole;
  now: Date;
  startDate: Date;
  totalPriceCents: number;
}): CancellationDecision {
  const { role, now, startDate, totalPriceCents } = options;

  const diffMs = startDate.getTime() - now.getTime();
  const hoursUntilStart = diffMs / HOUR_MS;

  // Sécurité : si prix <= 0 -> rien à rembourser
  const safeTotal = Math.max(0, totalPriceCents);

  // 🔹 Cas hôte : toujours remboursement intégral au guest
  if (role === "host") {
    const refundAmountCents = safeTotal;
    return {
      allowed: true,
      refundRatio: safeTotal > 0 ? 1 : 0,
      refundAmountCents,
      guestPenaltyCents: safeTotal - refundAmountCents,
      reasonCode: "host_full_refund",
      message: "Annulation par l'hôte : remboursement intégral pour le voyageur.",
    };
  }

  // À partir d'ici, rôle = "guest"

  // Réservation déjà commencée / passée
  if (hoursUntilStart <= 0) {
    return {
      allowed: false,
      refundRatio: 0,
      refundAmountCents: 0,
      guestPenaltyCents: safeTotal,
      reasonCode: "guest_too_late_started",
      message:
        "Impossible d'annuler une réservation déjà commencée ou passée.",
    };
  }

  const FULL_REFUND_H = 24 * 7; // 7 jours
  const HALF_REFUND_H = 48; // 2 jours
  const QUARTER_REFUND_H = 24; // 1 jour

  let refundRatio = 0;
  let reasonCode = "";
  let message = "";

  if (hoursUntilStart >= FULL_REFUND_H) {
    refundRatio = 1;
    reasonCode = "guest_free_7d";
    message = "Annulation gratuite jusqu'à 7 jours avant l'arrivée.";
  } else if (hoursUntilStart >= HALF_REFUND_H) {
    refundRatio = 0.5;
    reasonCode = "guest_partial_50_2d_7d";
    message =
      "Entre 2 et 7 jours avant l'arrivée : 50% remboursé, 50% de frais.";
  } else if (hoursUntilStart >= QUARTER_REFUND_H) {
    refundRatio = 0.25;
    reasonCode = "guest_partial_25_24_48h";
    message =
      "Entre 24h et 48h avant l'arrivée : 25% remboursé, 75% de frais.";
  } else {
    // < 24h : annulation refusée
    return {
      allowed: false,
      refundRatio: 0,
      refundAmountCents: 0,
      guestPenaltyCents: safeTotal,
      reasonCode: "guest_too_late_24h",
      message:
        "Annulation impossible moins de 24h avant l'arrivée (0% remboursé).",
    };
  }

  const refundAmountCents = Math.round(safeTotal * refundRatio);
  const guestPenaltyCents = safeTotal - refundAmountCents;

  return {
    allowed: true,
    refundRatio,
    refundAmountCents,
    guestPenaltyCents,
    reasonCode,
    message,
  };
}
