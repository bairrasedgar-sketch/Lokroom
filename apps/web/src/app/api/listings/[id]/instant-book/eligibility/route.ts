// apps/web/src/app/api/listings/[id]/instant-book/eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkInstantBookEligibility } from "@/lib/instant-book";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/[id]/instant-book/eligibility
 *
 * Vérifie si l'utilisateur connecté peut réserver instantanément cette annonce.
 *
 * Query params optionnels:
 * - startDate: Date de début (ISO string)
 * - endDate: Date de fin (ISO string)
 *
 * Retourne:
 * {
 *   eligible: boolean,
 *   reasons: string[],
 *   criteria: { ... },
 *   listing: { isInstantBook: boolean, ... }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = params.id;

    // Récupérer l'annonce
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        isInstantBook: true,
        instantBookSettings: {
          select: {
            requireVerifiedId: true,
            requirePositiveReviews: true,
            minGuestRating: true,
            requireProfilePhoto: true,
            requirePhoneVerified: true,
            maxNights: true,
            minNights: true,
            advanceNoticeHours: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "LISTING_NOT_FOUND" },
        { status: 404 }
      );
  }

  // Si l'annonce n'a pas instant book activé
  if (!listing.isInstantBook) {
    return NextResponse.json({
      eligible: false,
      reasons: ["Cette annonce n'accepte pas les réservations instantanées"],
      criteria: null,
      listing: {
        id: listing.id,
        title: listing.title,
        isInstantBook: false,
        settings: null,
      },
    });
  }

  // Vérifier si l'utilisateur est connecté
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    // Retourner les infos de l'annonce sans vérifier l'éligibilité
    return NextResponse.json({
      eligible: null, // null = non connecté, impossible de vérifier
      reasons: ["Connectez-vous pour vérifier votre éligibilité"],
      criteria: null,
      listing: {
        id: listing.id,
        title: listing.title,
        isInstantBook: true,
        settings: listing.instantBookSettings,
      },
    });
  }

  // Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "USER_NOT_FOUND" },
      { status: 404 }
    );
  }

  // Récupérer les dates si fournies
  const searchParams = req.nextUrl.searchParams;
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  // Vérifier l'éligibilité
  const eligibility = await checkInstantBookEligibility(
    user.id,
    listingId,
    startDate,
    endDate
  );

  return NextResponse.json({
    ...eligibility,
    listing: {
      id: listing.id,
      title: listing.title,
      isInstantBook: true,
      settings: listing.instantBookSettings,
    },
  });
  } catch (error) {
    logger.error("Failed to check instant book eligibility", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "ELIGIBILITY_CHECK_FAILED",
        message: "Failed to check instant book eligibility. Please try again."
      },
      { status: 500 }
    );
  }
}
