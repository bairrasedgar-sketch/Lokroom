import { logger } from './logger';

/**
 * Intégration Sentry pour le monitoring des erreurs en production
 * Architecture professionnelle avec configuration complète
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

/**
 * Initialiser Sentry (à appeler au démarrage de l'app)
 */
export function initSentry(config: SentryConfig) {
  // TODO: Installer @sentry/nextjs
  // npm install @sentry/nextjs

  // TODO: Décommenter après installation
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate || 0.1, // 10% des transactions

    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1, // 10% des sessions
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0, // 100% des erreurs

    // Intégrations
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filtrer les erreurs non pertinentes
    beforeSend(event, hint) {
      // Ignorer les erreurs de réseau
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }

      // Ignorer les erreurs de timeout
      if (event.exception?.values?.[0]?.value?.includes('timeout')) {
        return null;
      }

      // Ajouter le contexte utilisateur
      if (typeof window !== 'undefined') {
        event.contexts = {
          ...event.contexts,
          browser: {
            name: navigator.userAgent,
            version: navigator.appVersion,
          },
          screen: {
            width: window.screen.width,
            height: window.screen.height,
          },
        };
      }

      return event;
    },
  });

  logger.info('Sentry initialized', {
    environment: config.environment,
    release: config.release,
  });
  */

  logger.info('Sentry configuration ready (install @sentry/nextjs to enable)', {
    environment: config.environment,
  });
}

/**
 * Capturer une erreur manuellement
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  logger.error('Error captured', error, context);

  // TODO: Décommenter après installation de Sentry
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
  */
}

/**
 * Capturer un message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  logger[level === 'warning' ? 'warn' : level](message, context);

  // TODO: Décommenter après installation de Sentry
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
  */
}

/**
 * Définir le contexte utilisateur
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  logger.info('User context set', { userId: user.id });

  // TODO: Décommenter après installation de Sentry
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
  */
}

/**
 * Effacer le contexte utilisateur (logout)
 */
export function clearUserContext() {
  logger.info('User context cleared');

  // TODO: Décommenter après installation de Sentry
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.setUser(null);
  */
}

/**
 * Ajouter un breadcrumb (fil d'Ariane pour debug)
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  logger.debug(`Breadcrumb: ${category} - ${message}`, data);

  // TODO: Décommenter après installation de Sentry
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
  */
}

/**
 * Démarrer une transaction (performance monitoring)
 */
export function startTransaction(name: string, op: string) {
  const startTime = performance.now();

  return {
    finish: () => {
      const duration = performance.now() - startTime;
      logger.logPerformance(name, duration, { operation: op });

      // TODO: Décommenter après installation de Sentry
      /*
      import * as Sentry from '@sentry/nextjs';

      const transaction = Sentry.startTransaction({ name, op });
      transaction.finish();
      */
    },
  };
}

/**
 * Configuration Sentry pour Next.js
 * À ajouter dans sentry.client.config.ts et sentry.server.config.ts
 */
export const sentryConfig: SentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  tracesSampleRate: 0.1, // 10% des transactions
  replaysSessionSampleRate: 0.1, // 10% des sessions
  replaysOnErrorSampleRate: 1.0, // 100% des erreurs
};

/**
 * Hook React pour capturer les erreurs de composants
 */
export function useSentryErrorBoundary(componentName: string) {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    captureError(error, {
      componentName,
      componentStack: errorInfo.componentStack,
    });
  };
}
