// apps/web/src/app/api/prefs/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

// Langues supportées par Lok'Room
const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "it", "pt", "zh"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Devises supportées
const SUPPORTED_CURRENCIES = ["EUR", "CAD", "USD", "GBP", "CNY"] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// 🔒 VALIDATION: Schéma Zod pour les préférences
const prefsSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
});

export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMITING: 20 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`prefs:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // 🔒 VALIDATION: Valider les inputs avec Zod
    let body: z.infer<typeof prefsSchema>;
    try {
      body = prefsSchema.parse(await req.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const { locale, currency } = body;

    const res = NextResponse.json({ ok: true });

    // Applique la locale (déjà validée par Zod)
    if (locale) {
      res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
      res.headers.set("x-locale", locale);
    }

    // Applique la devise (déjà validée par Zod)
    if (currency) {
      res.cookies.set("currency", currency, { path: "/", maxAge: 60 * 60 * 24 * 365 });
      res.headers.set("x-currency", currency);
    }

    return res;
  } catch (error) {
    logger.error("POST /api/prefs error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
