/**
 * API Admin - Supprimer un message spécifique
 * DELETE /api/admin/conversations/[id]/messages/[messageId]
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const auth = await requireAdminPermission("users:ban");
  if ("error" in auth) return auth.error;

  try {
    const { id, messageId } = await params;

    // Vérifier que le message existe et appartient à cette conversation
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId: id,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le message
    await prisma.message.delete({
      where: { id: messageId },
    });

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "MESSAGE_DELETED",
      targetType: "Message",
      targetId: messageId,
      details: {
        conversationId: id,
        senderId: message.senderId,
        contentPreview: message.content.substring(0, 100),
        originalCreatedAt: message.createdAt,
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression message:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
