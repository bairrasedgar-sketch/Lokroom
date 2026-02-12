export const dynamic = "force-dynamic";

// apps/web/src/app/api/auth/mobile/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyMobileAuthToken, extractBearerToken } from "@/lib/auth/jwt";
import { logger } from "@/lib/logger";


/**
 * GET /api/auth/mobile/me
 * Récupère les informations de l'utilisateur connecté
 *
 * Headers: Authorization: Bearer <token>
 * Returns: { user: {...} }
 */
export async function GET(req: NextRequest) {
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
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            phone: true,
            birthDate: true,
            addressLine1: true,
            city: true,
            country: true,
            postalCode: true,
          },
        },
        hostProfile: {
          select: {
            payoutsEnabled: true,
          },
        },
        _count: {
          select: {
            Listing: true,
            bookings: true,
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

    // Calculer isHost
    const isHost =
      user.role === "HOST" ||
      user.role === "BOTH" ||
      !!user.hostProfile?.payoutsEnabled ||
      user._count.Listing > 0;

    // Retourner les infos utilisateur
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || null,
        image: user.profile?.avatarUrl || null,
        role: user.role,
        isHost,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        profile: user.profile,
        stats: {
          listings: user._count.Listing,
          bookings: user._count.bookings,
        },
      },
    });
  } catch (error) {
    logger.error("[Mobile Auth] Me error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
