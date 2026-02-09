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
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function GET(req: NextRequest) {
  return jsonError("Webhook feature temporarily disabled", 503);
}

/**
 * POST /api/webhooks
 * Crée un nouveau webhook
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function POST(req: NextRequest) {
  return jsonError("Webhook feature temporarily disabled", 503);
}
