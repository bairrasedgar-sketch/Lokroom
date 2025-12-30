/**
 * API Admin - Dashboard Analytics
 * GET /api/admin/analytics/dashboard
 *
 * Retourne toutes les données pour le tableau de bord admin
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdminPermission("dashboard:view");
  if ("error" in auth) return auth.error;

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Requêtes parallèles
    const [
      // Users
      totalUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      usersLastMonth,
      // Listings
      totalListings,
      pendingListings,
      publishedListings,
      listingsThisMonth,
      listingsLastMonth,
      // Bookings
      totalBookings,
      bookingsToday,
      bookingsThisWeek,
      bookingsThisMonth,
      bookingsLastMonth,
      // Revenue
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      revenueLastMonth,
      // Disputes
      openDisputes,
      pendingDisputes,
      resolvedDisputesThisMonth,
      // Recent activities
      recentBookings,
      recentUsers,
      recentListings,
    ] = await Promise.all([
      // Users counts
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      // Listings counts
      prisma.listing.count(),
      prisma.listingModeration.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.listingModeration.count({ where: { status: "APPROVED" } }),
      prisma.listing.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.listing.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      // Bookings counts
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } } }),
      // Revenue
      prisma.booking.aggregate({
        where: { createdAt: { gte: startOfToday }, status: { in: ["CONFIRMED", "PENDING"] } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: startOfWeek }, status: { in: ["CONFIRMED", "PENDING"] } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: { in: ["CONFIRMED", "PENDING"] } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth }, status: { in: ["CONFIRMED", "PENDING"] } },
        _sum: { totalPrice: true },
      }),
      // Disputes
      prisma.dispute.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW", "AWAITING_HOST", "AWAITING_GUEST"] } },
      }),
      prisma.dispute.count({ where: { status: { in: ["AWAITING_HOST", "AWAITING_GUEST"] } } }),
      prisma.dispute.count({
        where: {
          resolvedAt: { gte: startOfMonth },
          status: { in: ["RESOLVED_GUEST", "RESOLVED_HOST", "RESOLVED_PARTIAL", "CLOSED"] },
        },
      }),
      // Recent activities
      prisma.booking.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          totalPrice: true,
          currency: true,
          guest: { select: { name: true } },
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.listing.findMany({
        where: { ListingModeration: { status: "PENDING_REVIEW" } },
        select: {
          id: true,
          title: true,
          createdAt: true,
          owner: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Calcul des croissances
    const userGrowth = usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : usersThisMonth > 0 ? 100 : 0;

    const listingGrowth = listingsLastMonth > 0
      ? ((listingsThisMonth - listingsLastMonth) / listingsLastMonth) * 100
      : listingsThisMonth > 0 ? 100 : 0;

    const bookingGrowth = bookingsLastMonth > 0
      ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100
      : bookingsThisMonth > 0 ? 100 : 0;

    const revenueThisMonthVal = (revenueThisMonth._sum.totalPrice || 0) * 100; // Convert to cents
    const revenueLastMonthVal = (revenueLastMonth._sum.totalPrice || 0) * 100;
    const revenueGrowth = revenueLastMonthVal > 0
      ? ((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100
      : revenueThisMonthVal > 0 ? 100 : 0;

    // Construire les activités récentes
    const activities = [
      ...recentBookings.map((b) => ({
        id: `booking-${b.id}`,
        type: "booking" as const,
        title: `Nouvelle réservation`,
        description: `${b.guest.name || "Voyageur"} - ${b.listing.title}`,
        timestamp: b.createdAt.toISOString(),
        status: b.status === "CONFIRMED" ? "success" as const : "info" as const,
      })),
      ...recentUsers.map((u) => ({
        id: `user-${u.id}`,
        type: "user" as const,
        title: `Nouvel utilisateur`,
        description: u.name || u.email,
        timestamp: u.createdAt.toISOString(),
        status: "info" as const,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Construire les éléments en attente
    type PendingItem = {
      id: string;
      type: "listing" | "dispute" | "payout";
      title: string;
      subtitle: string;
      createdAt: string;
      priority: "high" | "medium" | "low";
      link: string;
    };
    const pendingItems: PendingItem[] = [
      ...recentListings.map((l) => ({
        id: l.id,
        type: "listing" as const,
        title: l.title,
        subtitle: `Par ${l.owner.name || "Hôte"}`,
        createdAt: l.createdAt.toISOString(),
        priority: "medium" as const,
        link: `/admin/listings/${l.id}`,
      })),
    ];

    // Ajouter les disputes ouvertes
    const openDisputesList = await prisma.dispute.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      select: {
        id: true,
        reason: true,
        priority: true,
        createdAt: true,
        openedBy: { select: { name: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: 5,
    });

    openDisputesList.forEach((d) => {
      pendingItems.push({
        id: d.id,
        type: "dispute" as const,
        title: `Litige: ${d.reason.replace(/_/g, " ")}`,
        subtitle: `Par ${d.openedBy.name || "Utilisateur"}`,
        createdAt: d.createdAt.toISOString(),
        priority: d.priority <= 2 ? "high" as const : "medium" as const,
        link: `/admin/disputes/${d.id}`,
      });
    });

    // Trier par priorité puis date
    pendingItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          newToday: usersToday,
          newThisWeek: usersThisWeek,
          growth: userGrowth,
        },
        listings: {
          total: totalListings,
          pending: pendingListings,
          published: publishedListings,
          growth: listingGrowth,
        },
        bookings: {
          total: totalBookings,
          todayValue: bookingsToday,
          weeklyValue: bookingsThisWeek,
          monthlyValue: bookingsThisMonth,
          growth: bookingGrowth,
        },
        revenue: {
          today: (revenueToday._sum.totalPrice || 0) * 100,
          week: (revenueThisWeek._sum.totalPrice || 0) * 100,
          month: revenueThisMonthVal,
          total: revenueThisMonthVal + revenueLastMonthVal,
          growth: revenueGrowth,
          currency: "EUR",
        },
        disputes: {
          open: openDisputes,
          pending: pendingDisputes,
          resolved: resolvedDisputesThisMonth,
        },
      },
      activities,
      pendingItems,
    });
  } catch (error) {
    console.error("Erreur API admin dashboard:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
