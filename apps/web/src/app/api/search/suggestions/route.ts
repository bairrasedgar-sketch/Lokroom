import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/search/suggestions
 * Suggestions de villes populaires et recherches tendances
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const query = params.get("q") || "";
    const type = params.get("type") || "all"; // cities, listings, all

    const suggestions: {
      cities?: Array<{ name: string; country: string; count: number }>;
      listings?: Array<{ id: string; title: string; city: string; type: string }>;
    } = {};

    // Suggestions de villes
    if (type === "cities" || type === "all") {
      const cities = await prisma.listing.groupBy({
        by: ["city", "country"],
        where: {
          isActive: true,
          city: query
            ? { contains: query, mode: "insensitive" }
            : { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 5,
      });

      suggestions.cities = cities
        .filter((c) => c.city)
        .map((c) => ({
          name: c.city!,
          country: c.country,
          count: c._count.id,
        }));
    }

    // Suggestions d'annonces
    if (type === "listings" || type === "all") {
      if (query.length >= 2) {
        const listings = await prisma.listing.findMany({
          where: {
            isActive: true,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            city: true,
            type: true,
          },
          orderBy: [{ rating: "desc" }, { viewCount: "desc" }],
          take: 5,
        });

        suggestions.listings = listings;
      }
    }

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("GET /api/search/suggestions error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
