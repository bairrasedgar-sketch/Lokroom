// apps/web/src/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { regenerateRecommendations } from "@/lib/recommendations/engine";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations
 * Récupère les recommandations personnalisées pour l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Récupérer les recommandations depuis le cache
    let recommendations = await prisma.userRecommendation.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { position: "asc" },
            },
            reviews: true,
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { score: "desc" },
      take: 20,
    });

    // Si pas de recommandations en cache, les générer
    if (recommendations.length === 0) {
      await regenerateRecommendations(user.id);
      recommendations = await prisma.userRecommendation.findMany({
        where: { userId: user.id },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { position: "asc" },
              },
              reviews: true,
              owner: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { score: "desc" },
        take: 20,
      });
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    logger.error("[API] Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
