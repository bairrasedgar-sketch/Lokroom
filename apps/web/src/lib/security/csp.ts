/**
 * Lok'Room - Content Security Policy (CSP)
 * Configuration CSP complète pour protéger contre XSS et injection de code
 */

export type CspConfig = {
  isDevelopment: boolean;
  s3Host?: string;
  nonce?: string;
};

/**
 * Domaines autorisés pour les scripts
 */
const SCRIPT_SOURCES = {
  self: "'self'",
  maps: "https://maps.googleapis.com https://maps.gstatic.com",
  stripe: "https://js.stripe.com",
  analytics: "https://www.googletagmanager.com https://www.google-analytics.com",
  // En dev, on autorise unsafe-eval et unsafe-inline
  dev: "'unsafe-eval' 'unsafe-inline'",
  // En prod, on autorise uniquement unsafe-inline (nécessaire pour Next.js)
  prod: "'unsafe-inline' 'unsafe-eval'",
} as const;

/**
 * Domaines autorisés pour les styles
 */
const STYLE_SOURCES = {
  self: "'self'",
  inline: "'unsafe-inline'", // Nécessaire pour Tailwind CSS
  fonts: "https://fonts.googleapis.com",
} as const;

/**
 * Domaines autorisés pour les images
 */
const IMAGE_SOURCES = {
  self: "'self'",
  data: "data:",
  blob: "blob:",
  maps: "https://maps.googleapis.com https://maps.gstatic.com",
  google: "https://lh3.googleusercontent.com",
  unsplash: "https://images.unsplash.com",
  pexels: "https://images.pexels.com",
  r2: "https://*.r2.dev https://*.r2.cloudflarestorage.com",
  s3: "https://*.amazonaws.com",
} as const;

/**
 * Domaines autorisés pour les connexions (fetch, XHR, WebSocket)
 */
const CONNECT_SOURCES = {
  self: "'self'",
  maps: "https://maps.googleapis.com",
  stripe: "https://api.stripe.com",
  analytics: "https://www.google-analytics.com https://analytics.google.com",
  r2: "https://*.r2.dev https://*.r2.cloudflarestorage.com",
  s3: "https://*.amazonaws.com",
} as const;

/**
 * Domaines autorisés pour les polices
 */
const FONT_SOURCES = {
  self: "'self'",
  data: "data:",
  fonts: "https://fonts.gstatic.com",
} as const;

/**
 * Domaines autorisés pour les iframes
 */
const FRAME_SOURCES = {
  self: "'self'",
  google: "https://www.google.com",
  stripe: "https://js.stripe.com https://hooks.stripe.com",
} as const;

/**
 * Domaines autorisés pour les médias (audio, video)
 */
const MEDIA_SOURCES = {
  self: "'self'",
  blob: "blob:",
  r2: "https://*.r2.dev https://*.r2.cloudflarestorage.com",
  s3: "https://*.amazonaws.com",
} as const;

/**
 * Génère la directive script-src
 */
function generateScriptSrc(config: CspConfig): string {
  const sources: string[] = [
    SCRIPT_SOURCES.self,
    SCRIPT_SOURCES.maps,
    SCRIPT_SOURCES.stripe,
    SCRIPT_SOURCES.analytics,
  ];

  if (config.isDevelopment) {
    sources.push(SCRIPT_SOURCES.dev as string);
  } else {
    sources.push(SCRIPT_SOURCES.prod as string);
  }

  if (config.nonce) {
    sources.push(`'nonce-${config.nonce}'`);
  }

  return `script-src ${sources.join(" ")}`;
}

/**
 * Génère la directive style-src
 */
function generateStyleSrc(config: CspConfig): string {
  const sources: string[] = [
    STYLE_SOURCES.self,
    STYLE_SOURCES.inline,
    STYLE_SOURCES.fonts,
  ];

  if (config.nonce) {
    sources.push(`'nonce-${config.nonce}'`);
  }

  return `style-src ${sources.join(" ")}`;
}

/**
 * Génère la directive img-src
 */
