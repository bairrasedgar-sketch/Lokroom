/**
 * API Admin - Logs d'audit
 * GET /api/admin/logs
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("logs:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const action = searchParams.get("action") || "";
    const adminId = searchParams.get("adminId") || "";
    const entityType = searchParams.get("entityType") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Construire les filtres
    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = action as Prisma.EnumAuditActionFilter["equals"];
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (dateFrom && dateTo) {
      where.createdAt = { gte: new Date(dateFrom), lte: new Date(dateTo) };
    } else if (dateFrom) {
      where.createdAt = { gte: new Date(dateFrom) };
    } else if (dateTo) {
      where.createdAt = { lte: new Date(dateTo) };
    }

    const [logs, total, admins, actions] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
      // Liste des admins pour filtre
      prisma.auditLog.groupBy({
        by: ["adminId"],
        _count: { adminId: true },
      }),
      // Liste des actions pour filtre
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: { action: true },
      }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        admin: log.admin,
      })),
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
      filters: {
        admins: admins.map((a) => a.adminId),
        actions: actions.map((a) => a.action),
      },
    });
  } catch (error) {
    console.error("Erreur API admin logs:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
