// apps/web/src/app/api/auth/password/route.ts
// API pour la création et modification du mot de passe

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePassword, hashPassword, verifyPassword } from "@/lib/password";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

/**
 * POST /api/auth/password
 * Créer ou modifier le mot de passe de l'utilisateur connecté
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { password, currentPassword } = body;

    if (!password) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }

    // Validation du nouveau mot de passe
    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json({
        error: "Mot de passe invalide",
        details: validation.errors,
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Si l'utilisateur a déjà un mot de passe, vérifier l'ancien
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({
          error: "Le mot de passe actuel est requis pour le modifier",
          code: "CURRENT_PASSWORD_REQUIRED",
        }, { status: 400 });
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({
          error: "Le mot de passe actuel est incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        }, { status: 400 });
      }
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: user.passwordHash
        ? "Mot de passe modifié avec succès"
        : "Mot de passe créé avec succès",
    });
  } catch (error) {
    logger.error("POST /api/auth/password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
