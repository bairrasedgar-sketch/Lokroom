import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = params.id;
  const { url } = await req.json().catch(() => ({} as any));

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { owner: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const image = await prisma.listingImage.create({
    data: { url, listingId },
  });

  return NextResponse.json({ image }, { status: 201 });
}

/**
 * DELETE /api/listings/:id/images?imageId=xxx
 * Supprime l’image (en DB) si elle appartient bien à cette annonce et à l’utilisateur.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) {
    return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
  }

  // Récupère l’image + listing
  const image = await prisma.listingImage.findUnique({
    where: { id: imageId },
    include: { listing: { include: { owner: true } } },
  });

  if (!image || image.listingId !== params.id) {
    return NextResponse.json({ error: "Image not found for listing" }, { status: 404 });
  }
  if (image.listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.listingImage.delete({ where: { id: imageId } });

  // 204 : no content
  return new NextResponse(null, { status: 204 });
}
