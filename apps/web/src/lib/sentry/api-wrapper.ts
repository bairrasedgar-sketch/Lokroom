import * as Sentry from "@sentry/nextjs";

/**
 * Example API route with Sentry error tracking
 *
 * Usage:
 * import { withSentryAPI } from "@/lib/sentry/api-wrapper";
 *
 * export const GET = withSentryAPI(async (req) => {
 *   // Your API logic here
 * });
 */

export function withSentryAPI<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Capture the error in Sentry
      Sentry.captureException(error, {
        contexts: {
          api: {
            args: args.map((arg) => {
              // Safely stringify request objects
              if (arg && typeof arg === "object" && "url" in arg) {
                return {
                  url: arg.url,
                  method: arg.method,
                };
              }
              return arg;
            }),
          },
        },
      });

      // Log in development
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", error);
      }

      // Return error response
      return Response.json(
        {
          error: "Internal Server Error",
          message:
            process.env.NODE_ENV === "development"
              ? (error as Error).message
              : "An unexpected error occurred",
        },
        { status: 500 }
      );
    }
  }) as T;
}

/**
 * Track API performance
 */
export async function trackAPIPerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV === "development") {
    const start = Date.now();
    const result = await operation();
    console.log(`API Performance [${name}]: ${Date.now() - start}ms`);
    return result;
  }

  // Sentry v8+ uses startSpan instead of startTransaction
  return await Sentry.startSpan(
    {
      name,
      op: "api",
    },
    async () => {
      try {
        return await operation();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}
