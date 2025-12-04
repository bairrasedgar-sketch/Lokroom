import fr from "./fr";
import en from "./en";
import es from "./es";
import de from "./de";
import it from "./it";
import pt from "./pt";
import zh from "./zh";

export const dictionaries = {
  fr,
  en,
  es,
  de,
  it,
  pt,
  zh,
};

export type SupportedLang = keyof typeof dictionaries;

export const SUPPORTED_LANGS: SupportedLang[] = [
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "zh",
];

// Deep merge pour fusionner les traductions avec fallback sur le français
function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base } as T;

  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      const overrideValue = override[key];
      const baseValue = base[key];

      if (
        overrideValue &&
        typeof overrideValue === "object" &&
        !Array.isArray(overrideValue) &&
        baseValue &&
        typeof baseValue === "object" &&
        !Array.isArray(baseValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          baseValue as Record<string, unknown>,
          overrideValue as Record<string, unknown>
        );
      } else if (overrideValue !== undefined) {
        (result as Record<string, unknown>)[key] = overrideValue;
      }
    }
  }

  return result;
}

export function getDictionary(lang: SupportedLang) {
  const baseDictionary = dictionaries["fr"];

  if (lang === "fr") {
    return baseDictionary;
  }

  const targetDictionary = dictionaries[lang];

  if (!targetDictionary) {
    return baseDictionary;
  }

  // Fusionne le dictionnaire cible avec le français comme fallback
  return deepMerge(baseDictionary, targetDictionary as Partial<typeof fr>);
}
