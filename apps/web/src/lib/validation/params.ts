// apps/web/src/lib/validation/params.ts

/**
 * 🔒 SÉCURITÉ : Utilitaires de validation pour les paramètres de requête
 * Remplace les parseInt() non validés par des validations Zod sécurisées
 */

import { z } from "zod";

/**
 * Parse et valide un paramètre de pagination (page number)
 * @param value - Valeur à parser
 * @param defaultValue - Valeur par défaut si invalide (défaut: 1)
 * @returns Numéro de page validé (minimum 1)
 */
export function parsePageParam(value: string | null, defaultValue: number = 1): number {
  const schema = z.coerce.number().int().positive().min(1).catch(defaultValue);
  return schema.parse(value || defaultValue);
}

/**
 * Parse et valide un paramètre de limite (items per page)
 * @param value - Valeur à parser
 * @param defaultValue - Valeur par défaut si invalide (défaut: 10)
 * @param max - Limite maximale (défaut: 100)
 * @returns Limite validée
 */
export function parseLimitParam(
  value: string | null,
  defaultValue: number = 10,
  max: number = 100
): number {
  const schema = z.coerce
    .number()
    .int()
    .positive()
    .min(1)
    .max(max)
    .catch(defaultValue);
  return schema.parse(value || defaultValue);
}

/**
 * Parse et valide un ID numérique
 * @param value - Valeur à parser
 * @returns ID validé ou null si invalide
 */
export function parseIdParam(value: string | null): number | null {
  if (!value) return null;

  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(value);

  return result.success ? result.data : null;
}

/**
 * Parse et valide un paramètre de priorité (0-5)
 * @param value - Valeur à parser
 * @param defaultValue - Valeur par défaut si invalide (défaut: 0)
 * @returns Priorité validée (0-5)
 */
export function parsePriorityParam(value: string | null, defaultValue: number = 0): number {
  const schema = z.coerce.number().int().min(0).max(5).catch(defaultValue);
  return schema.parse(value || defaultValue);
}

/**
 * Parse et valide un paramètre de montant (prix, etc.)
 * @param value - Valeur à parser
 * @returns Montant validé ou null si invalide
 */
export function parseAmountParam(value: string | null): number | null {
  if (!value) return null;

  const schema = z.coerce.number().positive().finite();
  const result = schema.safeParse(value);

  return result.success ? result.data : null;
}

/**
 * Parse et valide un paramètre de pourcentage (0-100)
 * @param value - Valeur à parser
 * @param defaultValue - Valeur par défaut si invalide
 * @returns Pourcentage validé (0-100)
 */
export function parsePercentageParam(
  value: string | null,
  defaultValue: number = 0
): number {
  const schema = z.coerce.number().min(0).max(100).catch(defaultValue);
  return schema.parse(value || defaultValue);
}

/**
 * Parse et valide un paramètre de timestamp
 * @param value - Valeur à parser
 * @returns Timestamp validé ou null si invalide
 */
export function parseTimestampParam(value: string | null): number | null {
  if (!value) return null;

  const schema = z.coerce.number().int().positive();
  const result = schema.safeParse(value);

  if (!result.success) return null;

  // Vérifier que c'est un timestamp valide (pas trop dans le futur)
  const maxTimestamp = Date.now() + 365 * 24 * 60 * 60 * 1000; // +1 an
  if (result.data > maxTimestamp) return null;

  return result.data;
}

/**
 * Parse et valide un paramètre de durée en jours
 * @param value - Valeur à parser
 * @param defaultValue - Valeur par défaut si invalide (défaut: 1)
 * @param max - Durée maximale en jours (défaut: 365)
 * @returns Durée validée en jours
 */
export function parseDaysParam(
  value: string | null,
  defaultValue: number = 1,
  max: number = 365
): number {
  const schema = z.coerce.number().int().positive().min(1).max(max).catch(defaultValue);
  return schema.parse(value || defaultValue);
}

/**
 * Parse et valide un paramètre de rating (1-5)
 * @param value - Valeur à parser
 * @returns Rating validé ou null si invalide
 */
export function parseRatingParam(value: string | null): number | null {
  if (!value) return null;

  const schema = z.coerce.number().int().min(1).max(5);
  const result = schema.safeParse(value);

  return result.success ? result.data : null;
}

/**
 * Parse et valide un paramètre de capacité (guests, etc.)
 * @param value - Valeur à parser
 * @param defaultValue - Valeur par défaut si invalide (défaut: 1)
 * @param max - Capacité maximale (défaut: 50)
 * @returns Capacité validée
 */
export function parseCapacityParam(
  value: string | null,
  defaultValue: number = 1,
  max: number = 50
): number {
  const schema = z.coerce.number().int().positive().min(1).max(max).catch(defaultValue);
  return schema.parse(value || defaultValue);
}
