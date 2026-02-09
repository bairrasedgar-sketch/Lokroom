// apps/web/src/app/api/recommendations/regenerate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { regenerateRecommendations } from "@/lib/recommendations/engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/recommendations/regenerate
 * Régénère les recommandations pour l'utilisateur connecté
 */
export async function POST(req: NextRequest) {
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

    await regenerateRecommendations(user.id);

    return NextResponse.json({ success: true, message: "Recommendations regenerated" });
  } catch (error) {
    console.error("[API] Error regenerating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to regenerate recommendations" },
      { status: 500 }
    );
  }
}
