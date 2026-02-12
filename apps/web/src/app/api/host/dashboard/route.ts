// apps/web/src/app/api/host/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

  if (!me) return NextResponse.json({});

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 🚀 PERFORMANCE : Requêtes parallèles au lieu de séquentielles
  const [allListings, bookings, revenueStats] = await Promise.all([
    // Toutes les annonces de l'hôte (pour affichage)
    prisma.listing.findMany({
      where: { ownerId: me.id },
      select: {
        id: true,
        title: true,
        city: true,
        country: true,
        price: true,
        currency: true,
        isActive: true,
        ListingModeration: {
          select: { status: true }
        },
        images: { select: { url: true }, take: 1 }
      }
    }),

    // Toutes les réservations de l'hôte
    prisma.booking.findMany({
      where: { listing: { ownerId: me.id } },
      include: {
        guest: { select: { name: true, email: true } }
      },
      orderBy: { startDate: "desc" }
    }),

    // 🚀 PERFORMANCE : Calculer les revenus en DB au lieu de filtrer en mémoire
    prisma.booking.aggregate({
      where: {
        listing: { ownerId: me.id },
        status: "CONFIRMED"
      },
      _sum: { totalPrice: true }
    })
  ]);

  // Filtrer les annonces actives pour les stats
  const activeListings = allListings.filter(
    (l) => l.isActive && l.ListingModeration?.status === "APPROVED"
  );

  // 🚀 PERFORMANCE : Calculer les revenus du mois en DB
  const thisMonthRevenueResult = await prisma.booking.aggregate({
    where: {
      listing: { ownerId: me.id },
      status: "CONFIRMED",
      createdAt: { gte: startOfMonth }
    },
    _sum: { totalPrice: true }
  });

  // Devise principale (prendre la première ou EUR par défaut)
  const primaryCurrency = activeListings[0]?.currency || "EUR";

  const stats = {
    totalListings: allListings.length,
    activeListings: activeListings.length,
    totalBookings: bookings.length,
    upcoming: bookings.filter(b => b.startDate > now && b.status === "CONFIRMED").length,
    thisMonth: bookings.filter(b => b.createdAt >= startOfMonth).length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length,
    totalRevenue: revenueStats._sum.totalPrice || 0,
    thisMonthRevenue: thisMonthRevenueResult._sum.totalPrice || 0,
    currency: primaryCurrency
  };

  return NextResponse.json({
    listings: allListings,
    bookings,
    stats
  });
}
