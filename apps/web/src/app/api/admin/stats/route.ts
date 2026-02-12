/**
 * API Admin - Statistiques du dashboard
 * GET /api/admin/stats
 *
 * Retourne les KPIs principaux pour le tableau de bord admin
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";


export async function GET() {
  const auth = await requireAdminPermission("dashboard:view");
  if ("error" in auth) return auth.error;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Requêtes parallèles pour les stats
    const [
      // Utilisateurs
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      newUsersToday,
      // Annonces
      totalListings,
      activeListings,
      pendingListings,
      // Réservations
      totalBookings,
      bookingsThisMonth,
      bookingsLastMonth,
      pendingBookings,
      // Revenus
      revenueThisMonth,
      revenueLastMonth,
      // Litiges
      openDisputes,
      // Avis
      totalReviews,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      // Listings
      prisma.listing.count(),
      prisma.listing.count({ where: { isActive: true } }),
      prisma.listingModeration.count({ where: { status: "PENDING_REVIEW" } }),
      // Bookings
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      // Revenue
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        _sum: { totalPrice: true },
      }),
      // Disputes
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW", "AWAITING_HOST", "AWAITING_GUEST"] } } }),
      // Reviews
      prisma.review.count(),
    ]);

    // Calcul des variations en pourcentage
    const userGrowth = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    const bookingGrowth = bookingsLastMonth > 0
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : bookingsThisMonth > 0 ? 100 : 0;

    const revenueThisMonthValue = revenueThisMonth._sum.totalPrice || 0;
    const revenueLastMonthValue = revenueLastMonth._sum.totalPrice || 0;
    const revenueGrowth = revenueLastMonthValue > 0
      ? Math.round(((revenueThisMonthValue - revenueLastMonthValue) / revenueLastMonthValue) * 100)
      : revenueThisMonthValue > 0 ? 100 : 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        thisMonth: usersThisMonth,
        growth: userGrowth,
        newToday: newUsersToday,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        pending: pendingListings,
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        growth: bookingGrowth,
        pending: pendingBookings,
      },
      revenue: {
        thisMonth: revenueThisMonthValue,
        lastMonth: revenueLastMonthValue,
        growth: revenueGrowth,
      },
      disputes: {
        open: openDisputes,
      },
      reviews: {
        total: totalReviews,
      },
    });
  } catch (error) {
    logger.error("Erreur API admin stats:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
