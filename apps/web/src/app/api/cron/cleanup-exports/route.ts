/**
 * Job de nettoyage des exports expirés
 * À exécuter via cron job: 0 2 * * * (tous les jours à 2h du matin)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // 🔒 SÉCURITÉ : Vérifier l'authentification du cron job
    // CRITICAL: Fail fast si CRON_SECRET n'est pas défini
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET is not defined in environment variables");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();

    // Supprimer les exports expirés
    const result = await prisma.dataExportRequest.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: "completed",
      },
    });

    // Logger l'opération
    console.log(`[Cron] Nettoyage exports expirés: ${result.count} supprimés`);

    // Supprimer aussi les exports en échec de plus de 7 jours
    const failedResult = await prisma.dataExportRequest.deleteMany({
      where: {
        status: "failed",
        createdAt: {
          lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    console.log(`[Cron] Nettoyage exports échoués: ${failedResult.count} supprimés`);

    return NextResponse.json({
      success: true,
      deleted: {
        expired: result.count,
        failed: failedResult.count,
        total: result.count + failedResult.count,
      },
    });
  } catch (error) {
    console.error("[Cron] Erreur nettoyage exports:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Permettre aussi GET pour tester manuellement
export async function GET(req: NextRequest) {
  return POST(req);
}
