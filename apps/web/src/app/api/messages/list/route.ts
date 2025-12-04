import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId requis" },
        { status: 400 },
      );
    }

    // Vérifie que l'utilisateur fait bien partie de la conversation
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

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
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

    return NextResponse.json({ messages });
  } catch (e) {
    console.error("Erreur /api/messages/list:", e);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 },
    );
  }
}
