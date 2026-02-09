// apps/web/src/app/api/cache/stats/route.ts

/**
 * API pour récupérer les statistiques du cache Redis.
 * Utile pour le monitoring et le debugging.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cache } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/cache/stats
 * Récupère les statistiques du cache Redis.
 * Nécessite d'être authentifié (admin recommandé).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await cache.getStats();

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cache Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to get cache stats" },
      { status: 500 }
    );
  }
}
