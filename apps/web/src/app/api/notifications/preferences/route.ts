import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const preferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  preferences: z.record(z.boolean()).optional(),
  doNotDisturbStart: z.string().optional(),
  doNotDisturbEnd: z.string().optional(),
  timezone: z.string().optional(),
});

// GET /api/notifications/preferences - Obtenir les préférences de notification
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Créer des préférences par défaut si elles n'existent pas
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
          preferences: {
            bookingRequest: true,
            bookingConfirmed: true,
            bookingCancelled: true,
            bookingReminder: true,
            messageNew: true,
            reviewReceived: true,
            reviewReminder: true,
            payoutSent: true,
            listingApproved: true,
            listingRejected: true,
            disputeOpened: true,
            marketing: false,
          },
          timezone: "Europe/Paris",
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Mettre à jour les préférences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validation = preferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mettre à jour ou créer les préférences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
        ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
        ...(data.smsEnabled !== undefined && { smsEnabled: data.smsEnabled }),
        ...(data.preferences && { preferences: data.preferences }),
        ...(data.doNotDisturbStart && { doNotDisturbStart: data.doNotDisturbStart }),
        ...(data.doNotDisturbEnd && { doNotDisturbEnd: data.doNotDisturbEnd }),
        ...(data.timezone && { timezone: data.timezone }),
      },
      create: {
        id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        emailEnabled: data.emailEnabled ?? true,
        pushEnabled: data.pushEnabled ?? true,
        smsEnabled: data.smsEnabled ?? false,
        preferences: data.preferences ?? {},
        doNotDisturbStart: data.doNotDisturbStart,
        doNotDisturbEnd: data.doNotDisturbEnd,
        timezone: data.timezone ?? "Europe/Paris",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Préférences mises à jour",
      preferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des préférences" },
      { status: 500 }
    );
  }
}
