import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLanguageSupported } from "@/lib/translation";

export const dynamic = "force-dynamic";

/**
 * GET /api/account/preferences/translation
 * Recupere les preferences de traduction de l'utilisateur
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        preferredLanguage: true,
        autoTranslate: true,
      },
    });

    // Si pas de profil, retourner les valeurs par defaut
    if (!profile) {
      return NextResponse.json({
        preferredLanguage: "fr",
        autoTranslate: true,
      });
    }

    return NextResponse.json({
      preferredLanguage: profile.preferredLanguage,
      autoTranslate: profile.autoTranslate,
    });
  } catch (error) {
    console.error("Erreur GET /api/account/preferences/translation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/account/preferences/translation
 * Met a jour les preferences de traduction de l'utilisateur
 * Body: { preferredLanguage?: string, autoTranslate?: boolean }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const { preferredLanguage, autoTranslate } = body;

    // Validation
    if (preferredLanguage !== undefined && !isLanguageSupported(preferredLanguage)) {
      return NextResponse.json(
        { error: "Langue preferee non supportee" },
        { status: 400 }
      );
    }

    if (autoTranslate !== undefined && typeof autoTranslate !== "boolean") {
      return NextResponse.json(
        { error: "autoTranslate doit etre un booleen" },
        { status: 400 }
      );
    }

    // Preparer les donnees a mettre a jour
    const updateData: { preferredLanguage?: string; autoTranslate?: boolean } = {};
    if (preferredLanguage !== undefined) {
      updateData.preferredLanguage = preferredLanguage;
    }
    if (autoTranslate !== undefined) {
      updateData.autoTranslate = autoTranslate;
    }

    // Mettre a jour ou creer le profil
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        preferredLanguage: preferredLanguage || "fr",
        autoTranslate: autoTranslate ?? true,
      },
      select: {
        preferredLanguage: true,
        autoTranslate: true,
      },
    });

    return NextResponse.json({
      preferredLanguage: profile.preferredLanguage,
      autoTranslate: profile.autoTranslate,
      message: "Preferences mises a jour avec succes",
    });
  } catch (error) {
    console.error("Erreur PUT /api/account/preferences/translation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour des preferences" },
      { status: 500 }
    );
  }
}
