// apps/web/src/app/api/host/analytics/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireHost } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

type Currency = "EUR" | "CAD";

type MonthlyRevenue = {
  month: string; // "2025-01"
  currency: Currency;
  totalCents: number;
  bookingCount: number;
};

type MonthlyBookings = {
  month: string;
  count: number;
};

type MonthlyNights = {
  month: string;
  nights: number;
};

function toMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function diffNights(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(0, nights);
}

export async function GET() {
  try {
    const { session } = await requireHost();

    if (!session.user?.email) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!me) {
      return NextResponse.json(
        { error: "user_not_found" },
        { status: 404 },
      );
    }

    const hostId = me.id;

    const now = new Date();

    // 📆 Fenêtre pour les agrégats mensuels : 12 derniers mois
    const monthsBack = 12;
    const startOfWindow = new Date(now);
    startOfWindow.setMonth(startOfWindow.getMonth() - (monthsBack - 1));
    startOfWindow.setDate(1);
    startOfWindow.setHours(0, 0, 0, 0);

    // 📆 Fenêtre pour l’occupation : 90 derniers jours
    const occupancyWindowDays = 90;
    const occupancyStart = new Date(now);
    occupancyStart.setDate(
      occupancyStart.getDate() - (occupancyWindowDays - 1),
    );
    occupancyStart.setHours(0, 0, 0, 0);

    // 🚀 PERFORMANCE : Requêtes parallèles au lieu de séquentielles
    const [allBookings, reviews, activeListings] = await Promise.all([
      // 🔹 Toutes les réservations de cet hôte
      prisma.booking.findMany({
        where: {
          listing: {
            ownerId: hostId,
          },
        },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          currency: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          refundAmountCents: true,
          hostFeeCents: true,
        },
      }),

      // 🔹 Avis reçus par cet hôte
      prisma.review.findMany({
        where: {
          targetUserId: hostId,
        },
        select: {
          rating: true,
        },
      }),

      // 🔹 Annonces ACTIVES de l'hôte (pour l'occupation et les stats)
      prisma.listing.findMany({
        where: {
          ownerId: hostId,
          isActive: true,
          ListingModeration: {
            status: "APPROVED",
          },
        },
        select: {
          id: true,
          title: true,
          currency: true,
          bookings: {
            where: {
              status: "CONFIRMED",
            },
            select: {
              totalPrice: true,
              startDate: true,
              endDate: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      })
    ]);

    const listingsCount = activeListings.length;

    // --------------------------
    // 1) SUMMARY GLOBAL
    // --------------------------
    const totalBookings = allBookings.length;
    const nowTime = now.getTime();

    let upcomingBookings = 0;
    let pastBookings = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;

    for (const b of allBookings) {
      const end = b.endDate.getTime();

      if (end >= nowTime) {
        upcomingBookings += 1;
      } else {
        pastBookings += 1;
      }

      if (b.status === "CONFIRMED") confirmedCount += 1;
      if (b.status === "CANCELLED") cancelledCount += 1;
    }

    const baseForCancelRate = confirmedCount + cancelledCount;
    const cancellationRate =
      baseForCancelRate > 0 ? cancelledCount / baseForCancelRate : 0;

    const ratingCount = reviews.length;
    const ratingAvg =
      ratingCount > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / ratingCount
        : null;

    const summary = {
      totalBookings,
      upcomingBookings,
      pastBookings,
      cancellationRate, // 0 → 1
      ratingAvg,
      ratingCount,
    };

    // --------------------------
    // 2) AGRÉGATS MENSUELS (12 mois)
    // --------------------------
    const bookingsInWindow = allBookings.filter(
      (b) => b.createdAt >= startOfWindow,
    );

    const revenueByMonthMap = new Map<string, MonthlyRevenue>();
    const bookingsByMonthMap = new Map<string, MonthlyBookings>();
    const nightsByMonthMap = new Map<string, MonthlyNights>();

    for (const b of bookingsInWindow) {
      const monthKey = toMonthKey(b.createdAt);
      const currency = b.currency as Currency;

      // 📊 Bookings par mois (tous statuts)
      const bkMKey = monthKey;
      const bkExisting =
        bookingsByMonthMap.get(bkMKey) ?? {
          month: monthKey,
          count: 0,
        };
      bkExisting.count += 1;
      bookingsByMonthMap.set(bkMKey, bkExisting);

      // 💰 Revenue & nuits → uniquement sur les bookings CONFIRMED
      if (b.status !== "CONFIRMED") continue;

      const revKey = `${monthKey}|${currency}`;
      const revExisting =
        revenueByMonthMap.get(revKey) ?? {
          month: monthKey,
          currency,
          totalCents: 0,
          bookingCount: 0,
        };

      const priceCents = Math.round(b.totalPrice * 100);
      const hostFeeCents = b.hostFeeCents ?? 0;
      const hostPayoutCents = Math.max(0, priceCents - hostFeeCents);

      revExisting.totalCents += hostPayoutCents;
      revExisting.bookingCount += 1;
      revenueByMonthMap.set(revKey, revExisting);

      // 🛏 Nuits réservées (on prend startDate->endDate dans le mois de création)
      const nights = diffNights(b.startDate, b.endDate);
      const nightsKey = monthKey;
      const nightsExisting =
        nightsByMonthMap.get(nightsKey) ?? {
          month: monthKey,
          nights: 0,
        };
      nightsExisting.nights += nights;
      nightsByMonthMap.set(nightsKey, nightsExisting);
    }

    const revenueByMonth = Array.from(revenueByMonthMap.values()).sort(
      (a, b) => (a.month > b.month ? 1 : -1),
    );
    const bookingsByMonth = Array.from(bookingsByMonthMap.values()).sort(
      (a, b) => (a.month > b.month ? 1 : -1),
    );
    const nightsByMonth = Array.from(nightsByMonthMap.values()).sort(
      (a, b) => (a.month > b.month ? 1 : -1),
    );

    // --------------------------
    // 3) OCCUPATION 90 DERNIERS JOURS
    // --------------------------
    let nightsBooked90d = 0;

    for (const b of allBookings) {
      if (b.status !== "CONFIRMED") continue;

      // On ne prend que les bookings qui intersectent la fenêtre des 90 jours
      if (b.endDate <= occupancyStart || b.startDate >= now) continue;

      const effStart =
        b.startDate < occupancyStart ? occupancyStart : b.startDate;
      const effEnd = b.endDate > now ? now : b.endDate;

      const nights = diffNights(effStart, effEnd);
      nightsBooked90d += nights;
    }

    const nightsCapacity90d = listingsCount * occupancyWindowDays;
    const occupancyRate =
      nightsCapacity90d > 0
        ? nightsBooked90d / nightsCapacity90d
        : 0;

    const occupancy90d = {
      listingsCount,
      nightsBooked: nightsBooked90d,
      nightsCapacity: nightsCapacity90d,
      occupancyRate, // 0 → 1
      windowDays: occupancyWindowDays,
    };

    // --------------------------
    // 4) LISTINGS PERFORMANCE
    // --------------------------
    const listings = activeListings.map((listing) => {
      const bookingsCount = listing.bookings.length;
      const revenue = listing.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const avgRating =
        listing.reviews.length > 0
          ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
          : 0;

      // Calcul occupation pour ce listing (90 derniers jours)
      let nightsBooked = 0;
      for (const b of listing.bookings) {
        if (b.endDate <= occupancyStart || b.startDate >= now) continue;
        const effStart = b.startDate < occupancyStart ? occupancyStart : b.startDate;
        const effEnd = b.endDate > now ? now : b.endDate;
        nightsBooked += diffNights(effStart, effEnd);
      }
      const occupancy = occupancyWindowDays > 0 ? nightsBooked / occupancyWindowDays : 0;

      return {
        id: listing.id,
        title: listing.title,
        bookings: bookingsCount,
        revenue,
        currency: listing.currency,
        rating: avgRating,
        occupancy,
      };
    });

    // --------------------------
    // 5) RÉPONSE
    // --------------------------
    return NextResponse.json({
      summary,
      revenueByMonth,
      bookingsByMonth,
      nightsByMonth,
      occupancy90d,
      listings,
    });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "unknown_error";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }
    if (message === "FORBIDDEN_HOST_ONLY") {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 },
      );
    }

    logger.error("host/analytics error:", e);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
