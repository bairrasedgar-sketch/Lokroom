import "server-only";
import { cookies, headers } from "next/headers";
import { getDictionary, SUPPORTED_LANGS, type SupportedLang } from "@/locales";

function isSupportedLang(value: string | undefined): value is SupportedLang {
  return !!value && SUPPORTED_LANGS.includes(value as SupportedLang);
}

// Langue par défaut de Lok’Room
const DEFAULT_LANG: SupportedLang = "fr";

export function resolveLang(): SupportedLang {
  const cookieStore = cookies();
  // Priorité au cookie "locale" (utilisé par le middleware et le client)
  const cookieLang = cookieStore.get("locale")?.value ?? cookieStore.get("lang")?.value;

  if (isSupportedLang(cookieLang)) return cookieLang;

  // petit bonus : tenter de détecter via l'en-tête Accept-Language
  const accept = headers().get("accept-language") || "";
  const maybe = accept.split(",")[0]?.split("-")[0]?.toLowerCase();

  if (isSupportedLang(maybe)) return maybe;

  return DEFAULT_LANG;
}

export function getServerDictionary() {
  const lang = resolveLang();
  const dict = getDictionary(lang);
  return { lang, locale: lang, dict };
}
