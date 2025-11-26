// apps/web/src/lib/hostAnalytics.ts
import { prisma } from "@/lib/db";
import type { Currency } from "@/lib/currency";

export type MonthlyAnalyticsPoint = {
  month: string; // "2025-11"
  currency: Currency;
  bookingsCount: number;
  grossAmountCents: number; // totalPrice
  hostPayoutCents: number;  // totalPrice - hostFee
  platformNetCents: number; // platformNetCents (snapshot)
};

export async function getHostAnalytics(hostUserId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      listing: {
        ownerId: hostUserId,
      },
      status: "CONFIRMED",
    },
    select: {
      createdAt: true,
      totalPrice: true,
      currency: true,
      hostFeeCents: true,
      platformNetCents: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const map = new Map<string, MonthlyAnalyticsPoint>();

  for (const b of bookings) {
    const year = b.createdAt.getUTCFullYear();
    const month = String(b.createdAt.getUTCMonth() + 1).padStart(2, "0");
    const key = `${year}-${month}-${b.currency}`;

    const totalPriceCents = Math.round(b.totalPrice * 100);
    const hostFee = b.hostFeeCents ?? 0;
    const hostPayout = totalPriceCents - hostFee;
    const platformNet = b.platformNetCents ?? 0;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        month: `${year}-${month}`,
        currency: b.currency as Currency,
        bookingsCount: 1,
        grossAmountCents: totalPriceCents,
        hostPayoutCents: hostPayout,
        platformNetCents: platformNet,
      });
    } else {
      existing.bookingsCount += 1;
      existing.grossAmountCents += totalPriceCents;
      existing.hostPayoutCents += hostPayout;
      existing.platformNetCents += platformNet;
    }
  }

  const points = Array.from(map.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  return points;
}
