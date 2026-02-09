// apps/web/src/app/api/reviews/route.ts
// API complète pour les avis niveau Airbnb
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paginationSchema, validateSearchParams } from "@/lib/validations/api";

export const dynamic = "force-dynamic";

const REVIEW_WINDOW_DAYS = 14; // Délai pour laisser un avis après la réservation

// GET /api/reviews?listingId=XXX ou ?userId=XXX ou ?bookingId=XXX
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId");
  const userId = req.nextUrl.searchParams.get("userId");
  const bookingId = req.nextUrl.searchParams.get("bookingId");
  const type = req.nextUrl.searchParams.get("type"); // GUEST_TO_HOST ou HOST_TO_GUEST

  // Validation de la pagination
  const validation = validateSearchParams(req.nextUrl.searchParams, paginationSchema);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { page = 1, limit = 20 } = validation.data;

  // Construire le filtre
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (listingId) {
    where.listingId = listingId;
    where.type = "GUEST_TO_HOST"; // Seuls les avis de voyageurs sur les annonces
  } else if (userId) {
    where.targetUserId = userId;
    if (type) where.type = type;
  } else if (bookingId) {
    where.bookingId = bookingId;
  } else {
    return NextResponse.json(
      { error: "listingId, userId or bookingId required" },
      { status: 400 }
    );
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        response: true,
        responseAt: true,
        type: true,
        ratingCleanliness: true,
        ratingAccuracy: true,
        ratingCommunication: true,
        ratingLocation: true,
        ratingCheckin: true,
        ratingValue: true,
        ratingRespect: true,
        ratingTidiness: true,
        highlights: true,
        wouldRecommend: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
          },
        },
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
          },
          orderBy: { position: "asc" },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  // Calculer les statistiques si c'est pour une annonce
  let stats = null;
  if (listingId) {
    const allReviews = await prisma.review.findMany({
      where: { listingId, status: "PUBLISHED", type: "GUEST_TO_HOST" },
      select: {
        rating: true,
        ratingCleanliness: true,
        ratingAccuracy: true,
        ratingCommunication: true,
        ratingLocation: true,
        ratingCheckin: true,
        ratingValue: true,
      },
    });

    if (allReviews.length > 0) {
      const avg = (arr: (number | null)[]) => {
        const valid = arr.filter((n): n is number => n !== null);
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      };

      stats = {
        totalReviews: allReviews.length,
        averageRating: avg(allReviews.map((r) => r.rating)),
        averageCleanliness: avg(allReviews.map((r) => r.ratingCleanliness)),
        averageAccuracy: avg(allReviews.map((r) => r.ratingAccuracy)),
        averageCommunication: avg(allReviews.map((r) => r.ratingCommunication)),
        averageLocation: avg(allReviews.map((r) => r.ratingLocation)),
        averageCheckin: avg(allReviews.map((r) => r.ratingCheckin)),
        averageValue: avg(allReviews.map((r) => r.ratingValue)),
        // Distribution des notes
        distribution: {
          5: allReviews.filter((r) => r.rating === 5).length,
          4: allReviews.filter((r) => r.rating === 4).length,
          3: allReviews.filter((r) => r.rating === 3).length,
          2: allReviews.filter((r) => r.rating === 2).length,
          1: allReviews.filter((r) => r.rating === 1).length,
        },
      };
    }
  }

  return NextResponse.json({
    reviews,
    stats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/reviews - Créer un avis
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  // Validation Zod du body
  const { createReviewSchema, validateRequestBody } = await import("@/lib/validations/api");
  const validation = await validateRequestBody(req, createReviewSchema);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const {
    bookingId,
    rating,
    comment,
    ratingCleanliness,
    ratingAccuracy,
    ratingCommunication,
    ratingLocation,
    ratingCheckin,
    ratingValue,
    ratingRespect,
    ratingTidiness,
    highlights,
    wouldRecommend,
  } = validation.data;

  // Récupérer la réservation
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          ownerId: true,
          title: true,
        },
      },
      guest: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
  }

  const isGuest = booking.guestId === me.id;
  const isHost = booking.listing.ownerId === me.id;

  if (!isGuest && !isHost) {
    return NextResponse.json(
      { error: "forbidden_not_part_of_booking" },
      { status: 403 }
    );
  }

  // Vérifier que la réservation est terminée
  const now = new Date();
  if (booking.endDate > now) {
    return NextResponse.json(
      { error: "booking_not_finished_yet" },
      { status: 400 }
    );
  }

  // Vérifier le délai de 14 jours
  const daysSinceEnd = Math.floor(
    (now.getTime() - booking.endDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceEnd > REVIEW_WINDOW_DAYS) {
    return NextResponse.json(
      { error: "review_window_expired" },
      { status: 400 }
    );
  }

  // Vérifier qu'un avis n'existe pas déjà
  const existingReview = await prisma.review.findUnique({
    where: {
      bookingId_authorId: {
        bookingId: booking.id,
        authorId: me.id,
      },
    },
  });

  if (existingReview) {
    return NextResponse.json(
      { error: "review_already_exists" },
      { status: 400 }
    );
  }

  // Déterminer le type d'avis et la cible
  const reviewType = isGuest ? "GUEST_TO_HOST" : "HOST_TO_GUEST";
  const targetUserId = isGuest ? booking.listing.ownerId : booking.guestId;

  // Construire les sous-notes selon le type
  const subRatings: Record<string, number | null> = {};

  if (isGuest) {
    // Sous-notes pour les voyageurs
    subRatings.ratingCleanliness = ratingCleanliness ?? null;
    subRatings.ratingAccuracy = ratingAccuracy ?? null;
    subRatings.ratingCommunication = ratingCommunication ?? null;
    subRatings.ratingLocation = ratingLocation ?? null;
    subRatings.ratingCheckin = ratingCheckin ?? null;
    subRatings.ratingValue = ratingValue ?? null;
  } else {
    // Sous-notes pour les hôtes
    subRatings.ratingRespect = ratingRespect ?? null;
    subRatings.ratingTidiness = ratingTidiness ?? null;
    subRatings.ratingCommunication = ratingCommunication ?? null;
  }

  // Créer l'avis dans une transaction
  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        authorId: me.id,
        targetUserId,
        rating,
        comment: comment ?? null,
        type: reviewType,
        status: "PUBLISHED",
        highlights: highlights ?? [],
        wouldRecommend: wouldRecommend ?? true,
        ...subRatings,
      },
    });

    // Recalculer les stats du user ciblé
    const agg = await tx.review.aggregate({
      where: { targetUserId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.userProfile.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating ?? 0,
      },
      update: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating ?? 0,
      },
    });

    // Recalculer la note de l'annonce si c'est un avis de voyageur
    if (reviewType === "GUEST_TO_HOST") {
      const listingAgg = await tx.review.aggregate({
        where: { listingId: booking.listingId, status: "PUBLISHED", type: "GUEST_TO_HOST" },
        _avg: { rating: true },
      });

      await tx.listing.update({
        where: { id: booking.listingId },
        data: { rating: listingAgg._avg.rating ?? 0 },
      });
    }

    // Créer une notification pour la cible
    await tx.notification.create({
      data: {
        userId: targetUserId,
        type: "REVIEW_RECEIVED",
        title: "Nouvel avis reçu",
        message: isGuest
          ? `${me.id} a laissé un avis sur votre annonce "${booking.listing.title}"`
          : `${booking.listing.ownerId} a laissé un avis sur vous`,
        data: {
          reviewId: r.id,
          bookingId: booking.id,
          listingId: booking.listingId,
          rating,
        },
        actionUrl: isGuest
          ? `/listings/${booking.listingId}#reviews`
          : `/profile#reviews`,
      },
    });

    return r;
  });

  // Envoyer un email de notification (asynchrone)
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { email: true, name: true },
  });

  if (targetUser?.email) {
    // Import dynamique pour éviter les erreurs au build
    import("@/lib/email/queue").then(({ queueEmail }) => {
      queueEmail({
        type: "review-request",
        to: targetUser.email,
        data: {
          guestName: targetUser.name || "Utilisateur",
          listingTitle: booking.listing.title,
          hostName: booking.listing.ownerId,
          bookingId: booking.id,
        },
      });
    }).catch((err) => {
      console.error("[Review] Erreur envoi email:", err);
    });
  }

  return NextResponse.json({ review }, { status: 201 });
}

