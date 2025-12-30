/**
 * API Admin - Dashboard Paiements
 * GET /api/admin/payments - Liste des paiements et stats
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("payments:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const period = searchParams.get("period") || "30";

  try {
    const skip = (page - 1) * limit;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Statistiques globales
    const [
      totalRevenue,
      pendingPayouts,
      completedPayouts,
      refundedAmount,
      recentBookings,
      totalCount,
    ] = await Promise.all([
      // Revenus totaux (réservations confirmées)
      prisma.booking.aggregate({
        where: {
          status: "CONFIRMED",
          createdAt: { gte: startDate },
        },
        _sum: {
          totalPrice: true,
          guestFeeCents: true,
          hostFeeCents: true,
          platformNetCents: true,
        },
        _count: true,
      }),

      // Payouts en attente (host fees non versés)
      prisma.booking.aggregate({
        where: {
          status: "CONFIRMED",
          // On suppose qu'il n'y a pas encore de champ payoutStatus
          // On compte les réservations confirmées récentes
          createdAt: { gte: startDate },
        },
        _sum: {
          totalPrice: true,
          hostFeeCents: true,
        },
      }),

      // Payouts complétés (estimation basée sur les anciennes réservations)
      prisma.booking.aggregate({
        where: {
          status: "CONFIRMED",
          endDate: { lt: new Date() },
        },
        _sum: {
          totalPrice: true,
          hostFeeCents: true,
        },
      }),

      // Montant remboursé
      prisma.booking.aggregate({
        where: {
          refundAmountCents: { gt: 0 },
          createdAt: { gte: startDate },
        },
        _sum: {
          refundAmountCents: true,
        },
        _count: true,
      }),

      // Liste des réservations récentes avec paiements
      prisma.booking.findMany({
        where: {
          ...(status && { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" }),
          createdAt: { gte: startDate },
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  hostProfile: {
                    select: { stripeAccountId: true, payoutsEnabled: true },
                  },
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      // Compte total
      prisma.booking.count({
        where: {
          ...(status && { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" }),
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Statistiques par jour pour le graphique
    const dailyStats = await prisma.booking.groupBy({
      by: ["createdAt"],
      where: {
        status: { in: ["CONFIRMED", "PENDING"] },
        createdAt: { gte: startDate },
      },
      _sum: {
        totalPrice: true,
        guestFeeCents: true,
        platformNetCents: true,
      },
      _count: true,
    });

    // Agréger par jour
    const dailyData = new Map<string, { revenue: number; fees: number; count: number }>();
    dailyStats.forEach((stat) => {
      const day = new Date(stat.createdAt).toISOString().split("T")[0];
      const existing = dailyData.get(day) || { revenue: 0, fees: 0, count: 0 };
      dailyData.set(day, {
        revenue: existing.revenue + (stat._sum.totalPrice || 0) * 100,
        fees: existing.fees + (stat._sum.platformNetCents || 0),
        count: existing.count + stat._count,
      });
    });

    const chartData = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        label: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        revenue: Math.round(data.revenue / 100),
        fees: Math.round(data.fees / 100),
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top hôtes par revenus
    const topHosts = await prisma.booking.groupBy({
      by: ["listingId"],
      where: {
        status: "CONFIRMED",
        createdAt: { gte: startDate },
      },
      _sum: { totalPrice: true },
      _count: true,
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    });

    const topHostListings = await prisma.listing.findMany({
      where: { id: { in: topHosts.map((h) => h.listingId) } },
      select: {
        id: true,
        title: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    const topHostsData = topHosts.map((h) => {
      const listing = topHostListings.find((l) => l.id === h.listingId);
      return {
        listingId: h.listingId,
        listingTitle: listing?.title || "Annonce",
        host: listing?.owner || { id: "", name: "Inconnu", email: "" },
        revenue: (h._sum.totalPrice || 0) * 100,
        bookings: h._count,
      };
    });

    // Réservations formatées
    const payments = recentBookings.map((b) => ({
      id: b.id,
      type: "booking",
      amount: b.totalPrice * 100,
      guestFee: b.guestFeeCents,
      hostFee: b.hostFeeCents,
      platformNet: b.platformNetCents,
      currency: b.currency,
      status: b.status,
      refunded: b.refundAmountCents || 0,
      stripePaymentId: b.stripePaymentIntentId,
      createdAt: b.createdAt,
      listing: b.listing,
      guest: b.guest,
      host: b.listing.owner,
      payoutReady: b.status === "CONFIRMED" && new Date(b.endDate) < new Date(),
      payoutEnabled: b.listing.owner.hostProfile?.payoutsEnabled || false,
    }));

    return NextResponse.json({
      stats: {
        totalRevenue: (totalRevenue._sum.totalPrice || 0) * 100,
        totalGuestFees: totalRevenue._sum.guestFeeCents || 0,
        totalHostFees: totalRevenue._sum.hostFeeCents || 0,
        platformNet: totalRevenue._sum.platformNetCents || 0,
        bookingsCount: totalRevenue._count,
        pendingPayouts: ((pendingPayouts._sum.totalPrice || 0) * 100) - (pendingPayouts._sum.hostFeeCents || 0),
        completedPayouts: ((completedPayouts._sum.totalPrice || 0) * 100) - (completedPayouts._sum.hostFeeCents || 0),
        refundedAmount: refundedAmount._sum.refundAmountCents || 0,
        refundedCount: refundedAmount._count,
      },
      payments,
      chartData,
      topHosts: topHostsData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Erreur API admin payments:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
