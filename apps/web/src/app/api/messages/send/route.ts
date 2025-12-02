import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Body = {
  conversationId?: string;
  hostId?: string;
  guestId?: string;
  listingId?: string | null;
  reservationId?: string | null;
  message: string;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = (await req.json()) as Body;

    const text = body.message?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "Message vide" },
        { status: 400 },
      );
    }

    let conversationId = body.conversationId;

    // 1️⃣ Si pas de conversationId, on crée / retrouve une conversation
    if (!conversationId) {
      const { hostId, guestId, listingId, reservationId } = body;

      if (!hostId || !guestId) {
        return NextResponse.json(
          { error: "hostId et guestId sont requis si pas de conversationId" },
          { status: 400 },
        );
      }

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
          reservationId: reservationId ?? undefined,
        },
      });

      const conversation =
        existing ??
        (await prisma.conversation.create({
          data: {
            hostId,
            guestId,
            listingId: listingId ?? undefined,
            reservationId: reservationId ?? undefined,
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

    // 3️⃣ Crée le message
    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        content: text,
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

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (e) {
    console.error("Erreur /api/messages/send:", e);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
