// apps/web/src/app/api/my/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      country: true,
      createdAt: true,
      lastLoginAt: true,
      hostProfile: {
        select: {
          id: true,
          stripeAccountId: true,
          kycStatus: true,
          payoutsEnabled: true,
          bio: true,
          avatarUrl: true,
          languages: true,
          responseTimeCategory: true,
          verifiedPhone: true,
          verifiedEmail: true,
          superhost: true,
          instagram: true,
          website: true,
          experienceYears: true,
        },
      },
      wallet: {
        select: {
          balanceCents: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "user_not_found" },
      { status: 404 },
    );
  }

  const now = new Date();

  // On calcule quelques stats utiles pour le dashboard
  const [listingCount, upcomingAsHost, upcomingAsGuest, reviewsReceived] =
    await Promise.all([
      prisma.listing.count({
        where: { ownerId: user.id },
      }),
      prisma.booking.count({
        where: {
          listing: { ownerId: user.id },
          status: "CONFIRMED",
          startDate: { gte: now },
        },
      }),
      prisma.booking.count({
        where: {
          guestId: user.id,
          status: "CONFIRMED",
          startDate: { gte: now },
        },
      }),
      prisma.review.count({
        where: { targetUserId: user.id },
      }),
    ]);

  const isHost =
    user.role === "HOST" || user.role === "BOTH";

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      country: user.country,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    hostProfile: user.hostProfile,
    wallet: user.wallet ?? {
      balanceCents: 0,
      createdAt: null,
      updatedAt: null,
    },
    stats: {
      isHost,
      listingCount,
      upcomingAsHost,
      upcomingAsGuest,
      reviewsReceived,
    },
  });
}
