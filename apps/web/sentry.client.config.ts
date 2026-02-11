import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% des sessions normales
  replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreurs

  // Intégrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filtrer les erreurs non pertinentes
  beforeSend(event, hint) {
    // Ignorer les erreurs de réseau
    if (event.exception?.values?.[0]?.type === "NetworkError") {
      return null;
    }

    // Ignorer les erreurs de timeout
    if (event.exception?.values?.[0]?.value?.includes("timeout")) {
      return null;
    }

    // Ignorer les erreurs d'annulation de requête
    if (event.exception?.values?.[0]?.value?.includes("AbortError")) {
      return null;
    }

    // Ignorer les erreurs de navigation
    if (event.exception?.values?.[0]?.value?.includes("Navigation")) {
      return null;
    }

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
