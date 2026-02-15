import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { broadcastMessage } from "@/lib/sse-broadcast";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

// 🔒 VALIDATION: Schéma Zod pour read event
const readSchema = z.object({
  conversationId: z.string().min(1, "conversationId requis"),
  messageId: z.string().optional(),
});

// POST /api/messages/read - Marquer un message comme lu
export async function POST(request: Request) {
  try {
    // 🔒 RATE LIMITING: 60 req/min pour read events
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`read:${ip}`, 60, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 🔒 VALIDATION: Valider les inputs avec Zod
    let body: z.infer<typeof readSchema>;
    try {
      body = readSchema.parse(await request.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const { conversationId, messageId } = body;

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { hostId: session.user.id },
          { guestId: session.user.id },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Update the conversation's updatedAt to track activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Diffuser l'événement read aux autres participants
    broadcastMessage(conversationId, {
      type: "read",
      data: {
        conversationId,
        userId: session.user.id,
        lastReadMessageId: messageId,
        readAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("POST /api/messages/read error", { error });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
