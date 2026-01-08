// apps/web/src/app/api/host/listings/[id]/instant-book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { upsertInstantBookSettings, getInstantBookSettings } from "@/lib/instant-book";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/listings/[id]/instant-book
 *
 * Récupère les paramètres instant book d'une annonce.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const listingId = params.id;

  // Vérifier que l'utilisateur est le propriétaire
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      isInstantBook: true,
      ownerId: true,
      owner: { select: { email: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }

  if (listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Récupérer les settings
  const settings = await getInstantBookSettings(listingId);

  // Récupérer les statistiques des réservations instantanées
  const stats = await prisma.booking.aggregate({
    where: {
      listingId,
      status: "CONFIRMED",
      // On considère qu'une réservation est "instantanée" si elle a été créée
      // quand isInstantBook était activé (approximation)
    },
    _count: true,
  });

  // Récupérer les dernières réservations
  const recentBookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: "CONFIRMED",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      totalPrice: true,
      currency: true,
      createdAt: true,
      guest: {
        select: {
          id: true,
          name: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({
    listing: {
      id: listing.id,
      title: listing.title,
      isInstantBook: listing.isInstantBook,
    },
    settings: settings ?? {
      requireVerifiedId: false,
      requirePositiveReviews: false,
      minGuestRating: null,
      requireProfilePhoto: false,
      requirePhoneVerified: false,
      maxNights: null,
      minNights: null,
      advanceNoticeHours: 24,
      autoMessage: null,
    },
    stats: {
      totalConfirmedBookings: stats._count,
    },
    recentBookings,
  });
}

/**
 * PUT /api/host/listings/[id]/instant-book
 *
 * Met à jour les paramètres instant book d'une annonce.
 *
 * Body JSON:
 * {
 *   "enabled": boolean,                    // Activer/désactiver instant book
 *   "requireVerifiedId": boolean,          // Exiger identité vérifiée
 *   "requirePositiveReviews": boolean,     // Exiger avis positifs
 *   "minGuestRating": number | null,       // Note minimum du guest
 *   "requireProfilePhoto": boolean,        // Exiger photo de profil
 *   "requirePhoneVerified": boolean,       // Exiger téléphone vérifié
 *   "maxNights": number | null,            // Nombre max de nuits
 *   "minNights": number | null,            // Nombre min de nuits
 *   "advanceNoticeHours": number,          // Préavis minimum en heures
 *   "autoMessage": string | null           // Message automatique
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const listingId = params.id;

  // Vérifier que l'utilisateur est le propriétaire
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      owner: { select: { email: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }

  if (listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Parser le body
  let body: {
    enabled?: boolean;
    requireVerifiedId?: boolean;
    requirePositiveReviews?: boolean;
    minGuestRating?: number | null;
    requireProfilePhoto?: boolean;
    requirePhoneVerified?: boolean;
    maxNights?: number | null;
    minNights?: number | null;
    advanceNoticeHours?: number;
    autoMessage?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const {
    enabled,
    requireVerifiedId,
    requirePositiveReviews,
    minGuestRating,
    requireProfilePhoto,
    requirePhoneVerified,
    maxNights,
    minNights,
    advanceNoticeHours,
    autoMessage,
  } = body;

  // Validation
  if (minGuestRating !== undefined && minGuestRating !== null) {
    if (minGuestRating < 1 || minGuestRating > 5) {
      return NextResponse.json(
        { error: "INVALID_MIN_RATING", message: "La note minimum doit être entre 1 et 5" },
        { status: 400 }
      );
    }
  }

  if (advanceNoticeHours !== undefined && advanceNoticeHours < 0) {
    return NextResponse.json(
      { error: "INVALID_ADVANCE_NOTICE", message: "Le préavis ne peut pas être négatif" },
      { status: 400 }
    );
  }

  if (minNights !== undefined && minNights !== null && minNights < 1) {
    return NextResponse.json(
      { error: "INVALID_MIN_NIGHTS", message: "Le minimum de nuits doit être au moins 1" },
      { status: 400 }
    );
  }

  if (maxNights !== undefined && maxNights !== null && maxNights < 1) {
    return NextResponse.json(
      { error: "INVALID_MAX_NIGHTS", message: "Le maximum de nuits doit être au moins 1" },
      { status: 400 }
    );
  }

  if (
    minNights !== undefined &&
    maxNights !== undefined &&
    minNights !== null &&
    maxNights !== null &&
    minNights > maxNights
  ) {
    return NextResponse.json(
      { error: "INVALID_NIGHTS_RANGE", message: "Le minimum de nuits ne peut pas dépasser le maximum" },
      { status: 400 }
    );
  }

  // Mettre à jour isInstantBook sur le listing si enabled est fourni
  if (enabled !== undefined) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { isInstantBook: enabled },
    });
  }

  // Mettre à jour ou créer les settings
  const settingsData: Parameters<typeof upsertInstantBookSettings>[1] = {};

  if (requireVerifiedId !== undefined) settingsData.requireVerifiedId = requireVerifiedId;
  if (requirePositiveReviews !== undefined) settingsData.requirePositiveReviews = requirePositiveReviews;
  if (minGuestRating !== undefined) settingsData.minGuestRating = minGuestRating;
  if (requireProfilePhoto !== undefined) settingsData.requireProfilePhoto = requireProfilePhoto;
  if (requirePhoneVerified !== undefined) settingsData.requirePhoneVerified = requirePhoneVerified;
  if (maxNights !== undefined) settingsData.maxNights = maxNights;
  if (minNights !== undefined) settingsData.minNights = minNights;
  if (advanceNoticeHours !== undefined) settingsData.advanceNoticeHours = advanceNoticeHours;
  if (autoMessage !== undefined) settingsData.autoMessage = autoMessage;

  // Seulement upsert si on a des données à mettre à jour
  let settings = null;
  if (Object.keys(settingsData).length > 0) {
    settings = await upsertInstantBookSettings(listingId, settingsData);
  } else {
    settings = await getInstantBookSettings(listingId);
  }

  // Récupérer le listing mis à jour
  const updatedListing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      isInstantBook: true,
    },
  });

  return NextResponse.json({
    success: true,
    listing: updatedListing,
    settings,
  });
}

/**
 * DELETE /api/host/listings/[id]/instant-book
 *
 * Désactive instant book et supprime les settings.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const listingId = params.id;

  // Vérifier que l'utilisateur est le propriétaire
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      owner: { select: { email: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }

  if (listing.owner.email !== session.user.email) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Désactiver instant book
  await prisma.listing.update({
    where: { id: listingId },
    data: { isInstantBook: false },
  });

  // Supprimer les settings (optionnel, on peut les garder pour réactivation future)
  // await prisma.instantBookSettings.delete({ where: { listingId } }).catch(() => {});

  return NextResponse.json({
    success: true,
    message: "Réservation instantanée désactivée",
  });
}