function generateImgSrc(config: CspConfig): string {
  const sources: string[] = [
    IMAGE_SOURCES.self,
    IMAGE_SOURCES.data,
    IMAGE_SOURCES.blob,
    IMAGE_SOURCES.maps,
    IMAGE_SOURCES.google,
    IMAGE_SOURCES.unsplash,
    IMAGE_SOURCES.pexels,
    IMAGE_SOURCES.r2,
    IMAGE_SOURCES.s3,
  ];

  if (config.s3Host) {
    sources.push(`https://${config.s3Host}`);
  }

  // En dev, autoriser tous les domaines HTTPS et HTTP
  if (config.isDevelopment) {
    sources.push("https:", "http:");
  }

  return `img-src ${sources.join(" ")}`;
}

/**
 * Génère la directive connect-src
 */
function generateConnectSrc(config: CspConfig): string {
  const sources: string[] = [
    CONNECT_SOURCES.self,
    CONNECT_SOURCES.maps,
    CONNECT_SOURCES.stripe,
    CONNECT_SOURCES.analytics,
    CONNECT_SOURCES.r2,
    CONNECT_SOURCES.s3,
  ];

  if (config.s3Host) {
    sources.push(`https://${config.s3Host}`);
  }

  // En dev, autoriser WebSocket et tous les domaines
  if (config.isDevelopment) {
    sources.push("https:", "http:", "ws:", "wss:");
  }

  return `connect-src ${sources.join(" ")}`;
}

/**
 * Génère la directive font-src
 */
function generateFontSrc(): string {
  return `font-src ${FONT_SOURCES.self} ${FONT_SOURCES.data} ${FONT_SOURCES.fonts}`;
}

/**
 * Génère la directive frame-src
 */
function generateFrameSrc(): string {
  return `frame-src ${FRAME_SOURCES.self} ${FRAME_SOURCES.google} ${FRAME_SOURCES.stripe}`;
}

/**
 * Génère la directive media-src
 */
function generateMediaSrc(config: CspConfig): string {
  const sources: string[] = [
    MEDIA_SOURCES.self,
    MEDIA_SOURCES.blob,
    MEDIA_SOURCES.r2,
    MEDIA_SOURCES.s3,
  ];

  if (config.s3Host) {
    sources.push(`https://${config.s3Host}`);
  }

  return `media-src ${sources.join(" ")}`;
}

/**
 * Génère la Content Security Policy complète
 */
export function generateCSP(config: CspConfig): string {
  const directives = [
    "default-src 'self'",
    generateScriptSrc(config),
    generateStyleSrc(config),
    generateImgSrc(config),
    generateConnectSrc(config),
    generateFontSrc(),
    generateFrameSrc(),
    generateMediaSrc(config),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  // upgrade-insecure-requests uniquement en production
  if (!config.isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ") + ";";
}

/**
 * Génère un nonce CSP aléatoire cryptographiquement sécurisé
 * 🔒 SÉCURITÉ : Utilise crypto.randomBytes au lieu de Math.random()
 */
export function generateNonce(): string {
  // Node.js environment (server-side)
  if (typeof require !== "undefined") {
    const { randomBytes } = require("crypto");
    return randomBytes(24).toString("base64");
  }

  // Browser environment avec crypto.randomUUID
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Browser environment avec crypto.getRandomValues
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Fallback: Fail fast si aucune méthode sécurisée n'est disponible
  throw new Error("No secure random number generator available");
}

/**
 * Valide une directive CSP
 */
export function validateCspDirective(directive: string): boolean {
  // Vérifie que la directive ne contient pas de caractères dangereux
  const dangerousChars = /[<>'"]/;
  return !dangerousChars.test(directive);
}

/**
 * Parse une CSP string en objet
 */
export function parseCSP(csp: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};

  csp.split(";").forEach((directive) => {
    const trimmed = directive.trim();
    if (!trimmed) return;

    const [name, ...values] = trimmed.split(/\s+/);
    if (name) {
      directives[name] = values;
    }
  });

  return directives;
}

/**
 * Merge deux CSP (utile pour étendre la CSP de base)
 */
export function mergeCSP(base: string, override: string): string {
  const baseDirectives = parseCSP(base);
  const overrideDirectives = parseCSP(override);

  const merged = { ...baseDirectives };

  Object.entries(overrideDirectives).forEach(([key, values]) => {
    if (merged[key]) {
      // Merge les valeurs en évitant les doublons
      merged[key] = [...new Set([...merged[key], ...values])];
    } else {
      merged[key] = values;
    }
  });

  return Object.entries(merged)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ") + ";";
}
