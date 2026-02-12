/**
 * API Admin - Supprimer une notification admin
 * DELETE /api/admin/notifications/[id]
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:ban");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    // Vérifier que la notification existe
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        userId: true,
        createdAt: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id },
    });

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "NOTIFICATION_DELETED",
      targetType: "Notification",
      targetId: id,
      details: {
        type: notification.type,
        title: notification.title,
        userId: notification.userId,
        originalCreatedAt: notification.createdAt,
      },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur suppression notification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Supprimer plusieurs notifications en masse (par titre par exemple)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:ban");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    // id peut être "bulk" pour suppression en masse
    if (id !== "bulk") {
      return NextResponse.json(
        { error: "Utilisez DELETE pour supprimer une notification unique" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, message } = body;

    if (!title && !message) {
      return NextResponse.json(
        { error: "Titre ou message requis pour la suppression en masse" },
        { status: 400 }
      );
    }

    // Construire le filtre
    const where: Record<string, unknown> = {
      type: "SYSTEM_ANNOUNCEMENT",
    };
    if (title) where.title = title;
    if (message) where.message = message;

    // Compter avant suppression
    const count = await prisma.notification.count({ where });

    // Supprimer
    await prisma.notification.deleteMany({ where });

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "NOTIFICATIONS_BULK_DELETED",
      targetType: "Notification",
      targetId: `bulk-${Date.now()}`,
      details: {
        title,
        message,
        deletedCount: count,
      },
      request,
    });

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    logger.error("Erreur suppression notifications en masse:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
