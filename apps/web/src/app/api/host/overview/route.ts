// apps/web/src/app/api/host/overview/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!me) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const hostId = me.id;

  const [
    totalListings,
    activeListingsCount,
    totalBookings,
    totalCancelled,
    wallet,
    profile,
    recentBookings,
    listingRows,
    ledger,
  ] = await Promise.all([
    prisma.listing.count({
      where: { ownerId: hostId },
    }),
    prisma.listing.count({
      where: {
        ownerId: hostId,
        isActive: true,
        ListingModeration: {
          status: "APPROVED",
        },
      },
    }),
    prisma.booking.count({
      where: { listing: { ownerId: hostId } },
    }),
    prisma.booking.count({
      where: { listing: { ownerId: hostId }, status: "CANCELLED" },
    }),
    prisma.wallet.findUnique({
      where: { hostId },
      select: { balanceCents: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: hostId },
      select: { ratingAvg: true, ratingCount: true },
    }),
    prisma.booking.findMany({
      where: { listing: { ownerId: hostId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        currency: true,
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.listing.findMany({
      where: { ownerId: hostId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        createdAt: true,
        isActive: true,
        ListingModeration: {
          select: { status: true }
        },
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.walletLedger.findMany({
      where: { hostId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const listingStats = listingRows.map((l) => {
    const total = l.bookings.length;
    const confirmed = l.bookings.filter((b) => b.status === "CONFIRMED").length;
    const cancelled = l.bookings.filter((b) => b.status === "CANCELLED").length;

    return {
      id: l.id,
      title: l.title,
      price: l.price,
      currency: l.currency,
      createdAt: l.createdAt,
      isActive: l.isActive,
      moderationStatus: l.ListingModeration?.status || "DRAFT",
      totalBookings: total,
      confirmed,
      cancelled,
    };
  });

  return NextResponse.json({
    stats: {
      totalListings,
      activeListings: activeListingsCount,
      totalBookings,
      totalCancelled,
      totalRevenueCents: wallet?.balanceCents ?? 0,
      ratingAvg: profile?.ratingAvg ?? 0,
      ratingCount: profile?.ratingCount ?? 0,
    },
    recentBookings,
    listings: listingStats,
    wallet: {
      balanceCents: wallet?.balanceCents ?? 0,
      lastTransactions: ledger,
    },
  });
}
