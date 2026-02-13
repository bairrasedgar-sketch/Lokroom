/**
 * Lok'Room - Middleware de sécurité centralisé
 * Protection globale de l'application
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

// ============================================
// DÉTECTION D'ATTAQUES
// ============================================

/**
 * Détecte les patterns d'attaque dans l'URL
 */
function detectAttackPatterns(url: string): string | null {
  const attackPatterns = [
    { pattern: /\.\.\//g, type: "path_traversal" },
    { pattern: /%2e%2e%2f/gi, type: "path_traversal_encoded" },
    { pattern: /<script/gi, type: "xss_attempt" },
    { pattern: /javascript:/gi, type: "xss_javascript" },
    { pattern: /union.*select/gi, type: "sql_injection" },
    { pattern: /drop.*table/gi, type: "sql_injection_drop" },
    { pattern: /exec\(/gi, type: "code_injection" },
    { pattern: /eval\(/gi, type: "code_injection_eval" },
    { pattern: /\.env/gi, type: "env_file_access" },
    { pattern: /wp-admin/gi, type: "wordpress_scan" },
    { pattern: /phpmyadmin/gi, type: "phpmyadmin_scan" },
    { pattern: /\.git\//gi, type: "git_directory_access" },
  ];

  for (const { pattern, type } of attackPatterns) {
    if (pattern.test(url)) {
      return type;
    }
  }

  return null;
}

/**
 * Détecte les User-Agents suspects
 */
function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true;

  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /nikto/i,
    /sqlmap/i,
    /nmap/i,
    /masscan/i,
  ];

  // Exceptions: bots légitimes
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slackbot/i,
    /twitterbot/i,
    /facebookexternalhit/i,
  ];

  // Si c'est un bot légitime, pas suspect
  if (legitimateBots.some(pattern => pattern.test(userAgent))) {
    return false;
  }

  // Si c'est un bot suspect
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Vérifie si une IP est dans la liste noire
 */
async function isIpBlacklisted(ip: string): Promise<boolean> {
  // TODO: Implémenter avec Redis
  // const blacklisted = await redis.get(`blacklist:${ip}`);
  // return blacklisted === "1";
  return false;
}

/**
 * Ajoute une IP à la liste noire
 */
async function blacklistIp(ip: string, reason: string, duration = 3600) {
  logger.warn("[Security] IP blacklisted", { ip, reason, duration });
  // TODO: Implémenter avec Redis
  // await redis.setex(`blacklist:${ip}`, duration, "1");
}

// ============================================
// RATE LIMITING GLOBAL
// ============================================

/**
 * Rate limiting global par IP
 */
async function checkGlobalRateLimit(ip: string): Promise<boolean> {
  const { ok } = await rateLimit(`global:${ip}`, 100, 60000); // 100 req/min
  return ok;
}

/**
 * Rate limiting strict pour les endpoints sensibles
 */
async function checkStrictRateLimit(ip: string, endpoint: string): Promise<boolean> {
  const { ok } = await rateLimit(`strict:${ip}:${endpoint}`, 10, 60000); // 10 req/min
  return ok;
}

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================

/**
 * Middleware de sécurité global
 */
export async function securityMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent");
  const url = req.url;
  const pathname = new URL(url).pathname;

  // 1. Vérifier si l'IP est blacklistée
  if (await isIpBlacklisted(ip)) {
    logger.warn("[Security] Blacklisted IP blocked", { ip, pathname });
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  // 2. Détecter les patterns d'attaque dans l'URL
  const attackType = detectAttackPatterns(url);
  if (attackType) {
    logger.warn("[Security] Attack pattern detected", {
      ip,
      userAgent,
      pathname,
      attackType,
    });

    // Blacklister l'IP pour 1 heure
    await blacklistIp(ip, attackType, 3600);

    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // 3. Vérifier le User-Agent suspect
  if (isSuspiciousUserAgent(userAgent)) {
    logger.warn("[Security] Suspicious user agent", {
      ip,
      userAgent,
      pathname,
    });

    // Rate limiting plus strict pour les bots suspects
    const allowed = await checkStrictRateLimit(ip, "suspicious");
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  // 4. Rate limiting global
  const allowed = await checkGlobalRateLimit(ip);
  if (!allowed) {
    logger.warn("[Security] Global rate limit exceeded", { ip, pathname });
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // 5. Rate limiting strict pour les endpoints sensibles
  const sensitiveEndpoints = [
    "/api/auth/",
    "/api/admin/",
    "/api/host/wallet",
    "/api/host/release",
    "/api/bookings/",
    "/api/payments/",
  ];

  if (sensitiveEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    const allowed = await checkStrictRateLimit(ip, pathname);
    if (!allowed) {
      logger.warn("[Security] Strict rate limit exceeded", { ip, pathname });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  // Tout est OK, continuer
  return null;
}

// ============================================
// HELPERS
// ============================================

/**
 * Extrait l'IP réelle du client
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Vérifie si la requête vient d'un environnement de confiance
 */
export function isTrustedEnvironment(req: NextRequest): boolean {
  // Vercel
  if (req.headers.get("x-vercel-id")) return true;

  // Localhost en développement
  if (process.env.NODE_ENV === "development") {
    const ip = getClientIp(req);
    return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
  }

  return false;
}
