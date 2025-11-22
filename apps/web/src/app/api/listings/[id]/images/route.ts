import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { s3, S3_BUCKET, S3_PUBLIC_BASE } from "@/lib/s3";

/**
 * POST /api/listings/:id/images
 * Enregistre une nouvelle image pour l’annonce.
 * - position = dernière position + 1
 * - si aucune image de couverture n’existe encore -> isCover = true
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = params.id;
  const { url } = (await req.json().catch(() => ({} as any))) as {
    url?: string;
  };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { owner: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Dernière position actuelle
  const lastImage = await prisma.listingImage.findFirst({
    where: { listingId },
    orderBy: { position: "desc" } as any,
  });

  const lastImageAny = lastImage as any;
  const nextPosition = (lastImageAny?.position ?? -1) + 1;

  // Est-ce qu’une cover existe déjà ?
  const existingCover = await prisma.listingImage.findFirst({
    where: { listingId, isCover: true } as any,
  });

  const image = await prisma.listingImage.create({
    data: {
      url,
      listingId,
      position: nextPosition,
      isCover: !existingCover, // si aucune cover -> la première devient couverture
    } as any,
  });

  return NextResponse.json({ image }, { status: 201 });
}

/**
 * PATCH /api/listings/:id/images
 *
 * Body:
 *  - { action: "setCover", imageId }
 *  - { action: "reorder", order: [imageId1, imageId2, ...] }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { action?: string; imageId?: string; order?: string[] }
    | null;

  if (!body?.action) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      images: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Définir l’image de couverture ---
  if (body.action === "setCover") {
    const imageId = body.imageId;
    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    const target = listing.images.find((img) => img.id === imageId);
    if (!target) {
      return NextResponse.json(
        { error: "Image does not belong to this listing" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.listingImage.updateMany({
        where: { listingId: params.id },
        data: { isCover: false } as any,
      }),
      prisma.listingImage.update({
        where: { id: imageId },
        data: { isCover: true, position: 0 } as any,
      }),
      // On remet les autres positions proprement (0,1,2…)
      ...listing.images
        .filter((img) => img.id !== imageId)
        .map((img, index) =>
          prisma.listingImage.update({
            where: { id: img.id },
            data: { position: index + 1 } as any,
          })
        ),
    ]);

    return NextResponse.json({ ok: true });
  }

  // --- Réordonner les images ---
  if (body.action === "reorder") {
    const order = body.order;
    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      return NextResponse.json(
        { error: "Invalid order payload" },
        { status: 400 }
      );
    }

    const listingImageIds = new Set(listing.images.map((img) => img.id));
    const orderSet = new Set(order);

    // On exige que l'ordre contienne exactement les mêmes ids que la BDD
    if (
      order.length !== listing.images.length ||
      [...orderSet].some((id) => !listingImageIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Order must include all listing images once" },
        { status: 400 }
      );
    }

    const queries: any[] = order.map((id, index) =>
      prisma.listingImage.update({
        where: { id },
        data: { position: index } as any,
      })
    );

    // 👉 On force la première image de l’ordre à devenir la cover
    const firstId = order[0];
    if (firstId) {
      queries.push(
        prisma.listingImage.updateMany({
          where: { listingId: params.id },
          data: { isCover: false } as any,
        })
      );
      queries.push(
        prisma.listingImage.update({
          where: { id: firstId },
          data: { isCover: true } as any,
        })
      );
    }

    await prisma.$transaction(queries);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/**
 * DELETE /api/listings/:id/images?imageId=xxx
 * Supprime l’image :
 *  - en DB
 *  - et essaie aussi de supprimer l’objet dans R2 (best effort)
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
    return NextResponse.json(
      { error: "Image not found for listing" },
      { status: 404 }
    );
  }
  if (image.listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1) Suppression en DB
  await prisma.listingImage.delete({ where: { id: imageId } });

  // 1.bis) On renumérote les positions restantes et on garantit une cover
  const remaining = await prisma.listingImage.findMany({
    where: { listingId: params.id },
    orderBy: { position: "asc" } as any,
  });

  if (remaining.length > 0) {
    const queries: any[] = [];

    // tout le monde isCover = false puis on remet la première à true
    queries.push(
      prisma.listingImage.updateMany({
        where: { listingId: params.id },
        data: { isCover: false } as any,
      })
    );

    remaining.forEach((img, index) => {
      queries.push(
        prisma.listingImage.update({
          where: { id: img.id },
          data: {
            position: index,
            isCover: index === 0,
          } as any,
        })
      );
    });

    await prisma.$transaction(queries);
  }

  // 2) Tentative de suppression dans R2 (best effort)
  try {
    if (!S3_PUBLIC_BASE) {
      console.warn(
        "[images DELETE] S3_PUBLIC_BASE non défini, suppression R2 ignorée."
      );
    } else {
      const url = image.url;
      const baseWithSlash = S3_PUBLIC_BASE.endsWith("/")
        ? S3_PUBLIC_BASE
        : S3_PUBLIC_BASE + "/";

      let key: string | null = null;
      if (url.startsWith(baseWithSlash)) {
        key = url.slice(baseWithSlash.length);
      }

      if (key) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
          })
        );
      } else {
        console.warn(
          "[images DELETE] Impossible de déduire la key R2 depuis l’URL :",
          url
        );
      }
    }
  } catch (err) {
    console.error("[images DELETE] Erreur suppression R2:", err);
  }

  return new NextResponse(null, { status: 204 });
}
