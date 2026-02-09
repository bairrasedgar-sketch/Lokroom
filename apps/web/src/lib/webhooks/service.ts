/**
 * Lok'Room - Service de gestion des webhooks
 * Permet aux développeurs tiers d'intégrer Lok'Room via webhooks
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";

/**
 * Événements disponibles pour les webhooks
 */
export const WEBHOOK_EVENTS = {
  // Bookings
  BOOKING_CREATED: "booking.created",
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_COMPLETED: "booking.completed",

  // Listings
  LISTING_CREATED: "listing.created",
  LISTING_UPDATED: "listing.updated",
  LISTING_DELETED: "listing.deleted",

  // Reviews
  REVIEW_CREATED: "review.created",

  // Messages
  MESSAGE_RECEIVED: "message.received",

  // Payments
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

/**
 * Payload standard d'un webhook
 */
export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Configuration pour le retry
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [0, 60000, 300000], // 0s, 1min, 5min
  timeout: 10000, // 10 secondes
};

/**
 * Génère une signature HMAC-SHA256 pour un payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * Vérifie une signature HMAC-SHA256
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Envoie un webhook à une URL avec retry
 */
async function sendWebhookRequest(
  url: string,
  payload: WebhookPayload,
  secret: string,
  attempt: number = 1
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RETRY_CONFIG.timeout);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lok-Signature": signature,
        "X-Lok-Event": payload.event,
        "X-Lok-Timestamp": payload.timestamp,
        "X-Lok-Attempt": attempt.toString(),
        "User-Agent": "Lokroom-Webhooks/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (response.ok) {
      return { success: true, response: responseData };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText.substring(0, 200)}`,
        response: responseData,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Déclenche un webhook pour un événement donné
 * Trouve tous les webhooks actifs pour cet événement et les envoie en background
 */
export async function triggerWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>,
  userId?: string
): Promise<void> {
  // Construire le payload
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Trouver tous les webhooks actifs pour cet événement
  const webhooks = await prisma.webhook.findMany({
    where: {
      active: true,
      events: {
        has: event,
      },
      ...(userId ? { userId } : {}),
    },
  });

  if (webhooks.length === 0) {
    return;
  }

  // Pour chaque webhook, créer une delivery et l'envoyer en background
  const deliveryPromises = webhooks.map(async (webhook) => {
    // Créer l'enregistrement de delivery
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as never,
        status: "pending",
        attempts: 0,
      },
    });

    // Envoyer en background avec retry
    processWebhookDelivery(delivery.id, webhook.url, payload, webhook.secret).catch(
      (error) => {
        console.error(`Failed to process webhook delivery ${delivery.id}:`, error);
      }
    );
  });

  // Ne pas attendre les deliveries (background processing)
  await Promise.allSettled(deliveryPromises);
}

/**
 * Traite une delivery de webhook avec retry logic
 */
async function processWebhookDelivery(
  deliveryId: string,
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<void> {
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    // Attendre le délai de retry si ce n'est pas la première tentative
    if (attempt > 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_CONFIG.delays[attempt - 1])
      );
    }

    // Envoyer la requête
    const result = await sendWebhookRequest(url, payload, secret, attempt);

    // Mettre à jour la delivery
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: attempt,
        lastAttempt: new Date(),
        status: result.success ? "success" : "pending",
        response: result.response
          ? (result.response as never)
          : result.error
          ? ({ error: result.error } as never)
          : ({} as never),
      },
    });

    // Si succès, arrêter
    if (result.success) {
      return;
    }

    // Si dernière tentative, marquer comme failed
    if (attempt === RETRY_CONFIG.maxAttempts) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
        },
      });
    }
  }
}

/**
 * Génère un secret aléatoire pour un webhook
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Valide une URL de webhook
 */
export function validateWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    // En production, forcer HTTPS
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return { valid: false, error: "HTTPS requis en production" };
    }

    // Bloquer localhost en production
    if (
      process.env.NODE_ENV === "production" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return { valid: false, error: "localhost non autorisé en production" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "URL invalide" };
  }
}

/**
 * Compte le nombre de webhooks d'un utilisateur
 */
export async function countUserWebhooks(userId: string): Promise<number> {
  return prisma.webhook.count({
    where: { userId },
  });
}

/**
 * Limite de webhooks par utilisateur
 */
export const MAX_WEBHOOKS_PER_USER = 100;
