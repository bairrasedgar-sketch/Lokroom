// apps/web/src/app/api/prefs/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { locale, currency } = (await req.json().catch(() => ({}))) as {
    locale?: "fr" | "en";
    currency?: "EUR" | "CAD";
  };

  const res = NextResponse.json({ ok: true });

  if (locale === "fr" || locale === "en") {
    res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    res.headers.set("x-locale", locale);
  }
  if (currency === "EUR" || currency === "CAD") {
    res.cookies.set("currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    res.headers.set("x-currency", currency);
  }

  return res;
}
