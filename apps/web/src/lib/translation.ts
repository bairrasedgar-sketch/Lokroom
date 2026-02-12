import { logger } from "@/lib/logger";
/**
 * Service de traduction automatique pour Lok'Room
 * Utilise Google Cloud Translation API (gratuit jusqu'a 500k caracteres/mois)
 * Avec fallback vers LibreTranslate si configure
 */

// Types
export type SupportedLanguage =
  | "fr" | "en" | "es" | "de" | "it" | "pt" | "zh" | "ar" | "ja"
  | "nl" | "ru" | "ko" | "pl" | "tr" | "vi" | "th" | "id" | "hi";

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// Langues supportees avec leurs informations
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "fr", name: "French", nativeName: "Francais", flag: "FR" },
  { code: "en", name: "English", nativeName: "English", flag: "GB" },
  { code: "es", name: "Spanish", nativeName: "Espanol", flag: "ES" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "DE" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "IT" },
  { code: "pt", name: "Portuguese", nativeName: "Portugues", flag: "PT" },
  { code: "zh", name: "Chinese", nativeName: "Zhongwen", flag: "CN" },
  { code: "ar", name: "Arabic", nativeName: "Arabi", flag: "SA" },
  { code: "ja", name: "Japanese", nativeName: "Nihongo", flag: "JP" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "NL" },
  { code: "ru", name: "Russian", nativeName: "Russkiy", flag: "RU" },
  { code: "ko", name: "Korean", nativeName: "Hangugeo", flag: "KR" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "PL" },
  { code: "tr", name: "Turkish", nativeName: "Turkce", flag: "TR" },
  { code: "vi", name: "Vietnamese", nativeName: "Tieng Viet", flag: "VN" },
  { code: "th", name: "Thai", nativeName: "Phasa Thai", flag: "TH" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "ID" },
  { code: "hi", name: "Hindi", nativeName: "Hindi", flag: "IN" },
];

// Cache en memoire pour les traductions (evite les appels API repetitifs)
const translationCache = new Map<string, { result: TranslationResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 heures

/**
 * Genere une cle de cache unique pour une traduction
 */
function getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
  return `${sourceLang || "auto"}_${targetLang}_${text.substring(0, 100)}`;
}

/**
 * Recupere une traduction du cache si elle existe et n'est pas expiree
 */
function getFromCache(key: string): TranslationResult | null {
  const cached = translationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  if (cached) {
    translationCache.delete(key);
  }
  return null;
}

/**
 * Stocke une traduction dans le cache
 */
function setInCache(key: string, result: TranslationResult): void {
  // Limite la taille du cache a 1000 entrees
  if (translationCache.size >= 1000) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) {
      translationCache.delete(firstKey);
    }
  }
  translationCache.set(key, { result, timestamp: Date.now() });
}

/**
 * Detecte la langue d'un texte en utilisant Google Cloud Translation API
 */
export async function detectLanguage(text: string): Promise<{ language: SupportedLanguage; confidence: number }> {
  // Texte trop court pour une detection fiable
  if (text.trim().length < 3) {
    return { language: "fr", confidence: 0 };
  }

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  if (!apiKey) {
    // Fallback: detection basique basee sur les caracteres
    return detectLanguageBasic(text);
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text.substring(0, 500) }), // Limite pour economiser les quotas
      }
    );

    if (!response.ok) {
      logger.error("Google Translate detect error:", await response.text());
      return detectLanguageBasic(text);
    }

    const data = await response.json();
    const detection = data.data?.detections?.[0]?.[0];

    if (detection) {
      const lang = detection.language as SupportedLanguage;
      const isSupported = SUPPORTED_LANGUAGES.some(l => l.code === lang);
      return {
        language: isSupported ? lang : "en",
        confidence: detection.confidence || 0.5,
      };
    }

    return detectLanguageBasic(text);
  } catch (error) {
    logger.error("Error detecting language:", error);
    return detectLanguageBasic(text);
  }
}

/**
 * Detection basique de langue basee sur les caracteres (fallback)
 */
