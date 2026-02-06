import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/amenities
 * Récupère la liste complète des amenities par catégorie
 */
export async function GET() {
  try {
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

    return NextResponse.json({
      amenities,
      grouped,
    });
  } catch (err) {
    console.error("GET /api/amenities error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
