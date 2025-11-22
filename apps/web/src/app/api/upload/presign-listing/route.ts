import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import mime from "mime";
import { s3, S3_BUCKET, S3_PUBLIC_BASE } from "@/lib/s3";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 Mo

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { listingId?: string; filename?: string; contentType?: string; fileSize?: number }
    | null;

  const listingId = body?.listingId;
  const filename = body?.filename;
  const contentType = body?.contentType;
  const fileSize = body?.fileSize;

  if (!listingId || !filename) {
    return NextResponse.json(
      { error: "Missing listingId or filename" },
      { status: 400 }
    );
  }

  // Optionnel mais utile : limite taille côté backend aussi
  if (typeof fileSize === "number" && fileSize > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File too large (max ${(MAX_SIZE_BYTES / (1024 * 1024)).toFixed(
          1
        )} MB)`,
      },
      { status: 400 }
    );
  }

  // Vérifie propriétaire
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

  const type = mime.getType(filename) || contentType || "application/octet-stream";

  // On force images uniquement
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  // Tu peux un jour limiter plus finement :
  // const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  // if (!ALLOWED.includes(type)) { ... }

  const ext = mime.getExtension(type) || "bin";
  const key = `listings/${listingId}/${nanoid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: type,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
  const publicUrl = `${S3_PUBLIC_BASE}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
