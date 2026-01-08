import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMessageSchema, validateRequestBody } from "@/lib/validations";
import { broadcastMessage } from "@/lib/sse-broadcast";
import { detectLanguage } from "@/lib/translation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Validation Zod du body
    const validation = await validateRequestBody(req, sendMessageSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const { conversationId: convIdInput, listingId, bookingId, recipientId, content } = validation.data;
    const text = content.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Message vide" },
        { status: 400 },
      );
    }

    let conversationId = convIdInput;

    // 1️⃣ Si pas de conversationId, on crée / retrouve une conversation
    if (!conversationId) {
      // Pour créer une nouvelle conversation, on a besoin d'un recipientId
      if (!recipientId) {
        return NextResponse.json(
          { error: "recipientId requis pour créer une nouvelle conversation" },
          { status: 400 },
        );
      }

      // Déterminer qui est host et qui est guest
      // On regarde si le recipient est un host (a un hostProfile)
      const recipientUser = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, hostProfile: { select: { id: true } } },
      });

      if (!recipientUser) {
        return NextResponse.json(
          { error: "Destinataire introuvable" },
          { status: 404 },
        );
      }

      // Si le recipient a un hostProfile, il est le host
      // Sinon, l'expéditeur est considéré comme host
      const isRecipientHost = !!recipientUser.hostProfile;
      const hostId = isRecipientHost ? recipientId : userId;
      const guestId = isRecipientHost ? userId : recipientId;

      // L'utilisateur doit être l'un des deux
      if (userId !== hostId && userId !== guestId) {
        return NextResponse.json(
          { error: "Tu ne fais pas partie de cette conversation" },
          { status: 403 },
        );
      }

      // Conversation existante pour ce trio host/guest/réservation ?
      const existing = await prisma.conversation.findFirst({
        where: {
          hostId,
          guestId,
          reservationId: bookingId ?? undefined,
        },
      });

      const conversation =
        existing ??
        (await prisma.conversation.create({
          data: {
            hostId,
            guestId,
            listingId: listingId ?? undefined,
            reservationId: bookingId ?? undefined,
          },
        }));

      conversationId = conversation.id;
    }

    // 2️⃣ Vérifie que l'utilisateur appartient bien à la conversation
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, hostId: true, guestId: true },
    });

    if (!conv) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 },
      );
    }

    if (userId !== conv.hostId && userId !== conv.guestId) {
      return NextResponse.json(
        { error: "Tu ne fais pas partie de cette conversation" },
        { status: 403 },
      );
    }

    // 3. Detecter la langue du message
    let detectedLanguage: string | null = null;
    try {
      const detection = await detectLanguage(text);
      if (detection.confidence > 0.3) {
        detectedLanguage = detection.language;
      }
    } catch (e) {
      console.error("Erreur detection langue:", e);
    }

    // 4. Creer le message avec la langue detectee
    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        content: text,
        originalLanguage: detectedLanguage,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // 5. Diffuser le message en temps reel aux participants
    broadcastMessage(conv.id, {
      type: "message",
      data: {
        conversationId: conv.id,
        message: {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: msg.sender.name || "Utilisateur",
          createdAt: msg.createdAt.toISOString(),
          originalLanguage: msg.originalLanguage,
        },
      },
    });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (e) {
    console.error("Erreur /api/messages/send:", e);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
