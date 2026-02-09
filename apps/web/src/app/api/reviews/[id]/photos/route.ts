// apps/web/src/app/api/reviews/[id]/photos/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  s3,
  S3_BUCKET,
  S3_PUBLIC_BASE,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/s3";

const MAX_PHOTOS_PER_REVIEW = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB par photo

const uploadPhotoSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
  caption: z.string().max(200).optional(),
});

function extFromMime(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function sanitizeFilename(name: string): string {
  const base = name.split("/").pop() ?? name;
  const withoutExt = base.replace(/\.[^.]+$/, "");
  const slug = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);

  return slug || "photo";
}

/**
 * POST /api/reviews/:id/photos
 * Génère une URL signée pour uploader une photo de review
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const reviewId = params.id;

  // Vérifier que le review existe et appartient à l'utilisateur
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      photos: true,
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (review.authorId !== me.id) {
    return NextResponse.json(
      { error: "Forbidden: not review author" },
      { status: 403 }
    );
  }

  // Vérifier le nombre de photos existantes
  if (review.photos.length >= MAX_PHOTOS_PER_REVIEW) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS_PER_REVIEW} photos per review` },
      { status: 400 }
    );
  }

  // Valider le body
  const json = await req.json().catch(() => null);
  const parsed = uploadPhotoSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { filename, contentType, fileSize, caption } = parsed.data;

  // Vérifier le type MIME
  const normalizedType =
    contentType === "image/jpg" ? "image/jpeg" : contentType;

  if (!ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
    return NextResponse.json(
      { error: "Type d'image non autorisé (jpeg, png, webp uniquement)" },
      { status: 400 }
    );
  }

  // Vérifier la taille
  if (typeof fileSize === "number" && fileSize > MAX_PHOTO_SIZE) {
    return NextResponse.json(
      { error: `Photo trop lourde (max ${MAX_PHOTO_SIZE / (1024 * 1024)} Mo)` },
      { status: 413 }
    );
  }

  // Générer la key S3
  const ext = extFromMime(normalizedType);
  const safeBase = sanitizeFilename(filename);
  const key = `reviews/${reviewId}/${safeBase}-${randomUUID()}.${ext}`;

  // Générer l'URL signée
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: normalizedType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 10, // 10 minutes
  });

  const base = S3_PUBLIC_BASE?.replace(/\/$/, "") ?? "";
  const publicUrl = `${base}/${key}`;

  // Créer l'enregistrement de la photo
  const photo = await prisma.reviewPhoto.create({
    data: {
      reviewId,
      url: publicUrl,
      caption: caption || null,
      position: review.photos.length,
    },
  });

  return NextResponse.json(
    {
      uploadUrl,
      publicUrl,
      photo,
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/reviews/:id/photos?photoId=xxx
 * Supprime une photo de review
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) {
    return NextResponse.json({ error: "Missing photoId" }, { status: 400 });
  }

  // Récupérer la photo
  const photo = await prisma.reviewPhoto.findUnique({
    where: { id: photoId },
    include: {
      review: true,
    },
  });

  if (!photo || photo.reviewId !== params.id) {
    return NextResponse.json(
      { error: "Photo not found for review" },
      { status: 404 }
    );
  }

  if (photo.review.authorId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Supprimer la photo en DB
  await prisma.reviewPhoto.delete({ where: { id: photoId } });

  // Renumeroter les positions restantes
  const remaining = await prisma.reviewPhoto.findMany({
    where: { reviewId: params.id },
    orderBy: { position: "asc" },
  });

  if (remaining.length > 0) {
    await prisma.$transaction(
      remaining.map((p, index) =>
        prisma.reviewPhoto.update({
          where: { id: p.id },
          data: { position: index },
        })
      )
    );
  }

  // Tentative de suppression dans S3 (best effort)
  try {
    if (S3_PUBLIC_BASE) {
      const url = photo.url;
      const baseWithSlash = S3_PUBLIC_BASE.endsWith("/")
        ? S3_PUBLIC_BASE
        : S3_PUBLIC_BASE + "/";

      let key: string | null = null;
      if (url.startsWith(baseWithSlash)) {
        key = url.slice(baseWithSlash.length);
      }

      if (key) {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        await s3.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
          })
        );
      }
    }
  } catch (err) {
    console.error("[review photos DELETE] Erreur suppression S3:", err);
  }

  return new NextResponse(null, { status: 204 });
}
