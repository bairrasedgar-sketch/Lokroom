import { NextResponse, type NextRequest } from "next/server";

// Ultra-safe: pas de req.geo, pas d'assertions TS, pas de startsWith exotique
function pickLocale(req: NextRequest): "fr" | "en" {
  const header = (req.headers.get("accept-language") || "").toLowerCase();
  if (header.includes("fr")) return "fr";
  return "en";
}

function pickCurrency(req: NextRequest): "EUR" | "CAD" {
  // Essaie d'abord le pays réseau (Vercel), sinon heuristique simple
  const cc = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (cc === "CA") return "CAD";
  return "EUR";
}

export function middleware(req: NextRequest) {
  // IMPORTANT: ne pas manipuler req.nextUrl ici (on ne redirige pas)
  const res = NextResponse.next();

  // Lis d'abord les cookies existants
  const cookieLocale = req.cookies.get("locale")?.value;
  const cookieCurrency = req.cookies.get("currency")?.value;

  // Déduis si manquant
  const locale = (cookieLocale === "fr" || cookieLocale === "en")
    ? cookieLocale
    : pickLocale(req);
  const currency = (cookieCurrency === "EUR" || cookieCurrency === "CAD")
    ? cookieCurrency
    : pickCurrency(req);

  // (Re)pose les cookies (1 an)
  res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  res.cookies.set("currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  // Ajoute des headers pour les pages serveur (headers())
  res.headers.set("x-locale", locale);
  res.headers.set("x-currency", currency);

  return res;
}

// Applique partout sauf assets/_next
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
