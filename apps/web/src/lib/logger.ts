import { logger } from "@/lib/logger";
/**
 * Logger centralisé pour l'application
 * Gestion professionnelle des logs avec niveaux et contexte
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Garder les 100 derniers logs en mémoire

  /**
   * Log debug (uniquement en développement)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Log info
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    this.log('error', message, errorContext);

    // Envoyer à Sentry en production
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.sendToSentry(error, message, context);
    }
  }

  /**
   * Envoyer une erreur à Sentry
   */
  private sendToSentry(error: Error | unknown, message: string, context?: LogContext) {
    try {
      // Client-side: utiliser window.Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        if (error instanceof Error) {
          (window as any).Sentry.captureException(error, {
            contexts: { custom: { message, ...context } },
          });
        } else {
          (window as any).Sentry.captureMessage(message, {
            level: 'error',
            contexts: { custom: { error, ...context } },
          });
        }
      }
      // Server-side: utiliser import dynamique
      else if (typeof window === 'undefined') {
        import('@sentry/nextjs').then((Sentry) => {
          if (error instanceof Error) {
            Sentry.captureException(error, {
              contexts: { custom: { message, ...context } },
            });
          } else {
            Sentry.captureMessage(message, {
              level: 'error',
              contexts: { custom: { error, ...context } },
            });
          }
        }).catch(() => {
          // Sentry non disponible
        });
      }
    } catch (err) {
      // Ignorer les erreurs Sentry pour éviter les boucles
      logger.error('Failed to send to Sentry:', err);
    }
  }

  /**
   * Log une action utilisateur
   */
  logUserAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, context);

    // TODO: Envoyer à analytics (Firebase, Mixpanel, etc.)
    // analytics.track(action, context);
  }

  /**
   * Log une performance
   */
  logPerformance(metric: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${metric}`, {
      ...context,
      duration,
      durationMs: `${duration}ms`,
    });

    // Envoyer à Sentry si lent (> 1s)
    if (!this.isDevelopment && duration > 1000) {
      try {
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureMessage(`Slow operation: ${metric}`, {
            level: 'warning',
            contexts: { performance: { duration, ...context } },
          });
        } else if (typeof window === 'undefined') {
          import('@sentry/nextjs').then((Sentry) => {
            Sentry.captureMessage(`Slow operation: ${metric}`, {
              level: 'warning',
              contexts: { performance: { duration, ...context } },
            });
          }).catch(() => {
            // Sentry non disponible
          });
        }
      } catch (err) {
        logger.error('Failed to send performance to Sentry:', err);
      }
    }
  }

  /**
   * Log une requête API
   */
  logApiCall(method: string, endpoint: string, duration: number, status: number, context?: LogContext) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';

    this.log(level, `API ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      duration,
      status,
    });
  }

  /**
   * Récupérer les logs récents
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Vider les logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Exporter les logs (pour debug)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Méthode privée pour logger
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Ajouter au buffer
    this.logs.push(entry);

    // Limiter la taille du buffer
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Logger dans la console
    const consoleMethod = level === 'debug' ? 'log' : level;
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    console[consoleMethod](
      `${emoji} [${level.toUpperCase()}] ${message}`,
      context || ''
    );
  }
}

// Instance singleton
export const logger = new Logger();

/**
 * Hook pour mesurer les performances d'un composant
 */
export function usePerformanceLogger(componentName: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    logger.logPerformance(`Component render: ${componentName}`, duration);
  };
}

/**
 * Wrapper pour mesurer les performances d'une fonction
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T,
  context?: LogContext
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logger.logPerformance(name, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`${name} failed after ${duration}ms`, error, context);
    throw error;
  }
}

/**
 * Decorator pour logger automatiquement les erreurs d'une fonction
 */
export function withErrorLogging<T extends (...args: unknown[]) => unknown>(
  fn: T,
  functionName?: string
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);

      // Si c'est une Promise, catcher les erreurs async
      if (result instanceof Promise) {
        return result.catch((error) => {
          logger.error(`Error in ${functionName || fn.name}`, error, { args });
          throw error;
        });
      }

      return result;
    } catch (error) {
      logger.error(`Error in ${functionName || fn.name}`, error, { args });
      throw error;
    }
  }) as T;
}
