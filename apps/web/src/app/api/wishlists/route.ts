import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/wishlists - Récupérer toutes les listes de favoris de l'utilisateur
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    include: {
      favorites: {
        include: {
          listing: {
            select: {
              id: true,
              images: { take: 1, select: { url: true } },
            },
          },
        },
        take: 4, // Pour les previews
      },
      _count: {
        select: { favorites: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(wishlists);
}

// POST /api/wishlists - Créer une nouvelle liste de favoris
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const wishlist = await prisma.wishlist.create({
    data: {
      name: name.trim(),
      userId: session.user.id,
    },
  });

  return NextResponse.json(wishlist, { status: 201 });
}
