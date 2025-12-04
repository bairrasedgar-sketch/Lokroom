import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ favorites: [], total: 0 }, { status: 200 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            country: true,
            city: true,
            type: true,
            images: {
              take: 1,
              orderBy: { position: "asc" },
              select: { id: true, url: true },
            },
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.favorite.count({ where: { userId: session.user.id } }),
  ]);

  // Format simple pour le front
  const listings = favorites.map((f) => f.listing);
  return NextResponse.json({
    favorites: listings,
    page,
    pageSize,
    total,
    pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
  });
}
