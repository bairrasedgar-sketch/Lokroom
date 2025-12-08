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
        host: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            images: { take: 1, select: { url: true } },
          },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            totalPrice: true,
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

      // Déterminer le rôle de l'utilisateur dans cette conversation
      const isHost = conv.hostId === userId;
      const otherUser = isHost ? conv.guest : conv.host;

      const hasBooking = !!conv.reservationId || !!conv.booking;

      const isUnread =
        lastMessage && lastMessage.senderId !== userId;

      return {
        id: conv.id,
        // Rôle de l'utilisateur
        userRole: isHost ? "host" : "guest",
        isHost,
        // Infos sur l'autre utilisateur
        otherUser: {
          id: otherUser?.id ?? "",
          name: otherUser?.name ?? "Utilisateur",
          avatarUrl: otherUser?.profile?.avatarUrl ?? null,
        },
        // Dernier message
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isFromMe: lastMessage.senderId === userId,
            }
          : null,
        updatedAt: conv.updatedAt,
        isUnread: !!isUnread,
        hasBooking,
        // Listing associé
        listing: conv.listing
          ? {
              id: conv.listing.id,
              title: conv.listing.title,
              city: conv.listing.city,
              country: conv.listing.country,
              imageUrl: conv.listing.images[0]?.url ?? null,
            }
          : null,
        // Réservation associée
        booking: conv.booking
          ? {
              id: conv.booking.id,
              startDate: conv.booking.startDate,
              endDate: conv.booking.endDate,
              status: conv.booking.status,
              totalPrice: conv.booking.totalPrice,
            }
          : null,
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
