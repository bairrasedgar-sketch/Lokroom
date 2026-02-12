// apps/web/src/app/api/cron/check-deposits/route.ts
/**
 * Cron job pour verifier et liberer les depots de garantie expires
 * A appeler quotidiennement via Vercel Cron ou un service externe
 *
 * Configuration Vercel (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-deposits",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { checkExpiredDeposits } from "@/lib/security-deposit";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


// Cle secrete pour securiser le cron job
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verifier l'autorisation
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");

    // Accepter soit le header Authorization, soit x-cron-secret, soit le secret Vercel
    const isAuthorized =
      (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) ||
      (CRON_SECRET && cronSecret === CRON_SECRET) ||
      request.headers.get("x-vercel-cron") === "true";

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    logger.debug("[Cron] Demarrage verification des depots expires...");

    // Executer la verification
    const result = await checkExpiredDeposits();

    logger.debug(`[Cron] Termine: ${result.processed} traites, ${result.released} liberes, ${result.errors} erreurs`);

    // Notifier les admins si des erreurs
    if (result.errors > 0) {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: "SYSTEM_ANNOUNCEMENT",
          title: "Erreurs cron depots",
          message: `${result.errors} erreur(s) lors de la liberation automatique des depots`,
          data: { ...result },
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Erreur verification depots:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// Supporter aussi POST pour certains services de cron
export async function POST(request: NextRequest) {
  return GET(request);
}
