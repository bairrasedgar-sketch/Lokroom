import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { select: { id: true, url: true } },
        owner: { select: { id: true, name: true, email: true } },
        favorites: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : undefined,
      },
    });

    const data = listings.map((l: any) => ({
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
      isFavorite: userId ? l.favorites?.length > 0 : false,
    }));

    return NextResponse.json({ listings: data });
  } catch (err) {
    console.error("Error in GET /api/listings", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
