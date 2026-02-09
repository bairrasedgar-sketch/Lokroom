// apps/web/src/app/api/tracking/behavior/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trackUserBehavior } from "@/lib/recommendations/tracking";
import { z } from "zod";

export const dynamic = "force-dynamic";

const trackingSchema = z.object({
  action: z.enum(["view", "click", "search", "favorite", "book"]),
  listingId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/tracking/behavior
 * Track user behavior for recommendations
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

    const body = await req.json();
    const validation = trackingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, listingId, metadata } = validation.data;

    await trackUserBehavior(user.id, action, listingId, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error tracking behavior:", error);
    return NextResponse.json(
      { error: "Failed to track behavior" },
      { status: 500 }
    );
  }
}
