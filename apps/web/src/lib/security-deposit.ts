// apps/web/src/lib/security-deposit.ts
/**
 * Gestion des dépôts de garantie (caution) pour Lok'Room
 *
 * Flux:
 * 1. Guest réserve -> Paiement réservation + Autorisation caution (hold)
 * 2. Séjour terminé -> Hôte a X jours pour réclamer
 * 3. Si réclamation -> Capture partielle/totale + notification
 * 4. Si pas de réclamation -> Release automatique après X jours
 * 5. Guest notifié à chaque étape
 */

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type { SecurityDepositStatus } from "@prisma/client";
import { logger } from "@/lib/logger";


// Durée maximale d'un hold Stripe (7 jours)
const STRIPE_HOLD_DAYS = 7;

// Types
export type CreateDepositHoldResult = {
  success: boolean;
  depositId?: string;
  clientSecret?: string;
  error?: string;
};

export type CaptureDepositResult = {
  success: boolean;
  capturedAmount?: number;
  error?: string;
};

export type ReleaseDepositResult = {
  success: boolean;
  error?: string;
};

export type DepositStatusResult = {
  id: string;
  status: SecurityDepositStatus;
  amountCents: number;
  currency: string;
  capturedAmountCents: number | null;
  captureReason: string | null;
  capturedAt: Date | null;
  releasedAt: Date | null;
  expiresAt: Date;
  damagePhotos: string[];
  createdAt: Date;
};

/**
 * Crée un hold Stripe pour le dépôt de garantie
 * Utilise capture_method: 'manual' pour autoriser sans capturer
 */
