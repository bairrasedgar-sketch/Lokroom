// apps/web/src/app/api/support/messages/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST /api/support/messages → envoyer un message dans une conversation support
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { conversationId, content } = body as {
      conversationId: string;
      content: string;
    };

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: "Missing conversationId or content" }, { status: 400 });
    }

    // Vérifier que la conversation existe et que l'utilisateur y a accès
    const conversation = await prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        assignedAdmin: { select: { id: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Vérifier les droits d'accès
    const isOwner = conversation.userId === user.id;
    const isAssignedAdmin = conversation.assignedAdminId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAssignedAdmin && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Déterminer le type de message
    let messageType: "USER" | "ADMIN" = "USER";
    if (isAdmin && !isOwner) {
      messageType = "ADMIN";
    }

    // Créer le message
    const message = await prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        type: messageType,
        readByUser: messageType === "USER",
        readByAdmin: messageType === "ADMIN",
      },
    });

    // Mettre à jour la conversation
    await prisma.supportConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
}

// PATCH /api/support/messages → marquer les messages comme lus
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { conversationId } = body as { conversationId: string };

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // Vérifier que la conversation existe
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isOwner = conversation.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Marquer les messages comme lus
  if (isOwner) {
    await prisma.supportMessage.updateMany({
      where: {
        conversationId,
        readByUser: false,
        type: { in: ["ADMIN", "SYSTEM"] },
      },
      data: {
        readByUser: true,
        readByUserAt: new Date(),
      },
    });
  }

  if (isAdmin) {
    await prisma.supportMessage.updateMany({
      where: {
        conversationId,
        readByAdmin: false,
        type: "USER",
      },
      data: {
        readByAdmin: true,
        readByAdminAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to send support message", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "MESSAGE_SEND_FAILED",
        message: "Failed to send message. Please try again."
      },
      { status: 500 }
    );
  }
}
