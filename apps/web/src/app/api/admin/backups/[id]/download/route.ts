/**
 * API Admin - Téléchargement d'un backup
 * GET /api/admin/backups/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission("backups:download");
  if ("error" in auth) return auth.error;

  try {
    const backupId = params.id;

    // Récupérer le backup
    const backup = await prisma.databaseBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    if (backup.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Cannot download backup with status: ${backup.status}` },
        { status: 400 }
      );
    }

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        adminId: auth.session.userId,
        action: "USER_UPDATED",
        entityType: "DatabaseBackup",
        entityId: backupId,
        details: {
          backupFilename: backup.filename,
          downloadedAt: new Date().toISOString(),
          operation: "BACKUP_DOWNLOADED",
        },
      },
    });

    // Générer une URL signée pour le téléchargement (valide 1 heure)
    const s3Config: any = {
      region: process.env.AWS_REGION || "auto",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    };

    if (process.env.AWS_S3_ENDPOINT) {
      s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
    }

    const s3 = new S3Client(s3Config);
    const bucket = process.env.AWS_BACKUP_BUCKET || process.env.AWS_S3_BUCKET || "";
    const key = `backups/${backup.filename}`;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      downloadUrl: signedUrl,
      filename: backup.filename,
      fileSize: backup.fileSize,
      expiresIn: 3600, // 1 heure
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
