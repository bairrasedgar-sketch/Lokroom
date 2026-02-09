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
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  // Vérifier que le webhook existe et appartient à l'utilisateur
  const webhook = await prisma.webhook.findUnique({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!webhook) {
    return jsonError("webhook_not_found", 404);
  }

  // Valider les paramètres de recherche
  const validation = validateSearchParams(
    req.nextUrl.searchParams,
    webhookDeliveriesSchema
  );

  if (!validation.success) {
    return jsonError(validation.error, 400);
  }

  const { page, pageSize, status } = validation.data;

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
