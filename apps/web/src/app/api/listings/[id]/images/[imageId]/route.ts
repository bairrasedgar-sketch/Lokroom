import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // image + listing + owner check
    const img = await prisma.listingImage.findUnique({
      where: { id: params.imageId },
      include: {
        listing: {
          select: {
            id: true,
            owner: { select: { email: true } },
          },
        },
      },
    });

    if (!img || img.listing.id !== params.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (img.listing.owner.email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // (optionnel) ici tu pourrais aussi supprimer le fichier du bucket R2 si tu veux.
    await prisma.listingImage.delete({ where: { id: params.imageId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to delete listing image", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      imageId: params.imageId,
      listingId: params.id,
    });

    return NextResponse.json(
      {
        error: "IMAGE_DELETE_FAILED",
        message: "Failed to delete image. Please try again."
      },
      { status: 500 }
    );
  }
}
