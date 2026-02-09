/**
 * Lok'Room - Schémas de validation pour les webhooks
 */

import { z } from "zod";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/service";

/**
 * Liste des événements disponibles
 */
const webhookEventValues = Object.values(WEBHOOK_EVENTS) as [string, ...string[]];

/**
 * Schéma pour créer un webhook
 */
export const createWebhookSchema = z.object({
  url: z
    .string()
    .url("URL invalide")
    .max(2048, "URL trop longue")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          const allowedProtocols = ["https:"];
          if (process.env.NODE_ENV === "development") {
            allowedProtocols.push("http:");
          }
          return allowedProtocols.includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: "URL doit utiliser HTTPS (HTTP autorisé en développement)" }
    ),
  events: z
    .array(z.enum(webhookEventValues))
    .min(1, "Au moins un événement requis")
    .max(20, "Maximum 20 événements"),
});

/**
 * Schéma pour mettre à jour un webhook
 */
export const updateWebhookSchema = z.object({
  url: z
    .string()
    .url("URL invalide")
    .max(2048, "URL trop longue")
    .optional(),
  events: z
    .array(z.enum(webhookEventValues))
    .min(1, "Au moins un événement requis")
    .max(20, "Maximum 20 événements")
    .optional(),
  active: z.boolean().optional(),
});

/**
 * Schéma pour tester un webhook
 */
export const testWebhookSchema = z.object({
  event: z.enum(webhookEventValues).optional().default("booking.created"),
});

/**
 * Schéma pour la pagination des deliveries
 */
export const webhookDeliveriesSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(["pending", "success", "failed"]).optional(),
});
