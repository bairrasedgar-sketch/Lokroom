// apps/web/src/app/api/admin/support/conversations/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET /api/admin/support/conversations → liste toutes les conversations support
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const conversations = await prisma.supportConversation.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignedAdmin: {
          select: { id: true, name: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [
        { status: "asc" }, // WAITING_AGENT en premier
        { priority: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    logger.error("Failed to fetch admin support conversations", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "ADMIN_CONVERSATIONS_FETCH_FAILED",
        message: "Failed to fetch conversations. Please try again."
      },
      { status: 500 }
    );
  }
}
