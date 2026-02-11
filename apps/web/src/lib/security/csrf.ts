/**
 * Lok'Room - Protection CSRF (Cross-Site Request Forgery)
 * Génération et validation de tokens CSRF
 */

import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ============================================
// GÉNÉRATION DE TOKENS
// ============================================

/**
 * Génère un token CSRF aléatoire
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash un token CSRF pour le stocker en DB
 */
export function hashCsrfToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Vérifie qu'un token CSRF est valide
 */
export function verifyCsrfToken(token: string, hashedToken: string): boolean {
  const hash = hashCsrfToken(token);
  return hash === hashedToken;
}

// ============================================
// MIDDLEWARE CSRF
// ============================================

/**
 * Vérifie le token CSRF dans les headers ou body
 */
export async function validateCsrfToken(
  req: NextRequest
): Promise<{ valid: true } | NextResponse> {
  // Skip CSRF pour les requêtes GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return { valid: true };
  }

  // Skip CSRF en développement (optionnel)
  if (process.env.NODE_ENV === "development" && process.env.SKIP_CSRF === "true") {
    return { valid: true };
  }

  // Récupère le token depuis les headers
  const headerToken = req.headers.get("x-csrf-token");

  // Récupère le token depuis les cookies
  const cookieToken = req.cookies.get("csrf-token")?.value;

  // Vérifie que les deux tokens existent et correspondent
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return NextResponse.json(
      { error: "Token CSRF invalide ou manquant" },
      { status: 403 }
    );
  }

  return { valid: true };
}

/**
 * Middleware pour ajouter le token CSRF aux réponses
 */
export function addCsrfToken(res: NextResponse): void {
  // Génère un nouveau token si absent
  const existingToken = res.cookies.get("csrf-token")?.value;

  if (!existingToken) {
    const token = generateCsrfToken();

    res.cookies.set("csrf-token", token, {
      httpOnly: false, // Doit être accessible en JS
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    });

    // Ajoute aussi dans les headers pour faciliter l'accès
    res.headers.set("X-CSRF-Token", token);
  }
}

/**
 * Wrapper pour créer un handler API avec validation CSRF
 */
export function withCsrfProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const csrfResult = await validateCsrfToken(req);

    if (csrfResult instanceof NextResponse) {
      return csrfResult;
    }

    const response = await handler(req);

    // Ajoute le token CSRF à la réponse
    addCsrfToken(response);

    return response;
  };
}

// ============================================
// HELPERS POUR LES FORMULAIRES
// ============================================

/**
 * Récupère le token CSRF depuis les cookies (côté client)
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Ajoute le token CSRF aux headers d'une requête fetch
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfTokenFromCookie();

  if (!token) {
    console.warn("[CSRF] Token CSRF non trouvé dans les cookies");
    return headers;
  }

  return {
    ...headers,
    "X-CSRF-Token": token,
  };
}