function detectLanguageBasic(text: string): { language: SupportedLanguage; confidence: number } {
  // Detection basee sur les caracteres speciaux et patterns
  const patterns: { lang: SupportedLanguage; regex: RegExp; weight: number }[] = [
    { lang: "zh", regex: /[\u4e00-\u9fff]/g, weight: 1 },
    { lang: "ja", regex: /[\u3040-\u309f\u30a0-\u30ff]/g, weight: 1 },
    { lang: "ko", regex: /[\uac00-\ud7af]/g, weight: 1 },
    { lang: "ar", regex: /[\u0600-\u06ff]/g, weight: 1 },
    { lang: "th", regex: /[\u0e00-\u0e7f]/g, weight: 1 },
    { lang: "hi", regex: /[\u0900-\u097f]/g, weight: 1 },
    { lang: "ru", regex: /[\u0400-\u04ff]/g, weight: 1 },
  ];

  for (const { lang, regex, weight } of patterns) {
    const matches = text.match(regex);
    if (matches && matches.length > text.length * 0.1 * weight) {
      return { language: lang, confidence: 0.7 };
    }
  }

  // Detection basee sur des mots courants
  const wordPatterns: { lang: SupportedLanguage; words: string[] }[] = [
    { lang: "fr", words: ["le", "la", "les", "de", "du", "des", "un", "une", "et", "est", "je", "tu", "nous", "vous", "bonjour", "merci"] },
    { lang: "en", words: ["the", "is", "are", "was", "were", "have", "has", "do", "does", "hello", "thank", "you", "and", "or"] },
    { lang: "es", words: ["el", "la", "los", "las", "de", "del", "un", "una", "es", "son", "hola", "gracias", "que", "por"] },
    { lang: "de", words: ["der", "die", "das", "und", "ist", "sind", "ein", "eine", "haben", "hallo", "danke", "ich", "du", "wir"] },
    { lang: "it", words: ["il", "la", "lo", "gli", "le", "di", "del", "un", "una", "e", "ciao", "grazie", "che", "per"] },
    { lang: "pt", words: ["o", "a", "os", "as", "de", "do", "da", "um", "uma", "e", "ola", "obrigado", "que", "por"] },
  ];

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let bestMatch: { lang: SupportedLanguage; score: number } = { lang: "fr", score: 0 };

  for (const { lang, words: langWords } of wordPatterns) {
    let score = 0;
    for (const word of words) {
      if (langWords.includes(word)) {
        score++;
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { lang, score };
    }
  }

  return {
    language: bestMatch.lang,
    confidence: bestMatch.score > 0 ? Math.min(0.5 + bestMatch.score * 0.1, 0.8) : 0.3
  };
}

/**
 * Traduit un texte vers une langue cible
 */
export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<TranslationResult> {
  // Verifier le cache
  const cacheKey = getCacheKey(text, targetLang, sourceLang);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Si la langue source est la meme que la cible, retourner le texte original
  if (sourceLang === targetLang) {
    return { translatedText: text, detectedSourceLanguage: sourceLang };
  }

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const libreTranslateUrl = process.env.LIBRETRANSLATE_URL;
  const deeplApiKey = process.env.DEEPL_API_KEY;

  // Essayer Google Cloud Translation en premier
  if (apiKey) {
    try {
      const result = await translateWithGoogle(text, targetLang, sourceLang, apiKey);
      setInCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error("Google Translate error:", error);
    }
  }

  // Fallback vers DeepL si configure
  if (deeplApiKey) {
    try {
      const result = await translateWithDeepL(text, targetLang, sourceLang, deeplApiKey);
      setInCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error("DeepL error:", error);
    }
  }

  // Fallback vers LibreTranslate si configure
  if (libreTranslateUrl) {
    try {
      const result = await translateWithLibreTranslate(text, targetLang, sourceLang, libreTranslateUrl);
      setInCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error("LibreTranslate error:", error);
    }
  }

  // Aucun service de traduction disponible
  logger.warn("No translation service available");
  return { translatedText: text, detectedSourceLanguage: sourceLang };
}

/**
 * Traduction via Google Cloud Translation API
 */
async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string | undefined,
  apiKey: string
): Promise<TranslationResult> {
  const params: Record<string, string> = {
    q: text,
    target: targetLang,
    key: apiKey,
    format: "text",
  };

  if (sourceLang) {
    params.source = sourceLang;
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate API error: ${response.status}`);
  }

  const data = await response.json();
  const translation = data.data?.translations?.[0];

  if (!translation) {
    throw new Error("No translation returned");
  }

  return {
    translatedText: translation.translatedText,
    detectedSourceLanguage: translation.detectedSourceLanguage || sourceLang,
  };
}

/**
 * Traduction via DeepL API
 */
async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang: string | undefined,
  apiKey: string
): Promise<TranslationResult> {
  // DeepL utilise des codes de langue differents pour certaines langues
  const deeplTargetLang = targetLang === "en" ? "EN-US" : targetLang.toUpperCase();
  const deeplSourceLang = sourceLang ? (sourceLang === "en" ? "EN" : sourceLang.toUpperCase()) : undefined;

  const params = new URLSearchParams({
    text,
    target_lang: deeplTargetLang,
  });

  if (deeplSourceLang) {
    params.append("source_lang", deeplSourceLang);
  }

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status}`);
  }

  const data = await response.json();
  const translation = data.translations?.[0];

  if (!translation) {
    throw new Error("No translation returned from DeepL");
  }

  return {
    translatedText: translation.text,
    detectedSourceLanguage: translation.detected_source_language?.toLowerCase() || sourceLang,
  };
}

/**
 * Traduction via LibreTranslate (self-hosted)
 */
async function translateWithLibreTranslate(
  text: string,
  targetLang: string,
  sourceLang: string | undefined,
  baseUrl: string
): Promise<TranslationResult> {
  const response = await fetch(`${baseUrl}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: sourceLang || "auto",
      target: targetLang,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    translatedText: data.translatedText,
    detectedSourceLanguage: data.detectedLanguage?.language || sourceLang,
  };
}

/**
 * Traduit plusieurs textes en batch (plus efficace pour plusieurs messages)
 */
export async function translateBatch(
  texts: string[],
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<TranslationResult[]> {
  // Pour l'instant, on traduit un par un
  // Une optimisation future serait d'utiliser l'API batch de Google
  const results: TranslationResult[] = [];

  for (const text of texts) {
    const result = await translateText(text, targetLang, sourceLang);
    results.push(result);
  }

  return results;
}

/**
 * Retourne la liste des langues supportees
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Verifie si une langue est supportee
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(l => l.code === lang);
}

/**
 * Obtient les informations d'une langue
 */
export function getLanguageInfo(code: string): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

/**
 * Nettoie le cache de traduction (utile pour les tests ou la maintenance)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Retourne les statistiques du cache
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: translationCache.size,
    maxSize: 1000,
  };
}
