/**
 * API Admin - Suppression d'un backup
 * DELETE /api/admin/backups/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission("backups:delete");
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

    if (backup.status === "DELETED") {
      return NextResponse.json(
        { error: "Backup already deleted" },
        { status: 400 }
      );
    }

    // Supprimer de S3
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

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } catch (s3Error) {
      logger.error("Error deleting from S3:", s3Error);
      // Continuer même si la suppression S3 échoue
    }

    // Marquer comme supprimé dans la DB
    await prisma.databaseBackup.update({
      where: { id: backupId },
      data: { status: "DELETED" },
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        adminId: auth.session.user.id,
        action: "USER_DELETED",
        entityType: "DatabaseBackup",
        entityId: backupId,
        details: {
          backupFilename: backup.filename,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Backup deleted successfully",
      backup: {
        id: backup.id,
        filename: backup.filename,
      },
    });
  } catch (error) {
    logger.error("Error deleting backup:", error);
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    );
  }
}
