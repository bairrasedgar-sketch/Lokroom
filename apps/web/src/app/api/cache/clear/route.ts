// apps/web/src/app/api/cache/clear/route.ts

/**
 * API pour vider le cache Redis.
 * À utiliser avec précaution, réservé aux admins.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cache, invalidateAllCache } from "@/lib/redis/cache-safe";

export const dynamic = "force-dynamic";

/**
 * POST /api/cache/clear
 * Vide tout le cache ou un pattern spécifique.
 * Body: { pattern?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Vérifier que l'utilisateur est admin
    // Pour l'instant, on autorise tous les utilisateurs authentifiés

    const body = await req.json().catch(() => ({}));
    const pattern = body.pattern;

    if (pattern) {
      // Vider un pattern spécifique
      await cache.delPattern(pattern);
      return NextResponse.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
      });
    } else {
      // Vider tout le cache
      await invalidateAllCache();
      return NextResponse.json({
        success: true,
        message: "All cache cleared",
      });
    }
  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
