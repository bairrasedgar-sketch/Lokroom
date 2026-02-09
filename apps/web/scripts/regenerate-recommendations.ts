// apps/web/scripts/regenerate-recommendations.ts
/**
 * Script pour régénérer les recommandations de tous les utilisateurs
 * Usage: node scripts/regenerate-recommendations.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function regenerateAllRecommendations() {
  console.log("[Recommendations] Starting regeneration for all users...");

  try {
    // Récupérer tous les utilisateurs (sauf admins)
    const users = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`[Recommendations] Found ${users.length} users to process`);

    let successCount = 0;
    let errorCount = 0;

    // Traiter chaque utilisateur
    for (const user of users) {
      try {
        console.log(`[Recommendations] Processing user ${user.email}...`);

        // Importer dynamiquement pour éviter les problèmes de path
        const { regenerateRecommendations } = await import(
          "../src/lib/recommendations/engine"
        );

        await regenerateRecommendations(user.id);
        successCount++;

        console.log(`[Recommendations] ✓ Success for ${user.email}`);
      } catch (error) {
        errorCount++;
        console.error(`[Recommendations] ✗ Error for ${user.email}:`, error);
      }
    }

    console.log("\n[Recommendations] Regeneration complete!");
    console.log(`  - Success: ${successCount}`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`  - Total: ${users.length}`);
  } catch (error) {
    console.error("[Recommendations] Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
regenerateAllRecommendations();
