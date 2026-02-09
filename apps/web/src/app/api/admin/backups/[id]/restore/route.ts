/**
 * API Admin - Restauration d'un backup spécifique
 * POST /api/admin/backups/[id]/restore
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminPermission("backups:restore");
  if ("error" in auth) return auth.error;

  try {
    const backupId = params.id;

    // Vérifier que le backup existe et est complété
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
        { error: `Cannot restore backup with status: ${backup.status}` },
        { status: 400 }
      );
    }

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.id,
        action: "DATABASE_RESTORE_INITIATED",
        entityType: "DatabaseBackup",
        entityId: backupId,
        details: {
          backupFilename: backup.filename,
          backupCreatedAt: backup.createdAt,
          initiatedAt: new Date().toISOString(),
        },
      },
    });

    // Déclencher le script de restauration en arrière-plan
    const scriptPath = process.platform === "win32"
      ? "scripts\\restore-database.ts"
      : "scripts/restore-database.ts";

    execAsync(`npx tsx ${scriptPath} ${backupId} ${auth.user.id}`)
      .then(() => {
        console.log("Database restore completed successfully");
      })
      .catch((error) => {
        console.error("Database restore failed:", error);
      });

    return NextResponse.json({
      message: "Database restore initiated",
      backup: {
        id: backup.id,
        filename: backup.filename,
        createdAt: backup.createdAt,
        fileSize: backup.fileSize,
      },
      warning: "This operation will overwrite the current database. The restore process has been started in the background.",
    });
  } catch (error) {
    console.error("Error initiating restore:", error);
    return NextResponse.json(
      { error: "Failed to initiate restore" },
      { status: 500 }
    );
  }
}
