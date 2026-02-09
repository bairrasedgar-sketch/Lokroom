/**
 * Lok'Room - API Régénérer le secret d'un webhook
 * POST /api/webhooks/[id]/regenerate-secret - Régénère le secret d'un webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { generateWebhookSecret } from "@/lib/webhooks/service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/[id]/regenerate-secret
 * Régénère le secret d'un webhook
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  // Vérifier que le webhook existe et appartient à l'utilisateur
  const existing = await prisma.webhook.findUnique({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!existing) {
    return jsonError("webhook_not_found", 404);
  }

  // Générer un nouveau secret
  const newSecret = generateWebhookSecret();

  // Mettre à jour le webhook
  const webhook = await prisma.webhook.update({
    where: { id: params.id },
    data: { secret: newSecret },
    select: {
      id: true,
      url: true,
      events: true,
      secret: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Secret régénéré avec succès",
    webhook,
  });
}
