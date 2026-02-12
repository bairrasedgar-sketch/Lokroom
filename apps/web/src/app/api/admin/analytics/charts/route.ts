/**
 * API Admin - Charts Data
 * GET /api/admin/analytics/charts
 *
 * Retourne les données pour les graphiques du dashboard
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";


export async function GET(request: Request) {
  const auth = await requireAdminPermission("dashboard:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30"; // jours

  try {
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Générer les dates pour le graphique
    const dates: Date[] = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    // Récupérer les données par jour
    const [bookingsRaw, usersRaw, revenueRaw] = await Promise.all([
      // Bookings par jour
      prisma.booking.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      // Users par jour
      prisma.user.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      // Revenue par jour
      prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        select: {
          createdAt: true,
          totalPrice: true,
          guestFeeCents: true,
          hostFeeCents: true,
        },
      }),
    ]);

    // Agréger par jour
    const bookingsByDay = new Map<string, number>();
    const usersByDay = new Map<string, number>();
    const revenueByDay = new Map<string, { total: number; fees: number }>();

    // Initialiser tous les jours à 0
    dates.forEach((date) => {
      const key = date.toISOString().split("T")[0];
      bookingsByDay.set(key, 0);
      usersByDay.set(key, 0);
      revenueByDay.set(key, { total: 0, fees: 0 });
    });

    // Compter les bookings par jour
    bookingsRaw.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().split("T")[0];
      bookingsByDay.set(key, (bookingsByDay.get(key) || 0) + b._count);
    });

    // Compter les users par jour
    usersRaw.forEach((u) => {
      const key = new Date(u.createdAt).toISOString().split("T")[0];
      usersByDay.set(key, (usersByDay.get(key) || 0) + u._count);
    });

    // Calculer les revenus par jour
    revenueRaw.forEach((b) => {
      const key = new Date(b.createdAt).toISOString().split("T")[0];
      const current = revenueByDay.get(key) || { total: 0, fees: 0 };
      current.total += b.totalPrice * 100; // Convertir en centimes
      current.fees += b.guestFeeCents + b.hostFeeCents;
      revenueByDay.set(key, current);
    });

    // Construire les données du graphique
    const chartData = dates.map((date) => {
      const key = date.toISOString().split("T")[0];
      const revenue = revenueByDay.get(key) || { total: 0, fees: 0 };
      return {
        date: key,
        label: new Date(date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        bookings: bookingsByDay.get(key) || 0,
        users: usersByDay.get(key) || 0,
        revenue: Math.round(revenue.total / 100), // En euros
        fees: Math.round(revenue.fees / 100), // En euros
      };
    });

    // Statistiques par pays
    const bookingsByCountry = await prisma.booking.groupBy({
      by: ["listingId"],
      where: {
        createdAt: { gte: startDate },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      _count: true,
      _sum: { totalPrice: true },
    });

    // Récupérer les pays des listings
    const listingIds = bookingsByCountry.map((b) => b.listingId);
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, country: true },
    });

    const countryMap = new Map(listings.map((l) => [l.id, l.country]));
    const countryStats = new Map<string, { bookings: number; revenue: number }>();

    bookingsByCountry.forEach((b) => {
      const country = countryMap.get(b.listingId) || "Autre";
      const current = countryStats.get(country) || { bookings: 0, revenue: 0 };
      current.bookings += b._count;
      current.revenue += (b._sum.totalPrice || 0) * 100;
      countryStats.set(country, current);
    });

    const countryData = Array.from(countryStats.entries())
      .map(([country, data]) => ({
        country,
        bookings: data.bookings,
        revenue: Math.round(data.revenue / 100),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Statistiques par type d'espace
    const listingsByType = await prisma.listing.groupBy({
      by: ["type"],
      _count: true,
    });

    const typeData = listingsByType.map((t) => ({
      type: t.type,
      count: t._count,
    }));

    // Top annonces par revenus
    const topListings = await prisma.booking.groupBy({
      by: ["listingId"],
      where: {
        createdAt: { gte: startDate },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      _sum: { totalPrice: true },
      _count: true,
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    });

    const topListingIds = topListings.map((t) => t.listingId);
    const topListingsDetails = await prisma.listing.findMany({
      where: { id: { in: topListingIds } },
      select: {
        id: true,
        title: true,
        city: true,
        country: true,
        images: { take: 1, select: { url: true } },
      },
    });

    const topListingsMap = new Map(topListingsDetails.map((l) => [l.id, l]));
    const topListingsData = topListings.map((t) => {
      const listing = topListingsMap.get(t.listingId);
      return {
        id: t.listingId,
        title: listing?.title || "Annonce",
        location: listing ? `${listing.city}, ${listing.country}` : "",
        image: listing?.images[0]?.url || null,
        bookings: t._count,
        revenue: Math.round((t._sum.totalPrice || 0) * 100 / 100),
      };
    });

    // Taux de conversion
    const totalViews = await prisma.listing.aggregate({
      _sum: { viewCount: true },
    });
    const totalBookingsCount = await prisma.booking.count({
      where: { createdAt: { gte: startDate } },
    });
    const conversionRate = totalViews._sum.viewCount
      ? ((totalBookingsCount / totalViews._sum.viewCount) * 100).toFixed(2)
      : "0.00";

    // Statuts des réservations
    const bookingStatusCounts = await prisma.booking.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    const statusData = bookingStatusCounts.map((s) => ({
      status: s.status,
      count: s._count,
    }));

    return NextResponse.json({
      chartData,
      countryData,
      typeData,
      topListings: topListingsData,
      statusData,
      conversionRate: parseFloat(conversionRate),
      period: days,
    });
  } catch (error) {
    logger.error("Erreur API charts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
