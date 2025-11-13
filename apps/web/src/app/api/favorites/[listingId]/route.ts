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

// Ajouter en favoris
export async function POST(
  _req: Request,
  { params }: { params: { listingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // vérifie que l'annonce existe
  const listing = await prisma.listing.findUnique({ where: { id: params.listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const fav = await prisma.favorite.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: params.listingId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      listingId: params.listingId,
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
