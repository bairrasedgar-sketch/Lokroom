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
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}

/**
 * PUT /api/webhooks/[id]
 * Met à jour un webhook
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}

/**
 * DELETE /api/webhooks/[id]
 * Supprime un webhook
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}
