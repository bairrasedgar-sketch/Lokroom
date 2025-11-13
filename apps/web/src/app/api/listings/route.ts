import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: { select: { id: true, url: true } },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ listings });
  } catch (error: unknown) {
    console.error("Error in GET /api/listings", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
