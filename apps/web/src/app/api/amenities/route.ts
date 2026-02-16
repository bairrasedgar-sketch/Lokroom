import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cache, CacheKeys, CacheTTL } from "@/lib/redis/cache-safe";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/amenities
 * Récupère la liste complète des amenities par catégorie
 */
export async function GET(req: Request) {
  try {
    // 🔒 RATE LIMITING: 60 req/min (route publique avec cache)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`amenities:${ip}`, 60, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Essayer de récupérer depuis le cache
    const cached = await cache.get(
      CacheKeys.amenities(),
      async () => {
        // Fallback: récupérer depuis la DB
        const amenities = await prisma.amenity.findMany({
          orderBy: [
            { category: "asc" },
            { label: "asc" },
          ],
        });

        // Grouper par catégorie
        const grouped = amenities.reduce((acc, amenity) => {
          const category = amenity.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(amenity);
          return acc;
        }, {} as Record<string, typeof amenities>);

        return {
          amenities,
          grouped,
        };
      },
      CacheTTL.VERY_LONG // Les amenities changent rarement
    );

    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800",
      },
    });
  } catch (err) {
    logger.error("GET /api/amenities error", { error: err });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
