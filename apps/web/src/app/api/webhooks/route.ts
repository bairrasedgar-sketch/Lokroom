/**
 * Lok'Room - API Webhooks
 * GET /api/webhooks - Liste des webhooks de l'utilisateur
 * POST /api/webhooks - Créer un nouveau webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { validateRequestBody } from "@/lib/validations";
import { createWebhookSchema } from "@/lib/validations/webhooks";
import {
  generateWebhookSecret,
  validateWebhookUrl,
  countUserWebhooks,
  MAX_WEBHOOKS_PER_USER,
} from "@/lib/webhooks/service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks
 * Liste tous les webhooks de l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10))
  );

  const [webhooks, total] = await Promise.all([
    prisma.webhook.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    }),
    prisma.webhook.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    webhooks,
    page,
    pageSize,
    total,
    pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
  });
}

/**
 * POST /api/webhooks
 * Crée un nouveau webhook
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("unauthorized", 401);
  }

  // Valider le body
  const validation = await validateRequestBody(req, createWebhookSchema);
  if (!validation.success) {
    return jsonError(validation.error, validation.status);
  }

  const { url, events } = validation.data;

  // Valider l'URL
  const urlValidation = validateWebhookUrl(url);
  if (!urlValidation.valid) {
    return jsonError(urlValidation.error || "URL invalide", 400);
  }

  // Vérifier la limite de webhooks par utilisateur
  const count = await countUserWebhooks(user.id);
  if (count >= MAX_WEBHOOKS_PER_USER) {
    return jsonError(
      `Limite de ${MAX_WEBHOOKS_PER_USER} webhooks atteinte`,
      400
    );
  }

  // Générer un secret
  const secret = generateWebhookSecret();

  // Créer le webhook
  const webhook = await prisma.webhook.create({
    data: {
      userId: user.id,
      url,
      events,
      secret,
      active: true,
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

  return NextResponse.json(webhook, { status: 201 });
}
