import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/wishlists/[id] - Récupérer une wishlist avec toutes ses annonces
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      favorites: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              price: true,
              currency: true,
              images: { take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
  }

  return NextResponse.json(wishlist);
}

// PATCH /api/wishlists/[id] - Renommer une wishlist
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  // Vérifier que la wishlist appartient à l'utilisateur
  const existing = await prisma.wishlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
  }

  const wishlist = await prisma.wishlist.update({
    where: { id: params.id },
    data: { name: name.trim() },
  });

  return NextResponse.json(wishlist);
}

// DELETE /api/wishlists/[id] - Supprimer une wishlist
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que la wishlist appartient à l'utilisateur
  const existing = await prisma.wishlist.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
  }

  // Supprimer d'abord les favoris associés
  await prisma.favorite.deleteMany({
    where: { wishlistId: params.id },
  });

  // Puis supprimer la wishlist
  await prisma.wishlist.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
