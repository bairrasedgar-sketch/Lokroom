// apps/web/src/app/api/reviews/route.ts
// API complète pour les avis niveau Airbnb
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Constantes de validation
const MAX_COMMENT_LENGTH = 2000;
const MAX_RESPONSE_LENGTH = 1000;
const MIN_RATING = 1;
const MAX_RATING = 5;
const REVIEW_WINDOW_DAYS = 14; // Délai pour laisser un avis après la réservation

function clampRating(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < MIN_RATING || n > MAX_RATING) return null;
  return Math.round(n);
}

// GET /api/reviews?listingId=XXX ou ?userId=XXX ou ?bookingId=XXX
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId");
  const userId = req.nextUrl.searchParams.get("userId");
  const bookingId = req.nextUrl.searchParams.get("bookingId");
  const type = req.nextUrl.searchParams.get("type"); // GUEST_TO_HOST ou HOST_TO_GUEST
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "10"), 50);

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

  const body = await req.json().catch(() => null);
  if (!body?.bookingId) {
    return NextResponse.json({ error: "bookingId_required" }, { status: 400 });
  }

  // Validation de la note globale
  const rating = clampRating(body.rating);
  if (!rating) {
    return NextResponse.json(
      { error: "rating_must_be_between_1_and_5" },
      { status: 400 }
    );
  }

  // Validation du commentaire
  let comment: string | null = null;
  if (typeof body.comment === "string" && body.comment.trim().length > 0) {
    const trimmed = body.comment.trim();
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `comment_too_long_max_${MAX_COMMENT_LENGTH}_chars` },
        { status: 400 }
      );
    }
    comment = trimmed;
  }

  // Récupérer la réservation
  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
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

  // Valider les sous-notes selon le type
  const subRatings: Record<string, number | null> = {};

  if (isGuest) {
    // Sous-notes pour les voyageurs
    subRatings.ratingCleanliness = clampRating(body.ratingCleanliness);
    subRatings.ratingAccuracy = clampRating(body.ratingAccuracy);
    subRatings.ratingCommunication = clampRating(body.ratingCommunication);
    subRatings.ratingLocation = clampRating(body.ratingLocation);
    subRatings.ratingCheckin = clampRating(body.ratingCheckin);
    subRatings.ratingValue = clampRating(body.ratingValue);
  } else {
    // Sous-notes pour les hôtes
    subRatings.ratingRespect = clampRating(body.ratingRespect);
    subRatings.ratingTidiness = clampRating(body.ratingTidiness);
    subRatings.ratingCommunication = clampRating(body.ratingCommunication);
  }

  // Highlights (tags)
  const highlights: string[] = Array.isArray(body.highlights)
    ? body.highlights.filter((h: unknown) => typeof h === "string").slice(0, 10)
    : [];

  // Recommandation
  const wouldRecommend = body.wouldRecommend !== false;

  // Créer l'avis dans une transaction
  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        authorId: me.id,
        targetUserId,
        rating,
        comment,
        type: reviewType,
        status: "PUBLISHED",
        highlights,
        wouldRecommend,
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

  const body = await req.json().catch(() => null);
  if (!body?.reviewId || !body?.response) {
    return NextResponse.json(
      { error: "reviewId and response required" },
      { status: 400 }
    );
  }

  // Valider la réponse
  const response = body.response.trim();
  if (response.length > MAX_RESPONSE_LENGTH) {
    return NextResponse.json(
      { error: `response_too_long_max_${MAX_RESPONSE_LENGTH}_chars` },
      { status: 400 }
    );
  }

  // Récupérer l'avis
  const review = await prisma.review.findUnique({
    where: { id: body.reviewId },
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
    where: { id: body.reviewId },
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
