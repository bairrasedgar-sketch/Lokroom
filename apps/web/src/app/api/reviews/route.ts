// apps/web/src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Constantes de validation
const MAX_COMMENT_LENGTH = 2000; // Limite raisonnable pour un avis
const MIN_RATING = 1;
const MAX_RATING = 5;

function clampRating(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < MIN_RATING || n > MAX_RATING) return null;
  return Math.round(n);
}

// GET /api/reviews?listingId=XXX
// ➜ Récupère les avis d’une annonce (public)
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json(
      { error: "listingId_required" },
      { status: 400 },
    );
  }

  const reviews = await prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ reviews });
}

// POST /api/reviews
// body: { bookingId: string; rating: number; comment?: string; targetUserId?: string }
//
// ➜ Crée ou met à jour un avis pour une réservation.
//    - L'auteur doit être guest OU host sur cette booking.
//    - La réservation doit être terminée (endDate < now).
//    - Après l’upsert, on recalcule ratingAvg / ratingCount du user ciblé.
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

  const body = (await req.json().catch(() => null)) as
    | {
        bookingId?: string;
        rating?: number;
        comment?: string;
        targetUserId?: string;
      }
    | null;

  if (!body?.bookingId) {
    return NextResponse.json(
      { error: "bookingId_required" },
      { status: 400 },
    );
  }

  const rating = clampRating(body.rating);
  if (!rating) {
    return NextResponse.json(
      { error: "rating_must_be_between_1_and_5" },
      { status: 400 },
    );
  }

  // Validation du commentaire: longueur max pour éviter les abus
  let comment: string | null = null;
  if (typeof body.comment === "string" && body.comment.trim().length > 0) {
    const trimmed = body.comment.trim();
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `comment_too_long_max_${MAX_COMMENT_LENGTH}_chars` },
        { status: 400 },
      );
    }
    comment = trimmed;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: {
      listing: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "booking_not_found" },
      { status: 404 },
    );
  }

  const isGuest = booking.guestId === me.id;
  const isHost = booking.listing.ownerId === me.id;

  if (!isGuest && !isHost) {
    return NextResponse.json(
      { error: "forbidden_not_part_of_booking" },
      { status: 403 },
    );
  }

  // La réservation doit être terminée pour laisser un avis
  const now = new Date();
  if (booking.endDate > now) {
    return NextResponse.json(
      { error: "booking_not_finished_yet" },
      { status: 400 },
    );
  }

  // Si targetUserId n’est pas fourni, on prend “l’autre” personne
  const targetUserId =
    body.targetUserId ??
    (isGuest ? booking.listing.ownerId : booking.guestId);

  if (targetUserId === me.id) {
    return NextResponse.json(
      { error: "cannot_review_yourself" },
      { status: 400 },
    );
  }

  // 🧠 Tout dans une transaction :
  // - upsert de l’avis
  // - recalcul de la moyenne + count
  // - mise à jour de UserProfile (ratingAvg, ratingCount)
  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.upsert({
      where: {
        bookingId_authorId: {
          bookingId: booking.id,
          authorId: me.id,
        },
      },
      update: {
        rating,
        comment,
        targetUserId,
      },
      create: {
        bookingId: booking.id,
        listingId: booking.listingId,
        authorId: me.id,
        targetUserId,
        rating,
        comment,
      },
    });

    const agg = await tx.review.aggregate({
      where: { targetUserId },
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

    return r;
  });

  return NextResponse.json({ review }, { status: 201 });
}
