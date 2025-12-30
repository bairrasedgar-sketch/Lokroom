/**
 * API Kit Hôte Lok'Room
 * Gère l'éligibilité et la réclamation des kits de récompense
 *
 * Règles :
 * - Kit Essentiel : 5 réservations de 2h+ minimum (valeur 100€)
 * - Kit Super Hôte : 25 réservations de 2h+ minimum (valeur 250€)
 * - L'hôte doit CHOISIR : prendre le Kit Essentiel OU attendre le Kit Super Hôte
 * - Une fois un kit réclamé, l'autre n'est plus disponible
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Constantes du programme Kit Lokeur
const KIT_CONFIG = {
  ESSENTIAL: {
    minBookings: 5,
    minDurationHours: 2,
    displayValueCents: 10000, // 100€
    displayValue: "100€",
    name: "Kit Essentiel",
    description: "Boîte à clés sécurisée + Plaque Lok'Room + Kit d'accueil",
    items: [
      "🔐 Boîte à clés sécurisée avec code",
      "🏷️ Plaque officielle \"Espace Lok'Room\"",
      "📋 20 cartes d'accueil personnalisées",
      "🧹 Checklist ménage plastifiée",
      "✨ 5 stickers Lok'Room",
      "📱 QR Code personnalisé vers votre annonce",
    ],
  },
  SUPERHOST: {
    minBookings: 25,
    minDurationHours: 2,
    displayValueCents: 25000, // 250€
    displayValue: "250€",
    name: "Kit Super Hôte",
    description: "Tout le Kit Essentiel + Smart Lock + Produits premium",
    items: [
      "📦 Tout le Kit Essentiel inclus",
      "🔒 Smart Lock Bluetooth (codes temporaires)",
      "📸 Panneau photo \"Bienvenue chez [Votre nom]\"",
      "🎁 Kit produits d'accueil premium",
      "🏆 Badge Super Hôte physique",
      "📞 Ligne prioritaire support Lok'Room",
      "💎 Commission réduite à 12% (vs 15%)",
    ],
  },
};

// GET - Vérifier l'éligibilité de l'hôte
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Vérifier si l'utilisateur est un hôte
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hostProfile: true,
        hostKit: true,
      },
    });

    if (!user || (user.role !== "HOST" && user.role !== "BOTH")) {
      return NextResponse.json(
        { error: "Vous devez être hôte pour accéder au programme Kit Lokeur" },
        { status: 403 }
      );
    }

    // Compter les réservations qualifiées (confirmées, 2h+ minimum)
    // Filtrer les réservations horaires de moins de 2h
    // (On doit faire une requête séparée car Prisma ne peut pas calculer la différence)
    const hourlyBookings = await prisma.booking.findMany({
      where: {
        listing: { ownerId: userId },
        status: "CONFIRMED",
        pricingMode: "HOURLY",
        startTimeMinutes: { not: null },
        endTimeMinutes: { not: null },
      },
      select: {
        startTimeMinutes: true,
        endTimeMinutes: true,
      },
    });

    // Compter les réservations horaires qualifiées (2h+)
    const qualifiedHourlyCount = hourlyBookings.filter((b) => {
      const duration = (b.endTimeMinutes || 0) - (b.startTimeMinutes || 0);
      return duration >= 120; // 2 heures = 120 minutes
    }).length;

    // Compter les réservations journalières
    const dailyCount = await prisma.booking.count({
      where: {
        listing: { ownerId: userId },
        status: "CONFIRMED",
        pricingMode: { in: ["DAILY", "BOTH"] },
      },
    });

    const totalQualifyingBookings = dailyCount + qualifiedHourlyCount;

    // Déterminer le statut d'éligibilité
    const hasClaimedKit = !!user.hostKit;
    const claimedKitType = user.hostKit?.kitType;

    // Calculer les progressions
    const essentialProgress = Math.min(
      (totalQualifyingBookings / KIT_CONFIG.ESSENTIAL.minBookings) * 100,
      100
    );
    const superhostProgress = Math.min(
      (totalQualifyingBookings / KIT_CONFIG.SUPERHOST.minBookings) * 100,
      100
    );

    const canClaimEssential =
      !hasClaimedKit && totalQualifyingBookings >= KIT_CONFIG.ESSENTIAL.minBookings;
    const canClaimSuperhost =
      !hasClaimedKit && totalQualifyingBookings >= KIT_CONFIG.SUPERHOST.minBookings;

    // Construire la réponse
    const response = {
      // Stats de l'hôte
      totalQualifyingBookings,

      // Statut du kit
      hasClaimedKit,
      claimedKit: user.hostKit
        ? {
            type: user.hostKit.kitType,
            status: user.hostKit.status,
            claimedAt: user.hostKit.claimedAt,
            shippedAt: user.hostKit.shippedAt,
            deliveredAt: user.hostKit.deliveredAt,
            trackingNumber: user.hostKit.trackingNumber,
            config: KIT_CONFIG[user.hostKit.kitType as keyof typeof KIT_CONFIG],
          }
        : null,

      // Options disponibles
      kits: {
        essential: {
          ...KIT_CONFIG.ESSENTIAL,
          canClaim: canClaimEssential,
          progress: essentialProgress,
          bookingsNeeded: Math.max(0, KIT_CONFIG.ESSENTIAL.minBookings - totalQualifyingBookings),
          locked: hasClaimedKit && claimedKitType !== "ESSENTIAL",
          lockedReason: hasClaimedKit
            ? "Vous avez déjà réclamé un kit"
            : null,
        },
        superhost: {
          ...KIT_CONFIG.SUPERHOST,
          canClaim: canClaimSuperhost,
          progress: superhostProgress,
          bookingsNeeded: Math.max(0, KIT_CONFIG.SUPERHOST.minBookings - totalQualifyingBookings),
          locked: hasClaimedKit && claimedKitType !== "SUPERHOST",
          lockedReason: hasClaimedKit
            ? "Vous avez déjà réclamé un kit"
            : canClaimEssential && !canClaimSuperhost
            ? "Choisissez le Kit Essentiel maintenant ou attendez le Kit Super Hôte"
            : null,
        },
      },

      // Message d'aide pour la décision
      decisionHelper: !hasClaimedKit && canClaimEssential && !canClaimSuperhost
        ? {
            message: "Vous pouvez réclamer le Kit Essentiel maintenant, mais vous perdrez l'accès au Kit Super Hôte. Voulez-vous attendre ?",
            bookingsUntilSuperhost: KIT_CONFIG.SUPERHOST.minBookings - totalQualifyingBookings,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API host/kit GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Réclamer un kit
const claimSchema = z.object({
  kitType: z.enum(["ESSENTIAL", "SUPERHOST"]),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Valider les données
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { kitType, shippingAddress } = parsed.data;

    // Vérifier si l'utilisateur est un hôte
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hostProfile: true,
        hostKit: true,
      },
    });

    if (!user || (user.role !== "HOST" && user.role !== "BOTH")) {
      return NextResponse.json(
        { error: "Vous devez être hôte pour réclamer un kit" },
        { status: 403 }
      );
    }

    // Vérifier si l'hôte a déjà un kit
    if (user.hostKit) {
      return NextResponse.json(
        { error: "Vous avez déjà réclamé un kit. Un seul kit par hôte." },
        { status: 400 }
      );
    }

    // Compter les réservations qualifiées
    const hourlyBookings = await prisma.booking.findMany({
      where: {
        listing: { ownerId: userId },
        status: "CONFIRMED",
        pricingMode: "HOURLY",
        startTimeMinutes: { not: null },
        endTimeMinutes: { not: null },
      },
      select: {
        startTimeMinutes: true,
        endTimeMinutes: true,
      },
    });

    const qualifiedHourlyCount = hourlyBookings.filter((b) => {
      const duration = (b.endTimeMinutes || 0) - (b.startTimeMinutes || 0);
      return duration >= 120;
    }).length;

    const dailyCount = await prisma.booking.count({
      where: {
        listing: { ownerId: userId },
        status: "CONFIRMED",
        pricingMode: { in: ["DAILY", "BOTH"] },
      },
    });

    const totalQualifyingBookings = dailyCount + qualifiedHourlyCount;

    // Vérifier l'éligibilité selon le type de kit
    const kitConfig = KIT_CONFIG[kitType];
    if (totalQualifyingBookings < kitConfig.minBookings) {
      return NextResponse.json(
        {
          error: `Vous avez besoin de ${kitConfig.minBookings} réservations qualifiées pour le ${kitConfig.name}. Vous en avez ${totalQualifyingBookings}.`,
        },
        { status: 400 }
      );
    }

    // Créer le kit
    const hostKit = await prisma.hostKit.create({
      data: {
        hostId: userId,
        kitType,
        displayValueCents: kitConfig.displayValueCents,
        qualifyingBookings: totalQualifyingBookings,
        qualifiedAt: new Date(),
        shippingAddress,
        status: "PENDING",
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM_ANNOUNCEMENT",
        title: `🎁 ${kitConfig.name} réclamé !`,
        message: `Félicitations ! Votre ${kitConfig.name} (valeur ${kitConfig.displayValue}) sera expédié sous 7 jours ouvrés.`,
        data: { kitId: hostKit.id, kitType },
        actionUrl: "/host/kit",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Votre ${kitConfig.name} a été réclamé avec succès !`,
      kit: {
        id: hostKit.id,
        type: hostKit.kitType,
        status: hostKit.status,
        estimatedDelivery: "7-10 jours ouvrés",
        config: kitConfig,
      },
    });
  } catch (error) {
    console.error("Erreur API host/kit POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
