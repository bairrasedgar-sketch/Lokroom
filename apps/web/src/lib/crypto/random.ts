// apps/web/src/lib/crypto/random.ts
// 🔒 SÉCURITÉ : Génération de nombres aléatoires cryptographiquement sécurisés
// Utilise la Web Crypto API (compatible Edge Runtime + Node.js)

function randomHex(byteCount: number): string {
  const array = new Uint8Array(byteCount);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomBase64(byteCount: number): string {
  const array = new Uint8Array(byteCount);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export function generateSecureId(length: number = 16): string {
  return randomHex(Math.ceil(length / 2)).substring(0, length);
}

export function generateSecureNonce(): string {
  return randomBase64(24);
}

export function generateRateLimitToken(): string {
  return `${Date.now()}-${randomHex(16)}`;
}

export function generateBadgeId(): string {
  return `badge_${Date.now()}_${generateSecureId(9)}`;
}

export function generateNotificationId(): string {
  return `notif_${Date.now()}_${generateSecureId(9)}`;
}

export function generatePreferenceId(): string {
  return `pref_${Date.now()}_${generateSecureId(9)}`;
}

export function generateSyncId(): string {
  return `sync_${Date.now()}_${generateSecureId(9)}`;
}

export function generatePushId(): string {
  return `push_${Date.now()}_${generateSecureId(9)}`;
}

export function generateAvailabilityId(): string {
  return `dp_${Date.now()}_${generateSecureId(9)}`;
}