export async function createDepositHold(
  bookingId: string,
  amountCents: number,
  currency: string = "EUR"
): Promise<CreateDepositHoldResult> {
  try {
    // Vérifier que la réservation existe et n'a pas déjà un dépôt
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        securityDeposit: true,
        listing: {
          include: { owner: true },
        },
        guest: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Réservation introuvable" };
    }

    if (booking.securityDeposit) {
      return { success: false, error: "Un dépôt de garantie existe déjà pour cette réservation" };
    }

    // Calculer la date d'expiration (7 jours max pour Stripe)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + STRIPE_HOLD_DAYS);

    // Créer le PaymentIntent avec capture manuelle
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      capture_method: "manual", // Important: autorisation sans capture
      metadata: {
        type: "security_deposit",
        bookingId,
        hostUserId: booking.listing.ownerId,
        guestUserId: booking.guestId,
      },
      description: `Caution - Réservation ${bookingId}`,
    });

    // Créer l'enregistrement SecurityDeposit
    const deposit = await prisma.securityDeposit.create({
      data: {
        bookingId,
        amountCents,
        currency: currency.toUpperCase(),
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        expiresAt,
      },
    });

    return {
      success: true,
      depositId: deposit.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur création hold:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Confirme l'autorisation après paiement réussi
 * Appelé par le webhook ou après confirmation côté client
 */
export async function authorizeDeposit(
  depositId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const deposit = await prisma.securityDeposit.findUnique({
      where: { id: depositId },
      include: {
        booking: {
          include: {
            listing: {
              include: {
                securityDepositPolicy: true,
              },
            },
          },
        },
      },
    });

    if (!deposit) {
      return { success: false, error: "Dépôt introuvable" };
    }

    if (deposit.status !== "PENDING") {
      return { success: false, error: "Le dépôt n'est pas en attente" };
    }

    // Calculer la nouvelle date d'expiration basée sur la politique
    const refundDays = deposit.booking.listing.securityDepositPolicy?.refundDays || 7;
    const checkoutDate = new Date(deposit.booking.endDate);
    const expiresAt = new Date(checkoutDate);
    expiresAt.setDate(expiresAt.getDate() + refundDays);

    // Mettre à jour le statut
    await prisma.securityDeposit.update({
      where: { id: depositId },
      data: {
        status: "AUTHORIZED",
        expiresAt,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur autorisation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Capture tout ou partie du dépôt (en cas de dommages)
 * Seul l'hôte ou un admin peut capturer
 */
export async function captureDeposit(
  depositId: string,
  amountCents: number,
  reason: string,
  damagePhotos: string[] = []
): Promise<CaptureDepositResult> {
  try {
    const deposit = await prisma.securityDeposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      return { success: false, error: "Dépôt introuvable" };
    }

    if (deposit.status !== "AUTHORIZED") {
      return { success: false, error: "Le dépôt n'est pas autorisé" };
    }

    if (amountCents > deposit.amountCents) {
      return { success: false, error: "Le montant demandé dépasse le montant autorisé" };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Une raison est obligatoire pour capturer le dépôt" };
    }

    if (!deposit.stripePaymentIntentId) {
      return { success: false, error: "PaymentIntent Stripe manquant" };
    }

    // Capturer le montant via Stripe
    const paymentIntent = await stripe.paymentIntents.capture(
      deposit.stripePaymentIntentId,
      {
        amount_to_capture: amountCents,
      }
    );

    // Déterminer le statut final
    const isPartial = amountCents < deposit.amountCents;
    const newStatus: SecurityDepositStatus = isPartial ? "PARTIALLY_CAPTURED" : "CAPTURED";

    // Récupérer le charge ID
    const chargeId = paymentIntent.latest_charge as string | null;

    // Mettre à jour le dépôt
    await prisma.securityDeposit.update({
      where: { id: depositId },
      data: {
        status: newStatus,
        capturedAmountCents: amountCents,
        captureReason: reason,
        capturedAt: new Date(),
        stripeChargeId: chargeId,
        damagePhotos,
      },
    });

    return {
      success: true,
      capturedAmount: amountCents,
    };
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur capture:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Libère le dépôt (annule le hold Stripe)
 * Appelé automatiquement après X jours ou manuellement par l'hôte
 */
export async function releaseDeposit(
  depositId: string
): Promise<ReleaseDepositResult> {
  try {
    const deposit = await prisma.securityDeposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      return { success: false, error: "Dépôt introuvable" };
    }

    if (deposit.status !== "AUTHORIZED") {
      return { success: false, error: "Le dépôt n'est pas autorisé ou a déjà été traité" };
    }

    if (!deposit.stripePaymentIntentId) {
      return { success: false, error: "PaymentIntent Stripe manquant" };
    }

    // Annuler le PaymentIntent (libère le hold)
    await stripe.paymentIntents.cancel(deposit.stripePaymentIntentId);

    // Mettre à jour le dépôt
    await prisma.securityDeposit.update({
      where: { id: depositId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur libération:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Vérifie et libère les dépôts expirés
 * À appeler via un cron job quotidien
 */
export async function checkExpiredDeposits(): Promise<{
  processed: number;
  released: number;
  errors: number;
}> {
  const now = new Date();
  let processed = 0;
  let released = 0;
  let errors = 0;

  try {
    // Trouver tous les dépôts autorisés dont la date d'expiration est passée
    const expiredDeposits = await prisma.securityDeposit.findMany({
      where: {
        status: "AUTHORIZED",
        expiresAt: {
          lte: now,
        },
      },
      include: {
        booking: {
          include: {
            guest: true,
            listing: {
              include: { owner: true },
            },
          },
        },
      },
    });

    for (const deposit of expiredDeposits) {
      processed++;
      const result = await releaseDeposit(deposit.id);

      if (result.success) {
        released++;
        logger.debug(`[SecurityDeposit] Dépôt ${deposit.id} libéré automatiquement`);
      } else {
        errors++;
        logger.error(`[SecurityDeposit] Erreur libération ${deposit.id}:`, result.error);
      }
    }
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur vérification dépôts expirés:", error);
  }

  return { processed, released, errors };
}

/**
 * Obtient le statut détaillé d'un dépôt
 */
export async function getDepositStatus(
  bookingId: string
): Promise<DepositStatusResult | null> {
  try {
    const deposit = await prisma.securityDeposit.findUnique({
      where: { bookingId },
    });

    if (!deposit) {
      return null;
    }

    return {
      id: deposit.id,
      status: deposit.status,
      amountCents: deposit.amountCents,
      currency: deposit.currency,
      capturedAmountCents: deposit.capturedAmountCents,
      captureReason: deposit.captureReason,
      capturedAt: deposit.capturedAt,
      releasedAt: deposit.releasedAt,
      expiresAt: deposit.expiresAt,
      damagePhotos: deposit.damagePhotos,
      createdAt: deposit.createdAt,
    };
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur récupération statut:", error);
    return null;
  }
}

/**
 * Obtient la politique de dépôt pour une annonce
 */
export async function getDepositPolicy(listingId: string) {
  try {
    const policy = await prisma.securityDepositPolicy.findUnique({
      where: { listingId },
    });

    return policy;
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur récupération politique:", error);
    return null;
  }
}

/**
 * Met à jour ou crée la politique de dépôt pour une annonce
 */
export async function upsertDepositPolicy(
  listingId: string,
  data: {
    enabled: boolean;
    amountCents: number;
    currency?: string;
    description?: string;
    refundDays?: number;
  }
) {
  try {
    const policy = await prisma.securityDepositPolicy.upsert({
      where: { listingId },
      update: {
        enabled: data.enabled,
        amountCents: data.amountCents,
        currency: data.currency || "EUR",
        description: data.description,
        refundDays: data.refundDays || 7,
      },
      create: {
        listingId,
        enabled: data.enabled,
        amountCents: data.amountCents,
        currency: data.currency || "EUR",
        description: data.description,
        refundDays: data.refundDays || 7,
      },
    });

    return { success: true, policy };
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur mise à jour politique:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Formate un montant en centimes pour l'affichage
 */
export function formatDepositAmount(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Vérifie si un utilisateur peut capturer un dépôt
 */
export async function canCaptureDeposit(
  depositId: string,
  userId: string
): Promise<boolean> {
  try {
    const deposit = await prisma.securityDeposit.findUnique({
      where: { id: depositId },
      include: {
        booking: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!deposit) return false;

    // Vérifier si l'utilisateur est l'hôte
    if (deposit.booking.listing.ownerId === userId) return true;

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    logger.error("[SecurityDeposit] Erreur vérification permissions:", error);
    return false;
  }
}

/**
 * Vérifie si un utilisateur peut libérer un dépôt
 */
export async function canReleaseDeposit(
  depositId: string,
  userId: string
): Promise<boolean> {
  // Mêmes règles que pour la capture
  return canCaptureDeposit(depositId, userId);
}
