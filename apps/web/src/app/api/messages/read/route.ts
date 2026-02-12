import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { broadcastMessage } from "@/lib/sse-broadcast";
import { logger } from "@/lib/logger";


// POST /api/messages/read - Marquer un message comme lu
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, messageId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requis" }, { status: 400 });
    }

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
    logger.error("Error in read endpoint:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
