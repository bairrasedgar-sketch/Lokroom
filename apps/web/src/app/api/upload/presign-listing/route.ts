import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import {
  s3,
  S3_BUCKET,
  S3_PUBLIC_BASE,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/s3";

const bodySchema = z.object({
  listingId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
});

function extFromMime(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  // fallback si jamais
  return "bin";
}

// petit helper pour avoir un morceau de nom de fichier “propre”
function sanitizeFilename(name: string): string {
  const base = name.split("/").pop() ?? name;
  const withoutExt = base.replace(/\.[^.]+$/, "");
  const slug = withoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);

  return slug || "image";
}

export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMITING: 20 req/min pour presigned URLs
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`presign-upload:${ip}`, 20, 60_000);

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

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      logger.error("[presign-listing] invalid body:", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

      const { listingId, filename, contentType, fileSize } = parsed.data;

    // 1) Vérifier que l'annonce existe et appartient bien au user
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

    // 2) Vérifier le type MIME (sécurité backend)
    const normalizedType =
      contentType === "image/jpg" ? "image/jpeg" : contentType;

    if (!ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        {
          error: "Type d'image non autorisé (jpeg, png, webp uniquement).",
        },
        { status: 400 }
      );
    }

    // 3) Vérifier la taille max côté backend si fournie
    if (typeof fileSize === "number" && fileSize > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Image trop lourde (max ${(MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(
            1
          )} Mo).`,
        },
        { status: 413 }
      );
    }

    // 4) Générer une key propre (on utilise filename ici → plus de warning ESLint)
    const ext = extFromMime(normalizedType);
    const safeBase = sanitizeFilename(filename);
    const key = `listings/${listingId}/${safeBase}-${randomUUID()}.${ext}`;

    // 5) Générer l'URL signée pour upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: normalizedType,
      // bon cache pour les images (1 an, immutable)
      CacheControl: "public, max-age=31536000, immutable",
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 60 * 10, // 10 minutes
    });

    const base = S3_PUBLIC_BASE?.replace(/\/$/, "") ?? "";
    const publicUrl = `${base}/${key}`;

    return NextResponse.json(
      {
        uploadUrl,
        publicUrl,
        key, // dispo si plus tard on veut le stocker en BDD
        contentType: normalizedType,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("POST /api/upload/presign-listing error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
