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

export function getDictionary(lang: SupportedLang) {
  return dictionaries[lang] ?? dictionaries["fr"];
}
