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
