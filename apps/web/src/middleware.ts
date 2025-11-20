import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Détecte fr/en depuis Accept-Language
function pickLocale(req: NextRequest): "fr" | "en" {
  const header = (req.headers.get("accept-language") || "").toLowerCase();
  // On prend "fr" si c'est en tête ou présent tôt dans la chaîne
  if (header.startsWith("fr") || header.includes(" fr")) return "fr";
  return "en";
}

// Détecte devise depuis le pays (en-tête Vercel) sinon EUR par défaut
function pickCurrency(req: NextRequest): "EUR" | "CAD" {
  const cc = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (cc === "CA") return "CAD";
  return "EUR";
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Lis existant
  let locale = req.cookies.get("locale")?.value as "fr" | "en" | undefined;
  let currency = req.cookies.get("currency")?.value as
    | "EUR"
    | "CAD"
    | undefined;

  // Défaut si absent
  if (!locale) locale = pickLocale(req);
  if (!currency) currency = pickCurrency(req);

  // Pose/rafraîchit cookies (1 an)
  res.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  res.cookies.set("currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Headers utiles côté serveur (headers())
  res.headers.set("x-locale", locale);
  res.headers.set("x-currency", currency);

  // --- Content-Security-Policy ---
  // En développement, on évite de se prendre la tête → pas de CSP stricte
  if (process.env.NODE_ENV === "production") {
    const csp = [
      "default-src 'self';",
      // Google Maps a besoin de 'unsafe-eval' + domaines maps
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com;",
      "connect-src 'self' https://maps.googleapis.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "frame-src https://www.google.com;",
    ].join(" ");

    res.headers.set("Content-Security-Policy", csp);
  }

  return res;
}

// Ignore les assets et images Next
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)).*)",
  ],
};
