import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  translateText,
  detectLanguage,
  getSupportedLanguages,
  isLanguageSupported,
  type SupportedLanguage,
} from "@/lib/translation";

export const dynamic = "force-dynamic";

// Rate limiting simple en memoire (a remplacer par Redis en production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // 50 requetes par minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * POST /api/translate
 * Traduit un texte vers une langue cible
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Verifier le rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Trop de requetes. Veuillez reessayer dans une minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { text, targetLang, sourceLang } = body;

    // Validation
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Le texte est requis" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Le texte ne peut pas depasser 5000 caracteres" },
        { status: 400 }
      );
    }

    if (!targetLang || !isLanguageSupported(targetLang)) {
      return NextResponse.json(
        { error: "Langue cible invalide ou non supportee" },
        { status: 400 }
      );
    }

    if (sourceLang && !isLanguageSupported(sourceLang)) {
      return NextResponse.json(
        { error: "Langue source invalide ou non supportee" },
        { status: 400 }
      );
    }

    // Detecter la langue source si non fournie
    let detectedLang = sourceLang as SupportedLanguage | undefined;
    if (!detectedLang) {
      const detection = await detectLanguage(text);
      detectedLang = detection.language;
    }

    // Si la langue source est la meme que la cible, retourner le texte original
    if (detectedLang === targetLang) {
      return NextResponse.json({
        translatedText: text,
        originalText: text,
        sourceLang: detectedLang,
        targetLang,
        wasTranslated: false,
      });
    }

    // Traduire
    const result = await translateText(text, targetLang, detectedLang);

    return NextResponse.json({
      translatedText: result.translatedText,
      originalText: text,
      sourceLang: result.detectedSourceLanguage || detectedLang,
      targetLang,
      wasTranslated: true,
    });
  } catch (error) {
    console.error("Erreur /api/translate:", error);
    return NextResponse.json(
      { error: "Erreur lors de la traduction" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/translate
 * Retourne la liste des langues supportees
 */
export async function GET() {
  try {
    const languages = getSupportedLanguages();
    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Erreur /api/translate GET:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des langues" },
      { status: 500 }
    );
  }
}
