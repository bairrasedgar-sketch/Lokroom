import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Filtrer les erreurs non pertinentes
  beforeSend(event, hint) {
    // Ignorer les erreurs de connexion DB temporaires
    if (event.exception?.values?.[0]?.value?.includes("ECONNREFUSED")) {
      return null;
    }

    // Ignorer les erreurs de timeout DB
    if (event.exception?.values?.[0]?.value?.includes("timeout")) {
      return null;
    }

    // Ajouter le contexte serveur
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: "node",
        version: process.version,
      },
    };

    return event;
  },

  // Ignorer certaines transactions
  ignoreTransactions: [
    "/api/health",
    "/api/ping",
    "/_next/static",
    "/_next/image",
  ],

  // Ne pas envoyer d'erreurs en développement
  enabled: process.env.NODE_ENV === "production",
});
