// apps/web/src/instrumentation.ts

/**
 * Fichier d'instrumentation Next.js
 * Exécuté au démarrage du serveur (avant toute requête)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Initialiser Sentry côté serveur
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    await import("./lib/env");
  }

  // Initialiser Sentry côté Edge
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
