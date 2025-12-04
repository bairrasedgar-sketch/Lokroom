import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ hostId: userId }, { guestId: userId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        host: { select: { id: true, name: true } },
        guest: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true, city: true, country: true } },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    const result = conversations.map((conv) => {
      const lastMessage = conv.messages[0] ?? null;

      const otherUser =
        conv.hostId === userId ? conv.guest : conv.host;

      const hasBooking = !!conv.reservationId || !!conv.booking;
      const isSupport = !conv.listingId && !conv.reservationId;

      const isUnread =
        lastMessage && lastMessage.senderId !== userId;

      return {
        id: conv.id,
        title:
          conv.listing?.title ??
          `Conversation avec ${otherUser?.name ?? "Utilisateur"}`,
        otherUserName: otherUser?.name ?? "Utilisateur Lok'Room",
        lastMessagePreview: lastMessage?.content ?? "",
        lastMessageAt: lastMessage?.createdAt ?? conv.updatedAt,
        isUnread: !!isUnread,
        hasBooking,
        isSupport,
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (e) {
    console.error("Erreur /api/messages/conversations:", e);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
