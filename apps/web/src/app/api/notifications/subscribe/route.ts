import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";


const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

// POST /api/notifications/subscribe - Enregistrer un abonnement push
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { endpoint, keys, userAgent } = validation.data;

    // Vérifier si l'abonnement existe déjà
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      const updated = await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Abonnement mis à jour",
        subscription: updated,
      });
    }

    // Créer un nouvel abonnement
    const subscription = await prisma.pushSubscription.create({
      data: {
        id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement créé",
      subscription,
    });
  } catch (error) {
    logger.error("Error subscribing to push notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'abonnement aux notifications" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/subscribe - Supprimer un abonnement push
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "endpoint requis" },
        { status: 400 }
      );
    }

    // Supprimer l'abonnement
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement supprimé",
    });
  } catch (error) {
    logger.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la désinscription" },
      { status: 500 }
    );
  }
}

// GET /api/notifications/subscribe - Obtenir les abonnements de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    logger.error("Error fetching push subscriptions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des abonnements" },
      { status: 500 }
    );
  }
}
