// apps/web/src/app/api/test-sentry/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Route de test pour vérifier que Sentry capture bien les erreurs
 * GET /api/test-sentry?type=error|warning|info
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "error";

  try {
    switch (type) {
      case "error":
        // Test 1: Erreur capturée par logger (qui envoie à Sentry)
        logger.error("Test error from logger", new Error("This is a test error"), {
          testType: "logger",
          timestamp: new Date().toISOString(),
        });

        // Test 2: Erreur capturée directement par Sentry
        Sentry.captureException(new Error("Direct Sentry test error"), {
          tags: {
            testType: "direct",
            environment: process.env.NODE_ENV,
          },
        });

        // Test 3: Lancer une vraie erreur
        throw new Error("Uncaught test error - should be captured by Sentry");

      case "warning":
        logger.warn("Test warning from logger", {
          testType: "warning",
          timestamp: new Date().toISOString(),
        });

        Sentry.captureMessage("Test warning message", {
          level: "warning",
          tags: { testType: "warning" },
        });

        return NextResponse.json({
          success: true,
          message: "Warning sent to Sentry",
        });

      case "info":
        logger.info("Test info from logger", {
          testType: "info",
          timestamp: new Date().toISOString(),
        });

        Sentry.captureMessage("Test info message", {
          level: "info",
          tags: { testType: "info" },
        });

        return NextResponse.json({
          success: true,
          message: "Info sent to Sentry",
        });

      case "performance":
        // Test de performance lente (> 1s)
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const duration = Date.now() - start;

        logger.logPerformance("Test slow operation", duration, {
          testType: "performance",
        });

        return NextResponse.json({
          success: true,
          message: "Slow performance logged",
          duration,
        });

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: error, warning, info, or performance" },
          { status: 400 }
        );
    }
  } catch (error) {
    // Cette erreur sera capturée par Sentry automatiquement
    logger.error("Test error caught in catch block", error);

    return NextResponse.json(
      {
        success: true,
        message: "Error thrown and captured by Sentry",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 } // 200 car c'est un test volontaire
    );
  }
}
