/**
 * Lok'Room - Sanitization des inputs utilisateur
 * Protection contre XSS et injection de code
 */

import DOMPurify from "isomorphic-dompurify";

// ============================================
// CONFIGURATION DOMPURIFY
// ============================================

/**
 * Configuration stricte pour les textes simples
 * Supprime TOUS les tags HTML
 */
const STRICT_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
  KEEP_CONTENT: true,
};

/**
 * Configuration permissive pour les descriptions riches
 * Autorise les tags de formatage basiques
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a"],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOW_DATA_ATTR: false,
};

// ============================================
// FONCTIONS DE SANITIZATION
// ============================================

/**
 * Sanitize un texte simple (nom, titre, etc.)
 * Supprime tous les tags HTML et scripts
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  // Trim et normalise les espaces
  let cleaned = input.trim().replace(/\s+/g, " ");

  // Supprime tous les tags HTML
  cleaned = DOMPurify.sanitize(cleaned, STRICT_CONFIG);

  // Supprime les caractères de contrôle dangereux
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  return cleaned;
}

/**
 * Sanitize un texte riche (description, commentaire)
 * Autorise les tags de formatage basiques
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";

  // Trim
  let cleaned = input.trim();

  // Sanitize avec tags autorisés
  cleaned = DOMPurify.sanitize(cleaned, RICH_TEXT_CONFIG);

  // Sécurise les liens (force target="_blank" et rel="noopener noreferrer")
  cleaned = cleaned.replace(
    /<a\s+href="([^"]+)"[^>]*>/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">'
  );

  return cleaned;
}

/**
 * Sanitize une URL
 * Vérifie que c'est une URL valide et sécurisée
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;

  const cleaned = input.trim();

  try {
    const url = new URL(cleaned);

    // Autorise uniquement http et https
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    // Bloque les URLs javascript:, data:, etc.
    if (
      cleaned.toLowerCase().startsWith("javascript:") ||
      cleaned.toLowerCase().startsWith("data:") ||
      cleaned.toLowerCase().startsWith("vbscript:")
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize un email
 * Normalise et valide le format
 */
export function sanitizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;

  const cleaned = input.trim().toLowerCase();

  // Regex simple pour valider le format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize un numéro de téléphone
 * Garde uniquement les chiffres et le +
 */
export function sanitizePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Garde uniquement les chiffres, +, -, (, ), espaces
  const cleaned = input.replace(/[^\d+\-() ]/g, "");

  if (cleaned.length < 8) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize un objet entier (récursif)
 * Applique sanitizeText sur toutes les strings
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  richTextFields: string[] = []
): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === "string") {
      // Utilise sanitizeRichText pour les champs spécifiés
      if (richTextFields.includes(key)) {
        sanitized[key] = sanitizeRichText(value) as any;
      } else {
        sanitized[key] = sanitizeText(value) as any;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) =>
        typeof item === "string"
          ? sanitizeText(item)
          : typeof item === "object"
            ? sanitizeObject(item, richTextFields)
            : item
      ) as any;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value, richTextFields) as any;
    }
  }

  return sanitized;
}

/**
 * Sanitize les query params d'une URL
 */
export function sanitizeQueryParams(
  params: Record<string, string | string[] | undefined>
): Record<string, string | string[]> {
  const sanitized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;

    const cleanKey = sanitizeText(key);

    if (Array.isArray(value)) {
      sanitized[cleanKey] = value.map((v) => sanitizeText(v));
    } else {
      sanitized[cleanKey] = sanitizeText(value);
    }
  }

  return sanitized;
}

/**
 * Vérifie si une string contient du code potentiellement dangereux
 */
export function containsMaliciousCode(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Bloque une requête si elle contient du code malicieux
 */
export function validateNoMaliciousCode(input: string): void {
  if (containsMaliciousCode(input)) {
    throw new Error("Contenu suspect détecté");
  }
}
