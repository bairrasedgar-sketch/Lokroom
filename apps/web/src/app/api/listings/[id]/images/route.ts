// apps/web/src/app/api/listings/[id]/images/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { s3, S3_BUCKET, S3_PUBLIC_BASE } from "@/lib/s3";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

type ImageBody = {
  url?: string;
  width?: number;
  height?: number;
};

/**
 * POST /api/listings/:id/images
 * Enregistre une nouvelle image pour l'annonce.
 * - position = dernière position + 1
 * - si aucune image de couverture n'existe encore -> isCover = true
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 RATE LIMITING: 20 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`listing-images:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const listingId = params.id;
  const body: ImageBody = await req.json().catch(() => ({}));
  const { url, width, height } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // 🔒 Vérifie que l'URL vient bien de ton CDN / R2
  if (S3_PUBLIC_BASE) {
    const baseWithSlash = S3_PUBLIC_BASE.endsWith("/")
      ? S3_PUBLIC_BASE
      : S3_PUBLIC_BASE + "/";

    if (!url.startsWith(baseWithSlash)) {
      return NextResponse.json(
        { error: "Image URL is not allowed." },
        { status: 400 }
      );
    }
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
    orderBy: { position: "desc" },
  });

  const nextPosition = (lastImage?.position ?? -1) + 1;

  // Est-ce qu'une cover existe déjà ?
  const existingCover = await prisma.listingImage.findFirst({
    where: { listingId, isCover: true },
  });

  const image = await prisma.listingImage.create({
    data: {
      url,
      listingId,
      position: nextPosition,
      isCover: !existingCover, // si aucune cover -> la première devient couverture
      width: typeof width === "number" ? Math.round(width) : null,
      height: typeof height === "number" ? Math.round(height) : null,
    },
  });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/listings/[id]/images error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
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
  try {
    // 🔒 RATE LIMITING: 20 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`listing-images-patch:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

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

  // --- Définir l'image de couverture ---
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
        data: { isCover: false },
      }),
      prisma.listingImage.update({
        where: { id: imageId },
        data: { isCover: true, position: 0 },
      }),
      // On remet les autres positions proprement (0,1,2…)
      ...listing.images
        .filter((img) => img.id !== imageId)
        .map((img, index) =>
          prisma.listingImage.update({
            where: { id: img.id },
            data: { position: index + 1 },
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

    const queries: Prisma.PrismaPromise<unknown>[] = order.map((id, index) =>
      prisma.listingImage.update({
        where: { id },
        data: { position: index },
      })
    );

    // 👉 On force la première image de l'ordre à devenir la cover
    const firstId = order[0];
    if (firstId) {
      queries.push(
        prisma.listingImage.updateMany({
          where: { listingId: params.id },
          data: { isCover: false },
        })
      );
      queries.push(
        prisma.listingImage.update({
          where: { id: firstId },
          data: { isCover: true },
        })
      );
    }

    await prisma.$transaction(queries);

    return NextResponse.json({ ok: true });

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.error("PATCH /api/listings/[id]/images error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/:id/images?imageId=xxx
 * Supprime l'image :
 *  - en DB
 *  - et essaie aussi de supprimer l'objet dans R2 (best effort)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 RATE LIMITING: 20 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`listing-images-delete:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) {
    return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
  }

  // Récupère l'image + listing
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
    orderBy: { position: "asc" },
  });

  if (remaining.length > 0) {
    const queries: Prisma.PrismaPromise<unknown>[] = [];

    // tout le monde isCover = false puis on remet la première à true
    queries.push(
      prisma.listingImage.updateMany({
        where: { listingId: params.id },
        data: { isCover: false },
      })
    );

    remaining.forEach((img, index) => {
      queries.push(
        prisma.listingImage.update({
          where: { id: img.id },
          data: {
            position: index,
            isCover: index === 0,
          },
        })
      );
    });

    await prisma.$transaction(queries);
  }

  // 2) Tentative de suppression dans R2 (best effort)
  try {
    if (!S3_PUBLIC_BASE) {
      logger.warn(
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
        logger.warn(
          "[images DELETE] Impossible de déduire la key R2 depuis l'URL",
          { url }
        );
      }
    }
  } catch (err) {
    logger.error("[images DELETE] Erreur suppression R2", err);
  }

  return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("DELETE /api/listings/[id]/images error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
