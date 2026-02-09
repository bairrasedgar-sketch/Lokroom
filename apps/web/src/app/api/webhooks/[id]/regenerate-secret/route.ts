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
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}
