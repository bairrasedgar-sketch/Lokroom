import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  sendPushNotificationToMultiple,
  createNotificationPayload,
  type PushSubscriptionData,
} from "@/lib/notifications/push";

const sendNotificationSchema = z.object({
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  type: z.string(),
  data: z.record(z.any()),
});

// POST /api/notifications/send - Envoyer une notification push
// Cette route est réservée aux admins ou aux processus internes
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier que l'utilisateur est admin ou que la requête vient d'un processus interne
    const isAdmin = session?.user?.id && session?.user?.role === "ADMIN";
    const internalApiKey = request.headers.get("x-internal-api-key");
    const isInternal = internalApiKey === process.env.INTERNAL_API_KEY;

    if (!isAdmin && !isInternal) {
      return NextResponse.json(
        { error: "Non autorisé - Admin uniquement" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = sendNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, userIds, type, data } = validation.data;

    // Déterminer les utilisateurs cibles
    let targetUserIds: string[] = [];
    if (userId) {
      targetUserIds = [userId];
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return NextResponse.json(
        { error: "userId ou userIds requis" },
        { status: 400 }
      );
    }

    // Récupérer les abonnements push des utilisateurs
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: targetUserIds },
      },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun abonnement trouvé",
        sent: 0,
      });
    }

    // Vérifier les préférences de notification des utilisateurs
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: targetUserIds },
      },
    });

    // Filtrer les utilisateurs qui ont désactivé les notifications push
    const enabledUserIds = new Set(
      preferences
        .filter(pref => pref.pushEnabled)
        .map(pref => pref.userId)
    );

    // Si aucune préférence n'existe, considérer que les notifications sont activées par défaut
    targetUserIds.forEach(id => {
      if (!preferences.find(pref => pref.userId === id)) {
        enabledUserIds.add(id);
      }
    });

    const enabledSubscriptions = subscriptions.filter(sub =>
      enabledUserIds.has(sub.userId)
    );

    if (enabledSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Notifications push désactivées pour tous les utilisateurs",
        sent: 0,
      });
    }

    // Créer le payload de notification
    const payload = createNotificationPayload(type, data);

    // Envoyer les notifications
    const pushSubscriptions: PushSubscriptionData[] = enabledSubscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    const result = await sendPushNotificationToMultiple(pushSubscriptions, payload);

    // Supprimer les abonnements invalides
    if (result.invalidSubscriptions.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: { in: result.invalidSubscriptions },
        },
      });
    }

    // Créer les notifications en base de données
    await prisma.notification.createMany({
      data: targetUserIds.map(userId => ({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: type as any,
        title: payload.title,
        message: payload.body,
        data: payload.data || {},
        actionUrl: payload.data?.url,
      })),
    });

    return NextResponse.json({
      success: true,
      message: "Notifications envoyées",
      sent: result.success,
      failed: result.failed,
      invalidSubscriptions: result.invalidSubscriptions.length,
    });
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications" },
      { status: 500 }
    );
  }
}
