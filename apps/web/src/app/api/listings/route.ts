import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          select: { id: true, url: true },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const data = listings.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      price: l.price,
      currency: l.currency,
      country: l.country,
      province: l.province,
      city: l.city,
      createdAt: l.createdAt,
      images: l.images,
      owner: l.owner,
      isFavorite: false,
    }));

    return NextResponse.json({ listings: data });
  } catch (err) {
    console.error("Error in GET /api/listings", err);

    // 🔍 TEMPORAIRE: on expose le détail pour debug
    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown error");

    return NextResponse.json(
      {
        error: "Internal server error",
        detail: message,
      },
      { status: 500 },
    );
  }
}
