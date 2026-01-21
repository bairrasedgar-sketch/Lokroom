// apps/web/src/app/api/admin/support/conversations/[id]/resolve/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/support/conversations/[id]/resolve → marquer comme résolu
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, name: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: params.id },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Vérifier que l'admin est assigné à cette conversation
  if (conversation.assignedAdminId !== user.id) {
    return NextResponse.json({ error: "Not assigned to you" }, { status: 403 });
  }

  // Mettre à jour le statut
  await prisma.supportConversation.update({
    where: { id: params.id },
    data: {
      status: "RESOLVED",
      closedAt: new Date(),
    },
  });

  // Ajouter un message système
  await prisma.supportMessage.create({
    data: {
      conversationId: params.id,
      content: `Cette conversation a été marquée comme résolue par ${user.name || "un agent"}.`,
      type: "SYSTEM",
    },
  });

  return NextResponse.json({ success: true });
}
