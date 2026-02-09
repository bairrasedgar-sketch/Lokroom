// apps/web/src/app/api/auth/mobile/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMobileAuthToken, generateMobileAuthToken, extractBearerToken } from "@/lib/auth/jwt";

/**
 * POST /api/auth/mobile/refresh
 * Rafraîchit le token JWT mobile
 *
 * Headers: Authorization: Bearer <token>
 * Returns: { token: string, user: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    // Extraire le token
    const authHeader = req.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Vérifier le token
    const payload = await verifyMobileAuthToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Générer un nouveau token
    const newToken = await generateMobileAuthToken(
      user.id,
      user.email,
      user.role
    );

    // Retourner le nouveau token
    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || null,
        image: user.profile?.avatarUrl || null,
        role: user.role,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
      },
    });
  } catch (error) {
    console.error("[Mobile Auth] Refresh error:", error);
    return NextResponse.json(
      { error: "Erreur lors du rafraîchissement" },
      { status: 500 }
    );
  }
}
