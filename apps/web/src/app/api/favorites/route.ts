import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ favorites: [] }, { status: 200 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: { images: true, owner: { select: { id: true, email: true, name: true } } },
      },
    },
  });

  // Format simple pour le front
  const listings = favorites.map((f) => f.listing);
  return NextResponse.json({ favorites: listings });
}
