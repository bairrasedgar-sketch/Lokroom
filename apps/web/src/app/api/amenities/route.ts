import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cache, CacheKeys, CacheTTL } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/amenities
 * Récupère la liste complète des amenities par catégorie
 */
export async function GET() {
  try {
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
    console.error("GET /api/amenities error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
