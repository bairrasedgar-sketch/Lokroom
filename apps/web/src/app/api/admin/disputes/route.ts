/**
 * API Admin - Liste des litiges
 * GET /api/admin/disputes
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam, parsePriorityParam } from "@/lib/validation/params";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("disputes:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
    const page = parsePageParam(searchParams.get("page"));
    const pageSize = parseLimitParam(searchParams.get("pageSize"), 20, 100);
    const status = searchParams.get("status") || "";
    const priorityParam = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    // Construire les filtres
    const where: Prisma.DisputeWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumDisputeStatusFilter["equals"];
    }

    if (priorityParam) {
      // 🔒 SÉCURITÉ : Validation sécurisée du paramètre priority
      where.priority = parsePriorityParam(priorityParam);
    }

    if (assignedToMe) {
      where.assignedAdminId = auth.session.user.id;
    }

    // Stats par statut
    const [statusStats, priorityStats, total, disputes] = await Promise.all([
      prisma.dispute.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.dispute.groupBy({
        by: ["priority"],
        _count: { priority: true },
        where: {
          status: { in: ["OPEN", "UNDER_REVIEW", "AWAITING_HOST", "AWAITING_GUEST"] },
        },
      }),
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
        select: {
          id: true,
          reason: true,
          status: true,
          priority: true,
          description: true,
          claimedAmountCents: true,
          awardedAmountCents: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          openedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          User_Dispute_againstIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedAdmin: {
            select: {
              id: true,
              name: true,
            },
          },
          booking: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              listing: {
                select: {
                  title: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
              evidence: true,
            },
          },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Transformer les stats
    const stats = {
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<number, number>,
      open: 0,
    };
    statusStats.forEach((s) => {
      stats.byStatus[s.status] = s._count.status;
      if (["OPEN", "UNDER_REVIEW", "AWAITING_HOST", "AWAITING_GUEST"].includes(s.status)) {
        stats.open += s._count.status;
      }
    });
    priorityStats.forEach((p) => {
      stats.byPriority[p.priority] = p._count.priority;
    });

    return NextResponse.json({
      disputes: disputes.map((d) => ({
        id: d.id,
        reason: d.reason,
        status: d.status,
        priority: d.priority,
        description: d.description,
        claimedAmountCents: d.claimedAmountCents,
        awardedAmountCents: d.awardedAmountCents,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        resolvedAt: d.resolvedAt,
        openedBy: d.openedBy,
        against: d.User_Dispute_againstIdToUser,
        assignedAdmin: d.assignedAdmin,
        booking: d.booking,
        messagesCount: d._count.messages,
        evidenceCount: d._count.evidence,
      })),
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
      stats,
    });
  } catch (error) {
    console.error("Erreur API admin disputes:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
