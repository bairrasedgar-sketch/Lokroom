// apps/web/src/app/api/auth/mobile/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMobileAuthToken, extractBearerToken } from "@/lib/auth/jwt";
import { logger } from "@/lib/logger";


/**
 * POST /api/auth/mobile/logout
 * Déconnexion mobile (côté serveur - optionnel)
 *
 * Headers: Authorization: Bearer <token>
 * Returns: { success: true }
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
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    // Pour l'instant, on ne fait rien côté serveur
    // Le token sera supprimé côté client
    // Dans le futur, on pourrait ajouter une blacklist de tokens

    return NextResponse.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    logger.error("[Mobile Auth] Logout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}
