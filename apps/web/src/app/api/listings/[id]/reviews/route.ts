import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok } = await rateLimit(`reviews-listing:${ip}`, 60, 60_000);
  if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const listingId = params.id;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "10")));
  const skip = (page - 1) * pageSize;

  try {
    const [reviews, total, aggResult] = await Promise.all([
      prisma.review.findMany({
        where: { listingId, status: "PUBLISHED", type: "GUEST_TO_HOST" },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          rating: true,
          comment: true,
          response: true,
          responseAt: true,
          ratingCleanliness: true,
          ratingAccuracy: true,
          ratingCommunication: true,
          ratingLocation: true,
          ratingCheckin: true,
          ratingValue: true,
          highlights: true,
          wouldRecommend: true,
          createdAt: true,
          photos: { select: { id: true, url: true, caption: true } },
          author: {
            select: {
              id: true,
              name: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      prisma.review.count({ where: { listingId, status: "PUBLISHED", type: "GUEST_TO_HOST" } }),
      prisma.review.aggregate({
        where: { listingId, status: "PUBLISHED", type: "GUEST_TO_HOST" },
        _avg: {
          rating: true,
          ratingCleanliness: true,
          ratingAccuracy: true,
          ratingCommunication: true,
          ratingLocation: true,
          ratingCheckin: true,
          ratingValue: true,
        },
        _count: { _all: true, rating: true },
      }),
    ]);

    // Distribution 1-5
    const distribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { listingId, status: "PUBLISHED", type: "GUEST_TO_HOST" },
      _count: { rating: true },
    });
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) dist[d.rating] = d._count.rating;

    const avg = aggResult._avg;

    return NextResponse.json({
      reviews,
      totalReviews: total,
      averageRating: avg.rating ? Number(avg.rating.toFixed(2)) : null,
      stats: {
        totalReviews: total,
        averageRating: avg.rating ? Number(avg.rating.toFixed(2)) : null,
        averageCleanliness: avg.ratingCleanliness ? Number(avg.ratingCleanliness.toFixed(2)) : null,
        averageAccuracy: avg.ratingAccuracy ? Number(avg.ratingAccuracy.toFixed(2)) : null,
        averageCommunication: avg.ratingCommunication ? Number(avg.ratingCommunication.toFixed(2)) : null,
        averageLocation: avg.ratingLocation ? Number(avg.ratingLocation.toFixed(2)) : null,
        averageCheckin: avg.ratingCheckin ? Number(avg.ratingCheckin.toFixed(2)) : null,
        averageValue: avg.ratingValue ? Number(avg.ratingValue.toFixed(2)) : null,
        distribution: dist,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: skip + pageSize < total,
        hasPrev: page > 1,
      },
    });
  } catch (e) {
    console.error("[reviews] error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
