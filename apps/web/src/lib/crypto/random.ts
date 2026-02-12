// apps/web/src/lib/crypto/random.ts
// 🔒 SÉCURITÉ : Génération de nombres aléatoires cryptographiquement sécurisés

import { randomBytes } from "crypto";

/**
 * Génère un ID aléatoire sécurisé
 * @param length - Longueur de l'ID (défaut: 16 caractères)
 * @returns ID aléatoire en base36
 */
export function generateSecureId(length: number = 16): string {
  const bytes = randomBytes(Math.ceil(length * 0.75));
  return bytes.toString("base64url").substring(0, length);
}

/**
 * Génère un nonce CSP sécurisé
 * @returns Nonce de 32 caractères
 */
export function generateSecureNonce(): string {
  return randomBytes(24).toString("base64");
}

/**
 * Génère un token sécurisé pour rate limiting
 * @returns Token unique
 */
export function generateRateLimitToken(): string {
  return `${Date.now()}-${randomBytes(16).toString("hex")}`;
}

/**
 * Génère un ID de badge sécurisé
 * @returns ID de badge unique
 */
export function generateBadgeId(): string {
  return `badge_${Date.now()}_${generateSecureId(9)}`;
}

/**
 * Génère un ID de notification sécurisé
 * @returns ID de notification unique
 */
export function generateNotificationId(): string {
  return `notif_${Date.now()}_${generateSecureId(9)}`;
}

/**
 * Génère un ID de préférence sécurisé
 * @returns ID de préférence unique
 */
export function generatePreferenceId(): string {
  return `pref_${Date.now()}_${generateSecureId(9)}`;
}

/**
 * Génère un ID de synchronisation sécurisé
 * @returns ID de sync unique
 */
export function generateSyncId(): string {
  return `sync_${Date.now()}_${generateSecureId(9)}`;
}

/**
 * Génère un ID de push subscription sécurisé
 * @returns ID de push unique
 */
export function generatePushId(): string {
  return `push_${Date.now()}_${generateSecureId(9)}`;
}

/**
 * Génère un ID de disponibilité sécurisé
 * @returns ID de disponibilité unique
 */
export function generateAvailabilityId(): string {
  return `dp_${Date.now()}_${generateSecureId(9)}`;
}
