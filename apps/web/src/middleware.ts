/**
 * Lok'Room - Middleware de sécurité Next.js
 * - Détection locale et devise
 * - Headers de sécurité (CSP, XSS, etc.)
 * - Protection des routes (auth required)
 * - Protection admin avec permissions par rôle
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rôles admin autorisés
const ADMIN_ROLES = ["ADMIN", "MODERATOR", "SUPPORT", "FINANCE"];

// Pages accessibles par rôle admin
const ROLE_PAGES: Record<string, string[]> = {
  ADMIN: ["/admin", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/disputes", "/admin/logs", "/admin/settings"],
  MODERATOR: ["/admin", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/disputes", "/admin/logs"],
  SUPPORT: ["/admin", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/disputes"],
  FINANCE: ["/admin", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/disputes"],
};

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

// Routes qui nécessitent le rôle ADMIN
const ADMIN_ROUTES = ["/admin"];

// Routes publiques (pas de redirection même si dans un path protégé)
const PUBLIC_ROUTES = [
  "/listings",
  "/login",
  "/api",
  "/maintenance",
  "/onboarding",
];

// Langues supportées par Lok'Room
const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "it", "pt", "zh"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Devises supportées
type SupportedCurrency = "EUR" | "CAD" | "USD" | "GBP" | "CNY";

// Mapping pays -> devise par défaut
const COUNTRY_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  // Amérique du Nord
  CA: "CAD", // Canada
  US: "USD", // États-Unis

  // Europe (Zone Euro)
  FR: "EUR", // France
  DE: "EUR", // Allemagne
  ES: "EUR", // Espagne
  IT: "EUR", // Italie
  PT: "EUR", // Portugal
  NL: "EUR", // Pays-Bas
  BE: "EUR", // Belgique
  AT: "EUR", // Autriche
  IE: "EUR", // Irlande
  FI: "EUR", // Finlande
  LU: "EUR", // Luxembourg
  GR: "EUR", // Grèce

  // Europe (Hors zone Euro)
  GB: "GBP", // Royaume-Uni
  CH: "EUR", // Suisse (on utilise EUR pour simplifier)

  // Asie
  CN: "CNY", // Chine
  HK: "CNY", // Hong Kong
  TW: "CNY", // Taiwan
  MO: "CNY", // Macao
};

// Mapping pays -> langue par défaut
const COUNTRY_LOCALE_MAP: Record<string, SupportedLocale> = {
  // Francophone
  FR: "fr", // France
  BE: "fr", // Belgique
  CH: "fr", // Suisse
  CA: "fr", // Canada (Québec en priorité)
  LU: "fr", // Luxembourg
  MC: "fr", // Monaco

  // Anglophone
  US: "en", // États-Unis
  GB: "en", // Royaume-Uni
  IE: "en", // Irlande
  AU: "en", // Australie
  NZ: "en", // Nouvelle-Zélande

  // Hispanophone
  ES: "es", // Espagne
  MX: "es", // Mexique
  AR: "es", // Argentine
  CO: "es", // Colombie

  // Germanophone
  DE: "de", // Allemagne
  AT: "de", // Autriche

  // Italien
  IT: "it", // Italie

  // Portugais
  PT: "pt", // Portugal
  BR: "pt", // Brésil

  // Chinois
  CN: "zh", // Chine
  HK: "zh", // Hong Kong
  TW: "zh", // Taiwan
};

// Détecte la locale depuis le pays IP ou Accept-Language
function pickLocale(req: NextRequest): SupportedLocale {
  // 1. Essayer d'abord par le pays IP (Vercel)
  const countryCode = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (countryCode && COUNTRY_LOCALE_MAP[countryCode]) {
    return COUNTRY_LOCALE_MAP[countryCode];
  }

  // 2. Fallback sur Accept-Language
  const header = (req.headers.get("accept-language") || "").toLowerCase();

  // Essaie de trouver une langue supportée dans l'en-tête
  for (const locale of SUPPORTED_LOCALES) {
    if (header.startsWith(locale) || header.includes(` ${locale}`) || header.includes(`,${locale}`)) {
      return locale;
    }
  }

  // 3. Fallback sur le français
  return "fr";
}

// Détecte devise depuis le pays IP
function pickCurrency(req: NextRequest): SupportedCurrency {
  const countryCode = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();

  if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
    return COUNTRY_CURRENCY_MAP[countryCode];
  }

  // Par défaut EUR
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
  // 0. ONBOARDING - Forcer la complétion du profil
  // ─────────────────────────────────────────────────────────────
  const isOnboardingExcluded =
    pathname === "/onboarding" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin");

  if (!isOnboardingExcluded) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Si connecté mais onboarding non complété, rediriger vers /onboarding
    if (token && token.onboardingCompleted === false) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. PROTECTION DES ROUTES - Vérification authentification
  // ─────────────────────────────────────────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Routes admin - nécessitent authentification + rôle admin
  if (isAdminRoute) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Non connecté - rediriger vers /login
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string | undefined;

    // Vérifier que c'est un rôle admin
    if (!role || !ADMIN_ROLES.includes(role)) {
      // Pas admin - rediriger vers la page d'accueil avec erreur
      const homeUrl = new URL("/", req.url);
      homeUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(homeUrl);
    }

    // Vérifier que ce rôle a accès à cette page
    const allowedPages = ROLE_PAGES[role] || [];
    const normalizedPath = pathname.replace(/\/$/, "") || "/admin";
    const hasAccess = allowedPages.some(page =>
      normalizedPath === page || normalizedPath.startsWith(page + "/")
    );

    if (!hasAccess) {
      // Pas accès à cette page - rediriger vers le dashboard admin
      const adminUrl = new URL("/admin", req.url);
      adminUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(adminUrl);
    }
  }

  // Routes protégées standard
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

  const cookieCurrency = req.cookies.get("currency")?.value as SupportedCurrency | undefined;
  const validCurrencies: SupportedCurrency[] = ["EUR", "CAD", "USD", "GBP", "CNY"];
  const currency: SupportedCurrency = cookieCurrency && validCurrencies.includes(cookieCurrency)
    ? cookieCurrency
    : pickCurrency(req);

  // Pose/rafraîchit cookies (1 an)
  res.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Doit être accessible en JS pour le changement de langue
  });
  res.cookies.set("currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Doit être accessible en JS pour le changement de devise
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
