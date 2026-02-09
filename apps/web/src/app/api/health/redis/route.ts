// apps/web/src/app/api/health/redis/route.ts

/**
 * Health check pour Redis.
 * Permet de vérifier que Redis est disponible.
 */

import { NextResponse } from "next/server";
import { isRedisAvailable } from "@/lib/redis/cache-safe";

export const dynamic = "force-dynamic";

/**
 * GET /api/health/redis
 * Vérifie la connexion à Redis.
 */
export async function GET() {
  try {
    const available = await isRedisAvailable();

    if (available) {
      return NextResponse.json({
        status: "healthy",
        redis: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          redis: "disconnected",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("[Health Check] Redis error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        redis: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
