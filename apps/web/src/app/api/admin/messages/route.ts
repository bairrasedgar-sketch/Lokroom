/**
 * API Admin - Messaging admin vers utilisateurs
 * GET /api/admin/messages - Historique des messages admin
 * POST /api/admin/messages - Envoyer un message à un ou plusieurs utilisateurs
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type"); // notification, email, announcement

  try {
    const skip = (page - 1) * limit;

    // Get admin-sent notifications (as message history)
    const where: Record<string, unknown> = {
      type: { in: ["SYSTEM_ANNOUNCEMENT", "PROMO_CODE"] },
    };

    const [notifications, totalCount, stats] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      // Stats
      Promise.all([
        prisma.notification.count({
          where: { type: "SYSTEM_ANNOUNCEMENT" },
        }),
        prisma.notification.count({
          where: {
            type: "SYSTEM_ANNOUNCEMENT",
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.notification.count({
          where: { type: "SYSTEM_ANNOUNCEMENT", read: true },
        }),
        prisma.user.count(),
      ]),
    ]);

    // Group notifications by title to show broadcasts
    const broadcasts = new Map<string, {
      title: string;
      message: string;
      createdAt: Date;
      recipients: number;
      readCount: number;
    }>();

    notifications.forEach((n) => {
      const key = `${n.title}-${n.message}`;
      if (!broadcasts.has(key)) {
        broadcasts.set(key, {
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          recipients: 0,
          readCount: 0,
        });
      }
      const b = broadcasts.get(key)!;
      b.recipients++;
      if (n.read) b.readCount++;
    });

    return NextResponse.json({
      messages: notifications,
      broadcasts: Array.from(broadcasts.values()).slice(0, 10),
      stats: {
        totalSent: stats[0],
        thisWeek: stats[1],
        readCount: stats[2],
        totalUsers: stats[3],
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Erreur API admin messages:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("users:ban"); // High permission required
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const {
      type, // single, role, all
      userId,
      role,
      title,
      message,
      actionUrl,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Titre et message requis" },
        { status: 400 }
      );
    }

    let targetUsers: { id: string; email: string; name: string | null }[] = [];

    switch (type) {
      case "single": {
        if (!userId) {
          return NextResponse.json(
            { error: "userId requis pour message individuel" },
            { status: 400 }
          );
        }
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true },
        });
        if (!user) {
          return NextResponse.json(
            { error: "Utilisateur non trouvé" },
            { status: 404 }
          );
        }
        targetUsers = [user];
        break;
      }

      case "role": {
        if (!role) {
          return NextResponse.json(
            { error: "role requis pour message par rôle" },
            { status: 400 }
          );
        }
        targetUsers = await prisma.user.findMany({
          where: { role: role as "HOST" | "GUEST" | "BOTH" | "ADMIN" },
          select: { id: true, email: true, name: true },
        });
        break;
      }

      case "hosts": {
        // Users with at least one listing
        targetUsers = await prisma.user.findMany({
          where: {
            Listing: { some: {} },
          },
          select: { id: true, email: true, name: true },
        });
        break;
      }

      case "guests": {
        // Users with at least one booking
        targetUsers = await prisma.user.findMany({
          where: {
            bookings: { some: {} },
          },
          select: { id: true, email: true, name: true },
        });
        break;
      }

      case "verified": {
        // Only verified users
        targetUsers = await prisma.user.findMany({
          where: { identityStatus: "VERIFIED" },
          select: { id: true, email: true, name: true },
        });
        break;
      }

      case "all": {
        targetUsers = await prisma.user.findMany({
          where: { role: { not: "ADMIN" } }, // Exclude admins
          select: { id: true, email: true, name: true },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "Type de message invalide" },
          { status: 400 }
        );
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "Aucun destinataire trouvé" },
        { status: 400 }
      );
    }

    // Create notifications in batch
    const notifications = await prisma.notification.createMany({
      data: targetUsers.map((user) => ({
        userId: user.id,
        type: "SYSTEM_ANNOUNCEMENT" as const,
        title,
        message,
        actionUrl: actionUrl || null,
      })),
    });

    // Log action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "ANNOUNCEMENT_SENT",
      targetType: "Notification",
      targetId: `broadcast-${Date.now()}`,
      details: {
        type,
        title,
        recipientCount: targetUsers.length,
        role: role || null,
        userId: userId || null,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      sent: notifications.count,
      recipients: targetUsers.length,
    });
  } catch (error) {
    console.error("Erreur envoi message admin:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
