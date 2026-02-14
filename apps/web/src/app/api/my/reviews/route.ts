// apps/web/src/app/api/my/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/my/reviews
 *
 * ➜ Renvoie :
 *  - written : les avis que j'ai écrits (en tant qu'auteur)
 *  - received : les avis que j'ai reçus (en tant que cible / targetUser)
 *
 * Optionnel :
 *  - ?type=written   → seulement les avis écrits
 *  - ?type=received  → seulement les avis reçus
 */
export async function GET(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) {
      return jsonError("unauthorized", 401);
    }

    const type = req.nextUrl.searchParams.get("type");

    // Avis que j'ai ÉCRITS
    const writtenPromise =
      type === "received"
        ? Promise.resolve([])
        : prisma.review.findMany({
            where: { authorId: me.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              booking: {
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                },
              },
              listing: {
                select: {
                  id: true,
                  title: true,
                },
              },
              targetUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

    // Avis que j'ai REÇUS
    const receivedPromise =
      type === "written"
        ? Promise.resolve([])
        : prisma.review.findMany({
            where: { targetUserId: me.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              booking: {
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                },
              },
              listing: {
                select: {
                  id: true,
                  title: true,
                },
              },
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

    const [written, received] = await Promise.all([
      writtenPromise,
      receivedPromise,
    ]);

    return NextResponse.json({
      written,
      received,
    });
  } catch (error) {
    logger.error("Failed to fetch reviews", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "REVIEWS_FETCH_FAILED",
        message: "Failed to fetch reviews. Please try again."
      },
      { status: 500 }
    );
  }
}
