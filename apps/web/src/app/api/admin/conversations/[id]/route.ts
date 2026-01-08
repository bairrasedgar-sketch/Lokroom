/**
 * API Admin - Détail d'une conversation
 * GET /api/admin/conversations/[id] - Voir tous les messages d'une conversation
 * DELETE /api/admin/conversations/[id] - Supprimer une conversation
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
          },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            totalPrice: true,
            currency: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatarUrl: true } },
              },
            },
            MessageAttachment: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Erreur API admin conversation detail:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:ban");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, hostId: true, guestId: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la conversation (les messages seront supprimés en cascade)
    await prisma.conversation.delete({
      where: { id },
    });

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "CONVERSATION_DELETED",
      targetType: "Conversation",
      targetId: id,
      details: {
        hostId: conversation.hostId,
        guestId: conversation.guestId,
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression conversation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