// PATCH /api/reviews - Répondre à un avis (pour l'hôte/voyageur ciblé)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  // Validation Zod du body
  const { respondToReviewSchema, validateRequestBody } = await import("@/lib/validations/api");
  const validation = await validateRequestBody(req, respondToReviewSchema);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { reviewId, response } = validation.data;

  // Récupérer l'avis
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return NextResponse.json({ error: "review_not_found" }, { status: 404 });
  }

  // Seule la personne ciblée peut répondre
  if (review.targetUserId !== me.id) {
    return NextResponse.json(
      { error: "forbidden_not_review_target" },
      { status: 403 }
    );
  }

  // Vérifier qu'il n'y a pas déjà une réponse
  if (review.response) {
    return NextResponse.json(
      { error: "response_already_exists" },
      { status: 400 }
    );
  }

  // Mettre à jour l'avis avec la réponse
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      response,
      responseAt: new Date(),
    },
  });

  // Notifier l'auteur de l'avis
  await prisma.notification.create({
    data: {
      userId: review.authorId,
      type: "REVIEW_RECEIVED",
      title: "Réponse à votre avis",
      message: "L'hôte a répondu à votre avis",
      data: {
        reviewId: review.id,
        bookingId: review.bookingId,
      },
      actionUrl: `/listings/${review.listingId}#reviews`,
    },
  });

  return NextResponse.json({ review: updatedReview });
}
