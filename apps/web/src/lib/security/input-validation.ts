/**
 * Lok'Room - Validation et sanitization des inputs
 * Protection contre les injections et données malveillantes
 */

import { logger } from "@/lib/logger";

// ============================================
// VALIDATION DES EMAILS
// ============================================

/**
 * Valide un email avec regex stricte
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize un email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ============================================
// VALIDATION DES MONTANTS
// ============================================

/**
 * Valide un montant en centimes (doit être positif et entier)
 */
export function isValidAmountCents(amount: unknown): amount is number {
  return (
    typeof amount === "number" &&
    Number.isInteger(amount) &&
    amount >= 0 &&
    amount <= 999999999 // Max 9,999,999.99€
  );
}

/**
 * Valide un montant en euros (doit être positif)
 */
export function isValidAmountEuros(amount: unknown): amount is number {
  return (
    typeof amount === "number" &&
    amount >= 0 &&
    amount <= 9999999.99 &&
    Number.isFinite(amount)
  );
}

// ============================================
// VALIDATION DES IDs
// ============================================

/**
 * Valide un CUID (format Prisma)
 */
export function isValidCuid(id: string): boolean {
  // CUID format: c + 24 caractères alphanumériques
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

/**
 * Valide un UUID v4
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// ============================================
// SANITIZATION DES STRINGS
// ============================================

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Supprime les caractères de contrôle dangereux
 */
export function removeControlCharacters(text: string): string {
  // Garde seulement les caractères imprimables + newline + tab
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize un texte utilisateur (description, commentaire, etc.)
 */
export function sanitizeUserText(text: string, maxLength = 10000): string {
  return removeControlCharacters(text.trim()).slice(0, maxLength);
}

// ============================================
// VALIDATION DES URLs
// ============================================

/**
 * Valide une URL et vérifie qu'elle est HTTPS
 */
export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valide une URL d'image
 */
export function isValidImageUrl(url: string): boolean {
  if (!isValidHttpsUrl(url)) return false;

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const lowerUrl = url.toLowerCase();

  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

// ============================================
// VALIDATION DES DATES
// ============================================

/**
 * Valide qu'une date est dans le futur
 */
export function isDateInFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Valide qu'une date est dans le passé
 */
export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Valide une plage de dates (start < end)
 */
export function isValidDateRange(start: Date, end: Date): boolean {
  return start.getTime() < end.getTime();
}

// ============================================
// DÉTECTION DE PATTERNS SUSPECTS
// ============================================

/**
 * Détecte des patterns d'injection SQL
 */
export function containsSqlInjectionPattern(text: string): boolean {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(text));
}

/**
 * Détecte des patterns XSS
 */
export function containsXssPattern(text: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return xssPatterns.some(pattern => pattern.test(text));
}

/**
 * Détecte des patterns de path traversal
 */
export function containsPathTraversalPattern(text: string): boolean {
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
  ];

  return pathTraversalPatterns.some(pattern => pattern.test(text));
}

/**
 * Validation complète d'un input utilisateur
 */
export function validateUserInput(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    checkSqlInjection?: boolean;
    checkXss?: boolean;
    checkPathTraversal?: boolean;
  } = {}
): { valid: boolean; error?: string; sanitized?: string } {
  const {
    maxLength = 10000,
    allowHtml = false,
    checkSqlInjection = true,
    checkXss = true,
    checkPathTraversal = true,
  } = options;

  // Vérifier la longueur
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `Input trop long (max ${maxLength} caractères)`,
    };
  }

  // Vérifier les patterns d'injection SQL
  if (checkSqlInjection && containsSqlInjectionPattern(input)) {
    logger.warn("[Security] SQL injection pattern detected", { input: input.slice(0, 100) });
    return {
      valid: false,
      error: "Pattern d'injection SQL détecté",
    };
  }

  // Vérifier les patterns XSS
  if (checkXss && containsXssPattern(input)) {
    logger.warn("[Security] XSS pattern detected", { input: input.slice(0, 100) });
    return {
      valid: false,
      error: "Pattern XSS détecté",
    };
  }

  // Vérifier les patterns de path traversal
  if (checkPathTraversal && containsPathTraversalPattern(input)) {
    logger.warn("[Security] Path traversal pattern detected", { input: input.slice(0, 100) });
    return {
      valid: false,
      error: "Pattern de path traversal détecté",
    };
  }

  // Sanitize
  let sanitized = sanitizeUserText(input, maxLength);
  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return {
    valid: true,
    sanitized,
  };
}

// ============================================
// VALIDATION DES NUMÉROS DE TÉLÉPHONE
// ============================================

/**
 * Valide un numéro de téléphone international
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Format E.164: +[country code][number]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize un numéro de téléphone
 */
export function sanitizePhoneNumber(phone: string): string {
  // Garde seulement les chiffres et le +
  return phone.replace(/[^\d+]/g, '');
}
