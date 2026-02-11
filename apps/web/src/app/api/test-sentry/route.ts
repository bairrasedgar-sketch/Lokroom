import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Route de test pour Sentry
 * GET /api/test-sentry?type=error|warning|info
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "error";

  try {
    if (type === "error") {
      // Test d'erreur
      throw new Error("Test Sentry Error - This is a test error from Lok'Room");
    } else if (type === "warning") {
      // Test de warning
      logger.warn("Test Sentry Warning", {
        source: "test-sentry-route",
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({
        success: true,
        message: "Warning logged to Sentry",
      });
    } else if (type === "info") {
      // Test d'info
      logger.info("Test Sentry Info", {
        source: "test-sentry-route",
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({
        success: true,
        message: "Info logged to Sentry",
      });
    } else if (type === "performance") {
      // Test de performance lente
      const start = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5s
      const duration = performance.now() - start;
      logger.logPerformance("test-slow-operation", duration, {
        source: "test-sentry-route",
      });
      return NextResponse.json({
        success: true,
        message: "Slow operation logged to Sentry",
        duration,
      });
    }

    return NextResponse.json({
      error: "Invalid type. Use ?type=error|warning|info|performance",
    });
  } catch (error) {
    logger.error("Test Sentry Error caught", error);
    return NextResponse.json(
      {
        error: "Error thrown and logged to Sentry",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
