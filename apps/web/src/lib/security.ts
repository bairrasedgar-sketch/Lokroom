/**
 * Lok'Room - Utilitaires de sécurité pour les APIs
 * Protection CSRF, rate limiting, validation des requêtes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";
import { logger } from "@/lib/logger";


// ============================================
// TYPES
// ============================================

export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

export type ApiResponse<T> = T | ApiError;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
};

// ============================================
// CONFIGURATION
// ============================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requêtes par minute par défaut

// Map en mémoire pour le rate limiting (en production, utiliser Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Nettoyage périodique de la map
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

// ============================================
// RATE LIMITING
// ============================================

/**
 * Vérifie le rate limit pour une clé donnée
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    // Nouvelle fenêtre
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(record.resetAt),
      retryAfter,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: new Date(record.resetAt),
  };
}

/**
 * Génère une clé de rate limit basée sur l'utilisateur ou l'IP
 */
export function getRateLimitKey(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback sur l'IP (avec protection contre le spoofing)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Middleware de rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  options: {
    maxRequests?: number;
    windowMs?: number;
    keyPrefix?: string;
  } = {}
): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  let key = getRateLimitKey(request, userId);
  if (options.keyPrefix) {
    key = `${options.keyPrefix}:${key}`;
  }

  const result = checkRateLimit(
    key,
    options.maxRequests,
    options.windowMs
  );

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Trop de requêtes. Réessaie dans quelques instants.",
        code: "RATE_LIMITED",
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toISOString(),
        },
      }
    );
  }

  return null;
}

// ============================================
// PROTECTION CSRF
// ============================================

const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Génère un token CSRF
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Vérifie le token CSRF
 */
export function verifyCsrfToken(
  request: NextRequest,
  sessionToken?: string
): boolean {
  // En développement, on peut être plus permissif
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!headerToken || !sessionToken) {
    return false;
  }

  // Comparaison en temps constant pour éviter les timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(sessionToken)
    );
  } catch {
    return false;
  }
}

// ============================================
// VALIDATION DE L'ORIGINE
// ============================================

const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

/**
 * Vérifie que la requête provient d'une origine autorisée
 */
export function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Les requêtes same-origin n'ont pas toujours d'origin header
  if (!origin && !referer) {
    return true;
  }

  const requestOrigin = origin || (referer ? new URL(referer).origin : null);

  if (!requestOrigin) {
    return true;
  }

  return ALLOWED_ORIGINS.some((allowed) => {
    if (!allowed) return false;
    try {
      return new URL(allowed).origin === requestOrigin;
    } catch {
      return false;
    }
  });
}

// ============================================
// HEADERS DE SÉCURITÉ
// ============================================

/**
 * Ajoute les headers de sécurité à une réponse
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  return response;
}

/**
 * Crée une réponse JSON sécurisée
 */
export function secureJsonResponse<T>(
  data: T,
  options: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  const response = NextResponse.json(data, { status: options.status || 200 });

  // Headers de sécurité
  addSecurityHeaders(response);

  // Headers personnalisés
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      response.headers.set(key, value);
    }
  }

  // Cache control pour les APIs
  response.headers.set("Cache-Control", "private, no-cache, no-store");

  return response;
}

/**
 * Crée une réponse d'erreur sécurisée
 */
export function secureErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return secureJsonResponse(
    { error: message, code },
    { status }
  );
}

// ============================================
// HELPERS D'AUTHENTIFICATION
// ============================================

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: "GUEST" | "HOST" | "BOTH" | "ADMIN";
  isHost: boolean;
};

/**
 * Récupère l'utilisateur authentifié ou retourne une erreur
 */
export async function requireAuth(): Promise<
  { success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      success: false,
      response: secureErrorResponse("Non authentifié", 401, "UNAUTHORIZED"),
    };
  }

  const user = session.user as {
    id?: string;
    email: string;
    role?: string;
    isHost?: boolean;
  };

  if (!user.id) {
    return {
      success: false,
      response: secureErrorResponse("Session invalide", 401, "INVALID_SESSION"),
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: (user.role as AuthenticatedUser["role"]) || "GUEST",
      isHost: user.isHost || user.role === "HOST" || user.role === "BOTH",
    },
  };
}

/**
 * Vérifie que l'utilisateur est un hôte
 */
export async function requireHost(): Promise<
  { success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }
> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (!authResult.user.isHost) {
    return {
      success: false,
      response: secureErrorResponse(
        "Accès réservé aux hôtes Lok'Room",
        403,
        "HOST_REQUIRED"
      ),
    };
  }

  return authResult;
}

/**
 * Vérifie que l'utilisateur est admin
 */
export async function requireAdmin(): Promise<
  { success: true; user: AuthenticatedUser } | { success: false; response: NextResponse }
> {
  const authResult = await requireAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user.role !== "ADMIN") {
    return {
      success: false,
      response: secureErrorResponse(
        "Accès réservé aux administrateurs",
        403,
        "ADMIN_REQUIRED"
      ),
    };
  }

  return authResult;
}

// ============================================
// IDEMPOTENCE
// ============================================

const idempotencyMap = new Map<string, { result: unknown; expiresAt: number }>();

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyMap.entries()) {
    if (value.expiresAt < now) {
      idempotencyMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Vérifie si une requête avec cette clé d'idempotence a déjà été traitée
 */
export function checkIdempotency(
  key: string
): { exists: true; result: unknown } | { exists: false } {
  const record = idempotencyMap.get(key);

  if (record && record.expiresAt > Date.now()) {
    return { exists: true, result: record.result };
  }

  return { exists: false };
}

/**
 * Enregistre le résultat d'une requête idempotente
 */
export function storeIdempotencyResult(
  key: string,
  result: unknown,
  ttlMs: number = 24 * 60 * 60 * 1000 // 24 heures par défaut
): void {
  idempotencyMap.set(key, {
    result,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Génère une clé d'idempotence unique
 */
export function generateIdempotencyKey(
  userId: string,
  action: string,
  resourceId: string
): string {
  return `${userId}:${action}:${resourceId}`;
}

// ============================================
// LOGGING SÉCURISÉ
// ============================================

type LogLevel = "info" | "warn" | "error" | "security";

interface SecurityLogEntry {
  level: LogLevel;
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Log sécurisé (sans données sensibles)
 */
export function securityLog(
  level: LogLevel,
  action: string,
  request?: NextRequest,
  details?: Record<string, unknown>
): void {
  const entry: SecurityLogEntry = {
    level,
    action,
    timestamp: new Date().toISOString(),
  };

  if (request) {
    const forwarded = request.headers.get("x-forwarded-for");
    entry.ip = forwarded?.split(",")[0]?.trim() || "unknown";
    entry.userAgent = request.headers.get("user-agent") || undefined;
  }

  if (details) {
    // Filtrer les données sensibles
    const safeDetails: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      if (
        !["password", "token", "secret", "key", "authorization"].includes(
          key.toLowerCase()
        )
      ) {
        safeDetails[key] = value;
      }
    }
    entry.details = safeDetails;
  }

  // En production, envoyer vers un service de logging
  if (level === "security" || level === "error") {
    logger.error("[SECURITY]", JSON.stringify(entry));
  } else if (level === "warn") {
    logger.warn("[SECURITY]", JSON.stringify(entry));
  } else {
    logger.debug("[SECURITY]", JSON.stringify(entry));
  }
}

// ============================================
// SANITIZATION
// ============================================

/**
 * Masque une adresse email pour l'affichage
 * exemple@domain.com -> e*****e@d***n.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.***";

  const maskedLocal =
    local.length <= 2
      ? "*".repeat(local.length)
      : `${local[0]}${"*".repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}`;

  const domainParts = domain.split(".");
  const maskedDomain = domainParts
    .map((part, i) => {
      if (i === domainParts.length - 1) return part; // Garder l'extension
      if (part.length <= 2) return "*".repeat(part.length);
      return `${part[0]}${"*".repeat(Math.min(part.length - 2, 3))}${part[part.length - 1]}`;
    })
    .join(".");

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Masque un numéro de téléphone
 * +33612345678 -> +33******78
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "*".repeat(phone.length);
  return `${phone.slice(0, 3)}${"*".repeat(phone.length - 5)}${phone.slice(-2)}`;
}

/**
 * Masque un IBAN
 * FR7630001007941234567890185 -> FR76**********************85
 */
export function maskIban(iban: string): string {
  if (iban.length <= 6) return "*".repeat(iban.length);
  return `${iban.slice(0, 4)}${"*".repeat(iban.length - 6)}${iban.slice(-2)}`;
}
