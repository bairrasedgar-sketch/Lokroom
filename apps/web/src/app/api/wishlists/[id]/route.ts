import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/wishlists/[id] - Récupérer une liste avec ses favoris
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, userId: session.user.id },
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
              images: { take: 1, select: { id: true, url: true } },
            },
          },
        },
      },
      _count: {
        select: { favorites: true },
      },
    },
  });

  if (!wishlist) {
    return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
  }

  return NextResponse.json(wishlist);
}

// PATCH /api/wishlists/[id] - Modifier le nom d'une liste
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  // Vérifier que la liste appartient à l'utilisateur
  const existing = await prisma.wishlist.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
  }

  const wishlist = await prisma.wishlist.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json(wishlist);
}

// DELETE /api/wishlists/[id] - Supprimer une liste
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Vérifier que la liste appartient à l'utilisateur
  const existing = await prisma.wishlist.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
  }

  // Supprimer la liste (les favoris seront supprimés en cascade)
  await prisma.wishlist.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
