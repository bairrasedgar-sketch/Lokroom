/**
 * Lok'Room - Configuration des Security Headers
 * Headers de sécurité HTTP pour protéger l'application
 */

export type SecurityHeadersConfig = {
  isDevelopment: boolean;
  s3Host?: string;
};

/**
 * Headers de sécurité de base (appliqués partout)
 */
export const BASE_SECURITY_HEADERS = {
  // Protection XSS
  "X-XSS-Protection": "1; mode=block",

  // Empêche le MIME sniffing
  "X-Content-Type-Options": "nosniff",

  // Empêche le clickjacking (DENY pour score A+)
  "X-Frame-Options": "DENY",

  // Politique de référent
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // DNS Prefetch Control
  "X-DNS-Prefetch-Control": "on",
} as const;

/**
 * Permissions Policy - Limite les features du navigateur
 */
export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=(self)",
  "payment=(self)",
  "usb=()",
  "bluetooth=()",
  "magnetometer=()",
  "accelerometer=()",
  "gyroscope=()",
  "ambient-light-sensor=()",
  "autoplay=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "picture-in-picture=()",
].join(", ");

/**
 * HSTS - Force HTTPS (production uniquement)
 */
export const HSTS_HEADER = "max-age=63072000; includeSubDomains; preload";

/**
 * Génère tous les headers de sécurité
 */
export function generateSecurityHeaders(config: SecurityHeadersConfig): Record<string, string> {
  const headers: Record<string, string> = {
    ...BASE_SECURITY_HEADERS,
    "Permissions-Policy": PERMISSIONS_POLICY,
  };

  // HSTS uniquement en production
  if (!config.isDevelopment) {
    headers["Strict-Transport-Security"] = HSTS_HEADER;
  }

  return headers;
}

/**
 * Headers pour les APIs (CORS + Security)
 * CORS restreint aux domaines autorisés pour la sécurité
 */
export function getApiSecurityHeaders(origin?: string | null): Record<string, string> {
  // Domaines autorisés (ajoutez vos domaines de production ici)
  const allowedOrigins = [
    'https://lokroom.com',
    'https://www.lokroom.com',
    'https://app.lokroom.com',
    // En développement, autoriser localhost
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : []
    ),
  ];

  // Vérifier si l'origine est autorisée
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}

/**
 * @deprecated Use getApiSecurityHeaders() instead for better security
 * Kept for backward compatibility
 */
export const API_SECURITY_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
} as const;

/**
 * Headers pour les assets statiques
 */
export const STATIC_ASSET_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
} as const;

/**
 * Vérifie si une URL est sécurisée (HTTPS)
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Valide un header CSP
 */
export function validateCspDirective(directive: string): boolean {
  // Vérifie que la directive ne contient pas de caractères dangereux
  const dangerousChars = /[<>'"]/;
  return !dangerousChars.test(directive);
}
