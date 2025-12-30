import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addConnection, removeConnections } from "@/lib/sse-broadcast";

// GET /api/messages/stream - Server-Sent Events pour les messages en temps réel
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

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

  // Créer le stream SSE
  const stream = new ReadableStream({
    start(controller) {
      // Ajouter ce controller aux connexions pour cette conversation
      addConnection(conversationId, controller);

      // Envoyer un ping initial
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Ping toutes les 30 secondes pour garder la connexion ouverte
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);
    },
    cancel() {
      // Retirer les connexions quand le stream est fermé
      removeConnections(conversationId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
