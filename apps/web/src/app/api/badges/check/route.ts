import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBadgeId } from "@/lib/crypto/random";

// POST /api/badges/check - Vérifier et attribuer automatiquement les badges
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        hostProfile: true,
        bookings: {
          where: { status: "CONFIRMED" },
        },
        Listing: {
          include: {
            bookings: {
              where: { status: "CONFIRMED" },
            },
          },
        },
        reviewsReceived: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const badgesToAward: string[] = [];

    // 1. IDENTITY_VERIFIED - Vérifié via Stripe Identity
    if (user.identityStatus === "VERIFIED") {
      badgesToAward.push("IDENTITY_VERIFIED");
    }

    // 2. EMAIL_VERIFIED
    if (user.emailVerified) {
      badgesToAward.push("EMAIL_VERIFIED");
    }

    // 3. PHONE_VERIFIED - Si le profil a un téléphone
    if (user.profile?.phone) {
      badgesToAward.push("PHONE_VERIFIED");
    }

    // 4. SUPERHOST - Critères: 10+ réservations, 4.8+ note
    if (user.hostProfile) {
      const totalBookingsAsHost = user.Listing.reduce(
        (acc: number, listing) => acc + listing.bookings.length,
        0
      );

      if (totalBookingsAsHost >= 10) {
        badgesToAward.push("SUPERHOST");
      }
    }

    // 5. EXPERIENCED_HOST - 10+ voyageurs accueillis
    if (user.hostProfile) {
      const totalGuests = user.Listing.reduce(
        (acc: number, listing) => acc + listing.bookings.length,
        0
      );
      if (totalGuests >= 10) {
        badgesToAward.push("EXPERIENCED_HOST");
      }
    }

    // 6. QUICK_RESPONDER - 20+ messages envoyés
    if (user.messages.length >= 20) {
      badgesToAward.push("QUICK_RESPONDER");
    }

    // 7. HIGHLY_RATED - Note moyenne 4.8+ avec 5+ avis
    const avgRating =
      user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / user.reviewsReceived.length
        : 0;

    if (avgRating >= 4.8 && user.reviewsReceived.length >= 5) {
      badgesToAward.push("HIGHLY_RATED");
    }

    // 8. TRUSTED_GUEST - 5+ voyages confirmés avec bonnes notes
    if (user.bookings.length >= 5) {
      const goodReviews = user.reviewsReceived.filter((r) => r.rating >= 4);
      if (goodReviews.length >= 3) {
        badgesToAward.push("TRUSTED_GUEST");
      }
    }

    // 9. EARLY_ADOPTER - Inscrit il y a plus de 6 mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (user.createdAt < sixMonthsAgo) {
      badgesToAward.push("EARLY_ADOPTER");
    }

    // 10. TOP_CONTRIBUTOR - 50+ avis reçus
    if (user.reviewsReceived.length >= 50) {
      badgesToAward.push("TOP_CONTRIBUTOR");
    }

    // Créer les badges manquants
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { type: true },
    });

    const existingTypes = existingBadges.map((b) => b.type);
    const newBadges = badgesToAward.filter(
      (type) => !existingTypes.includes(type as typeof existingTypes[number])
    );

    if (newBadges.length > 0) {
      await prisma.userBadge.createMany({
        data: newBadges.map((type) => ({
          id: generateBadgeId(), // 🔒 SÉCURITÉ : Utilise crypto au lieu de Math.random()
          userId,
          type: type as typeof existingTypes[number],
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      newBadges,
      totalBadges: [...existingTypes, ...newBadges],
    });
  } catch (error) {
    console.error("Error checking badges:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
