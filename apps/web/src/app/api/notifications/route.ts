import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseLimitParam, parsePageParam } from "@/lib/validation/params";
import { logger } from "@/lib/logger";


// GET /api/notifications - Get user notifications
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
    const limit = parseLimitParam(searchParams.get("limit"), 20, 100);
    const offset = parsePageParam(searchParams.get("offset"), 0);
    const unreadOnly = searchParams.get("unread") === "true";

    const where = {
      userId: session.user.id,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    });
  } catch (error) {
    // Note: Utiliser un logger approprié en production (Sentry, Winston, etc.)
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching notifications:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Validation Zod du body
    const { updateNotificationPreferencesSchema, validateRequestBody } = await import("@/lib/validations/api");
    const body = await request.json();

    // Si c'est une mise à jour de préférences, valider avec le schéma approprié
    if (body.notificationIds || body.markAllRead) {
      const { notificationIds, markAllRead } = body;

      if (markAllRead) {
        // Mark all notifications as read
        await prisma.notification.updateMany({
          where: {
            userId: session.user.id,
            read: false,
          },
          data: {
            read: true,
            readAt: new Date(),
          },
        });

        return NextResponse.json({ success: true, message: "Toutes les notifications marquées comme lues" });
      }

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: "notificationIds requis" },
          { status: 400 }
        );
      }

      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    logger.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ success: true, message: "Toutes les notifications supprimées" });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "id requis" },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
