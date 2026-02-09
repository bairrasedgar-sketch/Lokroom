// apps/web/src/app/api/cron/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { regenerateRecommendations } from "@/lib/recommendations/engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/recommendations
 * Cron job pour régénérer les recommandations quotidiennement
 *
 * À configurer dans Vercel Cron ou autre service de cron:
 * - Fréquence: 0 2 * * * (tous les jours à 2h du matin)
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'autorisation
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting recommendations regeneration...");

    // Récupérer tous les utilisateurs actifs (avec au moins 1 favori ou 1 réservation)
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
        OR: [
          { favorites: { some: {} } },
          { bookings: { some: {} } },
        ],
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`[Cron] Found ${users.length} users to process`);

    let successCount = 0;
    let errorCount = 0;

    // Traiter par batch de 10 utilisateurs
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            await regenerateRecommendations(user.id);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`[Cron] Error for user ${user.email}:`, error);
          }
        })
      );

      // Pause de 100ms entre chaque batch pour ne pas surcharger la DB
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("[Cron] Recommendations regeneration complete!");
    console.log(`  - Success: ${successCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`  - Total: ${users.length}`);

    return NextResponse.json({
      success: true,
      processed: users.length,
      successCount,
      errorCount,
    });
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate recommendations" },
      { status: 500 }
    );
  }
}
