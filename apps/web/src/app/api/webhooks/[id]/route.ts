/**
 * Lok'Room - API Webhook individuel
 * GET /api/webhooks/[id] - Détails d'un webhook
 * PUT /api/webhooks/[id] - Modifier un webhook
 * DELETE /api/webhooks/[id] - Supprimer un webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { validateRequestBody } from "@/lib/validations";
import { updateWebhookSchema } from "@/lib/validations/webhooks";
import { validateWebhookUrl, generateWebhookSecret } from "@/lib/webhooks/service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/[id]
 * Récupère les détails d'un webhook
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  const webhook = await prisma.webhook.findUnique({
    where: {
      id: params.id,
      userId: user.id,
    },
    select: {
      id: true,
      url: true,
      events: true,
      secret: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          deliveries: true,
        },
      },
    },
  });

  if (!webhook) {
    return jsonError("webhook_not_found", 404);
  }

  return NextResponse.json(webhook);
}

/**
 * PUT /api/webhooks/[id]
 * Met à jour un webhook
 */
export async function PUT(
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

  // Valider le body
  const validation = await validateRequestBody(req, updateWebhookSchema);
  if (!validation.success) {
    return jsonError(validation.error, validation.status);
  }

  const { url, events, active } = validation.data;

  // Valider l'URL si fournie
  if (url) {
    const urlValidation = validateWebhookUrl(url);
    if (!urlValidation.valid) {
      return jsonError(urlValidation.error || "URL invalide", 400);
    }
  }

  // Mettre à jour le webhook
  const webhook = await prisma.webhook.update({
    where: { id: params.id },
    data: {
      ...(url && { url }),
      ...(events && { events }),
      ...(active !== undefined && { active }),
    },
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

  return NextResponse.json(webhook);
}

/**
 * DELETE /api/webhooks/[id]
 * Supprime un webhook
 */
export async function DELETE(
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

  // Supprimer le webhook (cascade sur les deliveries)
  await prisma.webhook.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
