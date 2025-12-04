/**
 * Lok'Room - Middleware de sécurité Next.js
 * - Détection locale et devise
 * - Headers de sécurité (CSP, XSS, etc.)
 * - Protection des routes (auth required)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES = [
  "/account",
  "/bookings",
  "/favorites",
  "/messages",
  "/trips",
  "/profile",
  "/host",
];

// Routes publiques (pas de redirection même si dans un path protégé)
const PUBLIC_ROUTES = [
  "/listings",
  "/login",
  "/api",
];

// Langues supportées par Lok'Room
const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "it", "pt", "zh"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Détecte la locale depuis Accept-Language
function pickLocale(req: NextRequest): SupportedLocale {
  const header = (req.headers.get("accept-language") || "").toLowerCase();

  // Essaie de trouver une langue supportée dans l'en-tête
  for (const locale of SUPPORTED_LOCALES) {
    if (header.startsWith(locale) || header.includes(` ${locale}`) || header.includes(`,${locale}`)) {
      return locale;
    }
  }

  // Fallback sur le français
  return "fr";
}

// Détecte devise depuis le pays (en-tête Vercel) sinon EUR par défaut
function pickCurrency(req: NextRequest): "EUR" | "CAD" {
  const cc = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (cc === "CA") return "CAD";
  return "EUR";
}

/**
 * Ajoute les headers de sécurité à la réponse
 */
function addSecurityHeaders(res: NextResponse): void {
  // Protection XSS
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // Empêche le MIME sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");

  // Empêche le clickjacking
  res.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Politique de référent
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (anciennes Feature-Policy)
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)"
  );

  // HSTS - Force HTTPS (2 ans, inclut les sous-domaines)
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}

/**
 * Génère la Content Security Policy
 */
function generateCSP(isDev: boolean): string {
  // En développement, on est plus permissif
  if (isDev) {
    return [
      "default-src 'self';",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://js.stripe.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: blob: https: http:;",
      "connect-src 'self' https: http: ws: wss:;",
      "font-src 'self' https://fonts.gstatic.com data:;",
      "frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com;",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
    ].join(" ");
  }

  // Production - CSP stricte
  const s3Host = process.env.S3_PUBLIC_BASE
    ? new URL(process.env.S3_PUBLIC_BASE).host
    : "";

  return [
    "default-src 'self';",
    // Scripts: Self + Maps + Stripe
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://js.stripe.com;",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
    // Images: Self + Maps + Cloudflare R2 + Google (avatars) + Unsplash
    `img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://lh3.googleusercontent.com https://images.unsplash.com ${s3Host ? `https://${s3Host}` : ""};`,
    // Connexions API
    `connect-src 'self' https://maps.googleapis.com https://api.stripe.com ${s3Host ? `https://${s3Host}` : ""};`,
    // Polices
    "font-src 'self' https://fonts.gstatic.com;",
    // iframes: Stripe + Google Maps
    "frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com;",
    // Sécurité additionnelle
    "object-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
    "frame-ancestors 'self';",
    "upgrade-insecure-requests;",
  ].join(" ");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─────────────────────────────────────────────────────────────
  // 1. PROTECTION DES ROUTES - Vérification authentification
  // ─────────────────────────────────────────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isPublicRoute && isProtectedRoute) {
    // Vérifie le token JWT NextAuth
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Utilisateur non connecté - rediriger vers /login avec returnUrl
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LOCALE & CURRENCY
  // ─────────────────────────────────────────────────────────────
  const res = NextResponse.next();

  // Lis existant
  const cookieLocale = req.cookies.get("locale")?.value as SupportedLocale | undefined;
  const locale: SupportedLocale = cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)
    ? cookieLocale
    : pickLocale(req);

  let currency = req.cookies.get("currency")?.value as
    | "EUR"
    | "CAD"
    | undefined;

  // Défaut si absent
  if (!currency) currency = pickCurrency(req);

  // Pose/rafraîchit cookies (1 an)
  res.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.set("currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Headers utiles côté serveur (headers())
  res.headers.set("x-locale", locale);
  res.headers.set("x-currency", currency);

  // --- Headers de sécurité ---
  addSecurityHeaders(res);

  // --- Content-Security-Policy ---
  const isDev = process.env.NODE_ENV === "development";
  res.headers.set("Content-Security-Policy", generateCSP(isDev));

  return res;
}

// Ignore les assets, images Next et routes API auth NextAuth
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth routes - IMPORTANT for OAuth callbacks)
     * - Static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)).*)",
  ],
};
