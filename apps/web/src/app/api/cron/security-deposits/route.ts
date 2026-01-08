// apps/web/src/app/api/cron/security-deposits/route.ts
/**
 * GET /api/cron/security-deposits
 * Cron job pour libérer automatiquement les dépôts expirés
 *
 * À configurer dans vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/security-deposits",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 *
 * Ou appeler via un service externe (cron-job.org, etc.)
 */

import { NextResponse } from "next/server";
import { checkExpiredDeposits } from "@/lib/security-deposit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// Clé secrète pour sécuriser l'endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  try {
    // Vérifier l'autorisation
    const authHeader = req.headers.get("authorization");

    // En production, vérifier le secret
    if (process.env.NODE_ENV === "production") {
      if (!CRON_SECRET) {
        console.error("[Cron] CRON_SECRET non configuré");
        return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
      }

      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    console.log("[Cron] Démarrage vérification des dépôts expirés...");

    // Vérifier et libérer les dépôts expirés
    const result = await checkExpiredDeposits();

    // Envoyer des notifications pour les dépôts libérés
    if (result.released > 0) {
      // Récupérer les dépôts qui viennent d'être libérés
      const recentlyReleased = await prisma.securityDeposit.findMany({
        where: {
          status: "RELEASED",
          releasedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Dernières 5 minutes
          },
        },
        include: {
          booking: {
            include: {
              guest: true,
              listing: {
                include: { owner: true },
              },
            },
          },
        },
      });

      for (const deposit of recentlyReleased) {
        // Notification au guest
        await createNotification({
          userId: deposit.booking.guestId,
          type: "SECURITY_DEPOSIT_RELEASED",
          title: "Caution libérée automatiquement",
          message: `Votre caution de ${(deposit.amountCents / 100).toFixed(2)} ${deposit.currency} a été libérée automatiquement`,
          actionUrl: `/reservations/${deposit.bookingId}`,
          data: {
            bookingId: deposit.bookingId,
            depositId: deposit.id,
            amountCents: deposit.amountCents,
            currency: deposit.currency,
            automatic: true,
          },
        });
      }
    }

    console.log(`[Cron] Terminé: ${result.processed} traités, ${result.released} libérés, ${result.errors} erreurs`);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Permettre aussi POST pour certains services de cron
export async function POST(req: Request) {
  return GET(req);
}
