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

  // Toutes les annonces de l'hôte (pour affichage)
  const allListings = await prisma.listing.findMany({
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
  });

  // Filtrer les annonces actives pour les stats
  const activeListings = allListings.filter(
    (l) => l.isActive && l.ListingModeration?.status === "APPROVED"
  );

  const bookings = await prisma.booking.findMany({
    where: { listing: { ownerId: me.id } },
    include: {
      guest: { select: { name: true, email: true } }
    },
    orderBy: { startDate: "desc" }
  });

  // Calculer les revenus (uniquement réservations confirmées)
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const thisMonthRevenue = confirmedBookings
    .filter(b => b.createdAt >= startOfMonth)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Devise principale (prendre la première ou EUR par défaut)
  const primaryCurrency = activeListings[0]?.currency || "EUR";

  const stats = {
    totalListings: allListings.length,
    activeListings: activeListings.length,
    totalBookings: bookings.length,
    upcoming: bookings.filter(b => b.startDate > now && b.status === "CONFIRMED").length,
    thisMonth: bookings.filter(b => b.createdAt >= startOfMonth).length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length,
    totalRevenue,
    thisMonthRevenue,
    currency: primaryCurrency
  };

  return NextResponse.json({
    listings: allListings,
    bookings,
    stats
  });
}
