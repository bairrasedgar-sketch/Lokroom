/**
 * Lok'Room - Index des utilitaires de sécurité
 * Export centralisé de tous les modules de sécurité
 */

// Headers de sécurité
export {
  BASE_SECURITY_HEADERS,
  PERMISSIONS_POLICY,
  HSTS_HEADER,
  API_SECURITY_HEADERS,
  STATIC_ASSET_HEADERS,
  generateSecurityHeaders,
  isSecureUrl,
  validateCspDirective,
  type SecurityHeadersConfig,
} from "./headers";

// Content Security Policy
export {
  generateCSP,
  generateNonce,
  parseCSP,
  mergeCSP,
  type CspConfig,
} from "./csp";

// Rate Limiting
export {
  authRateLimiter,
  apiRateLimiter,
  publicRateLimiter,
  strictRateLimiter,
  getIdentifier,
  withRateLimit,
  withRateLimitHandler,
} from "./rate-limit";

// CSRF Protection
export {
  generateCsrfToken,
  hashCsrfToken,
  verifyCsrfToken,
  validateCsrfToken,
  addCsrfToken,
  withCsrfProtection,
  getCsrfTokenFromCookie,
  addCsrfHeader,
} from "./csrf";

// Input Sanitization
export {
  sanitizeText,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  sanitizeQueryParams,
  containsMaliciousCode,
  validateNoMaliciousCode,
} from "./sanitize";
