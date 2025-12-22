import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Vérifier si l'annonce est déjà en favoris
export async function GET(
  _req: Request,
  { params }: { params: { listingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, favorited: false }, { status: 200 });
  }
  const fav = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id!, // si tu stockes l'id dans la session
        listingId: params.listingId,
      },
    },
  }).catch(() => null);

  return NextResponse.json({ ok: true, favorited: !!fav });
}

// Ajouter en favoris (optionnellement dans une wishlist)
export async function POST(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier le rôle de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Seuls GUEST, BOTH et ADMIN peuvent ajouter aux favoris
  // HOST pur ne peut pas (il est hôte uniquement, pas voyageur)
  if (user?.role === "HOST") {
    return NextResponse.json(
      { error: "Les hôtes ne peuvent pas ajouter aux favoris. Active le mode voyageur pour ajouter des favoris." },
      { status: 403 }
    );
  }

  // vérifie que l'annonce existe
  const listing = await prisma.listing.findUnique({ where: { id: params.listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Récupérer le wishlistId optionnel du body
  let wishlistId: string | null = null;
  try {
    const body = await req.json();
    wishlistId = body.wishlistId || null;
  } catch {
    // Pas de body JSON, c'est OK
  }

  // Si wishlistId fourni, vérifier qu'il appartient à l'utilisateur
  if (wishlistId) {
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, userId: session.user.id },
    });
    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }
  }

  const fav = await prisma.favorite.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: params.listingId,
      },
    },
    update: { wishlistId },
    create: {
      userId: session.user.id,
      listingId: params.listingId,
      wishlistId,
    },
  });

  return NextResponse.json({ ok: true, favorite: fav }, { status: 201 });
}

// Retirer des favoris
export async function DELETE(
  _req: Request,
  { params }: { params: { listingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.favorite.delete({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: params.listingId,
      },
    },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
