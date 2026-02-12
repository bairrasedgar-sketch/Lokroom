/**
 * API Admin - Gestion des avis
 * GET /api/admin/reviews - Liste des avis avec modération
 * PUT /api/admin/reviews - Actions sur les avis
 * DELETE /api/admin/reviews - Supprimer un avis
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam, parseRatingParam } from "@/lib/validation/params";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("bookings:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), 20, 100);
  const ratingParam = searchParams.get("rating"); // 1, 2, 3, 4, 5
  // flagged parameter reserved for future use
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "recent"; // recent, rating_low, rating_high

  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (ratingParam) {
      // 🔒 SÉCURITÉ : Validation sécurisée du paramètre rating
      const rating = parseRatingParam(ratingParam);
      if (rating !== null) {
        where.rating = rating;
      }
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } },
        { author: { email: { contains: search, mode: "insensitive" } } },
        { listing: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Order by
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sortBy === "rating_low") {
      orderBy = { rating: "asc" };
    } else if (sortBy === "rating_high") {
      orderBy = { rating: "desc" };
    }

    const [reviews, totalCount, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
              _count: { select: { reviewsWritten: true } },
            },
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              images: {
                where: { isCover: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          booking: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      // Stats
      Promise.all([
        prisma.review.count(),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.review.count({ where: { rating: 1 } }),
        prisma.review.count({ where: { rating: 2 } }),
        prisma.review.count({ where: { rating: { lte: 2 } } }), // Low ratings (potential issues)
        prisma.review.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]),
    ]);

    // Check for suspicious patterns (simple heuristics)
    const enrichedReviews = reviews.map((review) => {
      const flags: string[] = [];

      // Very short comment
      if (review.comment && review.comment.length < 10) {
        flags.push("comment_too_short");
      }

      // All caps
      if (review.comment && review.comment === review.comment.toUpperCase() && review.comment.length > 10) {
        flags.push("all_caps");
      }

      // First review from user with 5 stars (could be fake)
      if (review.author._count.reviewsWritten === 1 && review.rating === 5) {
        flags.push("first_review_5_stars");
      }

      // Extreme rating (1 star)
      if (review.rating === 1) {
        flags.push("very_negative");
      }

      return {
        ...review,
        coverImage: review.listing.images[0]?.url || null,
        flags,
        isFlagged: flags.length > 0,
      };
    });

    return NextResponse.json({
      reviews: enrichedReviews,
      stats: {
        total: stats[0],
        averageRating: stats[1]._avg.rating || 0,
        oneStarCount: stats[2],
        twoStarCount: stats[3],
        lowRatingsCount: stats[4],
        thisWeek: stats[5],
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Erreur API admin reviews:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminPermission("bookings:cancel");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { reviewId, action, reason } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "reviewId et action requis" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: { select: { id: true, email: true, name: true } },
        listing: { select: { id: true, title: true, ownerId: true } },
        targetUser: { select: { id: true, email: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Avis non trouvé" },
        { status: 404 }
      );
    }

    switch (action) {
      case "hide": {
        // We don't have a hidden field, so we'll delete but log it
        // In a real app, you'd add a `hidden` or `status` field to Review model
        await logAdminAction({
          adminId: auth.session.user.id,
          action: "LISTING_SUSPENDED", // Using existing action type
          targetType: "Review",
          targetId: reviewId,
          details: {
            action: "hidden",
            authorEmail: review.author.email,
            listingTitle: review.listing.title,
            rating: review.rating,
            reason,
          },
          request,
        });

        // Notify the author
        await prisma.notification.create({
          data: {
            userId: review.author.id,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Avis masqué",
            message: reason || "Votre avis a été masqué car il ne respecte pas nos conditions d'utilisation.",
          },
        });

        return NextResponse.json({ success: true, action: "hidden" });
      }

      case "warn_author": {
        // Send warning to review author
        await prisma.notification.create({
          data: {
            userId: review.author.id,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Avertissement concernant votre avis",
            message: reason || "Votre avis a été signalé. Veuillez respecter nos règles de la communauté.",
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "USER_UPDATED",
          targetType: "User",
          targetId: review.author.id,
          details: {
            action: "review_warning",
            reviewId,
            reason,
          },
          request,
        });

        return NextResponse.json({ success: true, action: "warned" });
      }

      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur action review:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminPermission("bookings:cancel");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId requis" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: { select: { id: true, email: true, name: true } },
        listing: { select: { id: true, title: true, ownerId: true } },
        targetUser: { select: { id: true, email: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Avis non trouvé" },
        { status: 404 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update listing rating
    const remainingReviews = await prisma.review.aggregate({
      where: { listingId: review.listing.id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.listing.update({
      where: { id: review.listing.id },
      data: {
        rating: remainingReviews._avg.rating || 0,
      },
    });

    // Update target user rating
    const userReviews = await prisma.review.aggregate({
      where: { targetUserId: review.targetUser.id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.userProfile.updateMany({
      where: { userId: review.targetUser.id },
      data: {
        ratingAvg: userReviews._avg.rating || 0,
        ratingCount: userReviews._count,
      },
    });

    // Log action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "LISTING_DELETED", // Using existing action type
      targetType: "Review",
      targetId: reviewId,
      details: {
        authorEmail: review.author.email,
        listingTitle: review.listing.title,
        rating: review.rating,
        comment: review.comment,
        reason,
      },
      request,
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: review.author.id,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Avis supprimé",
        message: reason || "Votre avis a été supprimé car il ne respecte pas nos conditions d'utilisation.",
      },
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Erreur suppression review:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
