import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  translateText,
  detectLanguage,
  isLanguageSupported,
  type SupportedLanguage,
} from "@/lib/translation";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/messages/[id]/translate?targetLang=fr
 * Traduit un message specifique vers une langue cible
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const targetLang = searchParams.get("targetLang") || "fr";

    if (!isLanguageSupported(targetLang)) {
      return NextResponse.json(
        { error: "Langue cible non supportee" },
        { status: 400 }
      );
    }

    // Recuperer le message avec sa conversation
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            hostId: true,
            guestId: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message introuvable" },
        { status: 404 }
      );
    }

    // Verifier que l'utilisateur fait partie de la conversation
    const userId = session.user.id;
    if (
      userId !== message.conversation.hostId &&
      userId !== message.conversation.guestId
    ) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    // Verifier si la traduction existe deja en cache
    const existingTranslations = (message.translations as Record<string, string>) || {};
    if (existingTranslations[targetLang]) {
      return NextResponse.json({
        messageId: message.id,
        originalContent: message.content,
        translatedContent: existingTranslations[targetLang],
        originalLanguage: message.originalLanguage,
        targetLanguage: targetLang,
        fromCache: true,
      });
    }

    // Detecter la langue source si non connue
    let sourceLang = message.originalLanguage as SupportedLanguage | null;
    if (!sourceLang) {
      const detection = await detectLanguage(message.content);
      sourceLang = detection.language;

      // Mettre a jour la langue originale du message
      await prisma.message.update({
        where: { id: messageId },
        data: { originalLanguage: sourceLang },
      });
    }

    // Si la langue source est la meme que la cible, pas besoin de traduire
    if (sourceLang === targetLang) {
      return NextResponse.json({
        messageId: message.id,
        originalContent: message.content,
        translatedContent: message.content,
        originalLanguage: sourceLang,
        targetLanguage: targetLang,
        fromCache: false,
        sameLanguage: true,
      });
    }

    // Traduire le message
    const result = await translateText(
      message.content,
      targetLang as SupportedLanguage,
      sourceLang
    );

    // Stocker la traduction en base de donnees
    const updatedTranslations = {
      ...existingTranslations,
      [targetLang]: result.translatedText,
    };

    await prisma.message.update({
      where: { id: messageId },
      data: { translations: updatedTranslations },
    });

    return NextResponse.json({
      messageId: message.id,
      originalContent: message.content,
      translatedContent: result.translatedText,
      originalLanguage: sourceLang,
      targetLanguage: targetLang,
      fromCache: false,
    });
  } catch (error) {
    console.error("Erreur /api/messages/[id]/translate:", error);
    return NextResponse.json(
      { error: "Erreur lors de la traduction" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/[id]/translate
 * Traduit un message et stocke la traduction
 * Body: { targetLang: string }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const body = await req.json();
    const { targetLang } = body;

    if (!targetLang || !isLanguageSupported(targetLang)) {
      return NextResponse.json(
        { error: "Langue cible invalide ou non supportee" },
        { status: 400 }
      );
    }

    // Recuperer le message avec sa conversation
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            hostId: true,
            guestId: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message introuvable" },
        { status: 404 }
      );
    }

    // Verifier que l'utilisateur fait partie de la conversation
    const userId = session.user.id;
    if (
      userId !== message.conversation.hostId &&
      userId !== message.conversation.guestId
    ) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    // Detecter la langue source si non connue
    let sourceLang = message.originalLanguage as SupportedLanguage | null;
    if (!sourceLang) {
      const detection = await detectLanguage(message.content);
      sourceLang = detection.language;
    }

    // Traduire le message
    const result = await translateText(
      message.content,
      targetLang as SupportedLanguage,
      sourceLang
    );

    // Stocker la traduction en base de donnees
    const existingTranslations = (message.translations as Record<string, string>) || {};
    const updatedTranslations = {
      ...existingTranslations,
      [targetLang]: result.translatedText,
    };

    await prisma.message.update({
      where: { id: messageId },
      data: {
        originalLanguage: sourceLang,
        translations: updatedTranslations,
      },
    });

    return NextResponse.json({
      messageId: message.id,
      originalContent: message.content,
      translatedContent: result.translatedText,
      originalLanguage: sourceLang,
      targetLanguage: targetLang,
    });
  } catch (error) {
    console.error("Erreur POST /api/messages/[id]/translate:", error);
    return NextResponse.json(
      { error: "Erreur lors de la traduction" },
      { status: 500 }
    );
  }
}
