/**
 * Lok'Room - API Webhook Deliveries
 * GET /api/webhooks/[id]/deliveries - Historique des livraisons d'un webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { validateSearchParams } from "@/lib/validations";
import { webhookDeliveriesSchema } from "@/lib/validations/webhooks";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/[id]/deliveries
 * Liste l'historique des livraisons d'un webhook avec pagination
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}

  // Récupérer les deliveries
  const [deliveries, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where: {
        webhookId: params.id,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        event: true,
        status: true,
        attempts: true,
        lastAttempt: true,
        response: true,
        createdAt: true,
      },
    }),
    prisma.webhookDelivery.count({
      where: {
        webhookId: params.id,
        ...(status && { status }),
      },
    }),
  ]);

  // Statistiques
  const stats = await prisma.webhookDelivery.groupBy({
    by: ["status"],
    where: { webhookId: params.id },
    _count: true,
  });

  const statistics = {
    total: total,
    success: stats.find((s) => s.status === "success")?._count || 0,
    failed: stats.find((s) => s.status === "failed")?._count || 0,
    pending: stats.find((s) => s.status === "pending")?._count || 0,
  };

  return NextResponse.json({
    deliveries,
    statistics,
    page,
    pageSize,
    total,
    pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
  });
}
