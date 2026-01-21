// apps/web/src/app/api/support/reset/route.ts
// Ferme la conversation support actuelle pour permettre d'en démarrer une nouvelle
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/support/reset → ferme la conversation actuelle
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Trouver la conversation active
  const conversation = await prisma.supportConversation.findFirst({
    where: {
      userId: user.id,
      status: { notIn: ["CLOSED"] },
    },
  });

  if (!conversation) {
    return NextResponse.json({ message: "No active conversation" });
  }

  // Fermer la conversation
  await prisma.supportConversation.update({
    where: { id: conversation.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  // Ajouter un message système
  await prisma.supportMessage.create({
    data: {
      conversationId: conversation.id,
      content: "Conversation fermée par l'utilisateur.",
      type: "SYSTEM",
    },
  });

  return NextResponse.json({ success: true, message: "Conversation closed" });
}
