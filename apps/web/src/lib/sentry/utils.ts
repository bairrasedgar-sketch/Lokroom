import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";


/**
 * Capture an exception and send it to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    logger.error("Sentry (dev):", error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message and send it to Sentry
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info",
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Sentry (dev) [${level}]:`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  if (process.env.NODE_ENV === "development") {
    logger.debug("Sentry (dev) - Set user:", user);
    return;
  }

  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  if (process.env.NODE_ENV === "development") {
    logger.debug("Sentry (dev) - Clear user");
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Sentry (dev) - Breadcrumb [${category}]:`, message, data);
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Sentry (dev) - Start transaction: ${name} (${op})`);
    return {
      finish: () => logger.debug(`Sentry (dev) - Finish transaction: ${name}`),
      setStatus: (status: string) =>
        logger.debug(`Sentry (dev) - Transaction status: ${status}`),
    };
  }

  // Sentry v8+ uses startSpan instead of startTransaction
  // Return a compatible object for backward compatibility
  return {
    finish: () => {},
    setStatus: () => {},
  };
}

/**
 * Wrap an async function with error handling
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, {
        ...context,
        args,
      });
      throw error;
    }
  }) as T;
}

/**
 * Set custom tags for filtering in Sentry
 */
export function setTag(key: string, value: string) {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Sentry (dev) - Set tag: ${key} = ${value}`);
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    logger.debug(`Sentry (dev) - Set context: ${name}`, context);
    return;
  }

  Sentry.setContext(name, context);
}
