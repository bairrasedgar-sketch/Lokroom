// apps/web/src/lib/i18n.client.ts
"use client";

import fr from "@/locales/fr";
import en from "@/locales/en";
import es from "@/locales/es";
import de from "@/locales/de";
import it from "@/locales/it";
import pt from "@/locales/pt";
import zh from "@/locales/zh";

export const SUPPORTED_LOCALES = [
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "zh",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const DICTS: Record<SupportedLocale, any> = {
  fr,
  en,
  es,
  de,
  it,
  pt,
  zh,
};

// 🔎 Lit le cookie `locale` côté client
export function getLocaleFromCookies(): SupportedLocale {
  if (typeof document === "undefined") return "fr";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const raw = (m?.[1] || "fr") as string;
  const code = raw.toLowerCase() as SupportedLocale;
  return (SUPPORTED_LOCALES.includes(code) ? code : "fr") as SupportedLocale;
}

// 📖 Récupère le dictionnaire pour la locale courante (ou une locale forcée)
export function getDictionaryForLocale(locale?: SupportedLocale) {
  const l = locale ?? getLocaleFromCookies();
  return DICTS[l] ?? DICTS.fr;
}
