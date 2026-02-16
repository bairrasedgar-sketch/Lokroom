/**
 * API Admin - Gestion des backups de base de données
 * GET /api/admin/backups - Liste des backups
 * POST /api/admin/backups - Déclencher un backup manuel
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const execAsync = promisify(exec);

/**
 * GET - Liste des backups avec pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 RATE LIMITING: 30 req/min pour admin
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`admin-backups:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const auth = await requireAdminPermission("backups:view");
    if ("error" in auth) return auth.error;
    const { searchParams } = new URL(request.url);
    // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
    const page = parsePageParam(searchParams.get("page"));
    const limit = parseLimitParam(searchParams.get("limit"), 20, 100);
    const type = searchParams.get("type") as "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL" | null;
    const status = searchParams.get("status") as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "DELETED" | null;

    const skip = (page - 1) * limit;

    // 🔒 SÉCURITÉ : Type sécurisé pour les filtres Prisma
    type BackupWhereInput = {
      type?: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
      status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "DELETED";
    };

    const where: BackupWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [backups, total] = await Promise.all([
      prisma.databaseBackup.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.databaseBackup.count({ where }),
    ]);

    // Statistiques
    const stats = await prisma.databaseBackup.groupBy({
      by: ["status"],
      _count: true,
    });

    const totalSize = await prisma.databaseBackup.aggregate({
      where: { status: "COMPLETED" },
      _sum: { fileSize: true },
    });

    const lastBackup = await prisma.databaseBackup.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      backups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: stats.reduce((acc: any, item: any) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        totalSize: totalSize._sum.fileSize || 0,
        lastBackup: lastBackup ? {
          id: lastBackup.id,
          createdAt: lastBackup.createdAt,
          type: lastBackup.type,
          fileSize: lastBackup.fileSize,
        } : null,
      },
    });
  } catch (error) {
    logger.error("GET /api/admin/backups error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST - Déclencher un backup manuel
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 RATE LIMITING: 5 req/min pour backup manuel
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`admin-backups-create:${ip}`, 5, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const auth = await requireAdminPermission("backups:create");
    if ("error" in auth) return auth.error;
    // Vérifier qu'il n'y a pas déjà un backup en cours
    const inProgressBackup = await prisma.databaseBackup.findFirst({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (inProgressBackup) {
      return NextResponse.json(
        { error: "A backup is already in progress" },
        { status: 409 }
      );
    }

    // Créer un enregistrement de backup en attente
    const backup = await prisma.databaseBackup.create({
      data: {
        filename: `manual-backup-${Date.now()}.sql.gz`,
        fileUrl: "",
        fileSize: 0,
        type: "MANUAL",
        status: "PENDING",
        startedAt: new Date(),
      },
    });

    // Déclencher le script de backup en arrière-plan
    // Note: En production, cela devrait être fait via un job queue (Bull, BullMQ, etc.)
    const scriptPath = process.platform === "win32"
      ? "scripts\\backup-database.ts"
      : "scripts/backup-database.ts";

    execAsync(`npx tsx ${scriptPath}`)
      .then(() => {
        logger.debug("Manual backup completed successfully");
      })
      .catch((error) => {
        logger.error("Manual backup failed:", error);
      });

    return NextResponse.json({
      message: "Backup started",
      backup: {
        id: backup.id,
        status: backup.status,
        startedAt: backup.startedAt,
      },
    });
  } catch (error) {
    logger.error("POST /api/admin/backups error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
