// apps/web/src/app/api/admin/support/conversations/[id]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET /api/admin/support/conversations/[id] → détail d'une conversation
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const conversation = await prisma.supportConversation.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignedAdmin: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Marquer les messages comme lus par l'admin
    await prisma.supportMessage.updateMany({
      where: {
        conversationId: params.id,
        readByAdmin: false,
        type: "USER",
      },
      data: {
        readByAdmin: true,
        readByAdminAt: new Date(),
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    logger.error("Failed to fetch admin conversation", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      conversationId: params.id,
    });

    return NextResponse.json(
      {
        error: "ADMIN_CONVERSATION_FETCH_FAILED",
        message: "Failed to fetch conversation. Please try again."
      },
      { status: 500 }
    );
  }
}
