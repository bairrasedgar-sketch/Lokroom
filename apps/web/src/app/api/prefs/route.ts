// apps/web/src/app/api/prefs/route.ts
import { NextResponse } from "next/server";

// Langues supportées par Lok'Room
const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "it", "pt", "zh"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Devises supportées
const SUPPORTED_CURRENCIES = ["EUR", "CAD", "USD", "GBP", "CNY"] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export async function POST(req: Request) {
  const { locale, currency } = (await req.json().catch(() => ({}))) as {
    locale?: string;
    currency?: string;
  };

  const res = NextResponse.json({ ok: true });

  // Valide et applique la locale
  if (locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    res.headers.set("x-locale", locale);
  }

  // Valide et applique la devise
  if (currency && SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) {
    res.cookies.set("currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    res.headers.set("x-currency", currency);
  }

  return res;
}
