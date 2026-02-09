/**
 * Lok'Room - API Test Webhook
 * POST /api/webhooks/[id]/test - Envoyer un événement de test
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { validateRequestBody } from "@/lib/validations";
import { testWebhookSchema } from "@/lib/validations/webhooks";
import { triggerWebhook } from "@/lib/webhooks/service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/[id]/test
 * Envoie un événement de test au webhook
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}
