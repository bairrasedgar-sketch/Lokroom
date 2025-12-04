"use client";

import { useEffect, useState } from "react";
import { getDictionaryForLocale, type SupportedLocale, SUPPORTED_LOCALES } from "@/lib/i18n.client";

/**
 * Hook pour utiliser les traductions dans les composants client
 * Lit automatiquement la locale depuis le cookie et retourne le dictionnaire correspondant
 */
export function useTranslation() {
  const [locale, setLocale] = useState<SupportedLocale>("fr");
  const [dict, setDict] = useState(getDictionaryForLocale("fr"));

  useEffect(() => {
    if (typeof document === "undefined") return;

    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const cookieLocale = m?.[1]?.toLowerCase() as SupportedLocale | undefined;

    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      setLocale(cookieLocale);
      setDict(getDictionaryForLocale(cookieLocale));
    }
  }, []);

  return { locale, dict, t: dict };
}

export default useTranslation;
