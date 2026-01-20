// apps/web/src/instrumentation.ts

/**
 * Fichier d'instrumentation Next.js
 * Exécuté au démarrage du serveur (avant toute requête)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Valider les variables d'environnement au démarrage
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
