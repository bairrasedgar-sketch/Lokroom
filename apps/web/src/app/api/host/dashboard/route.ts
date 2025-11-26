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

  const listings = await prisma.listing.findMany({
    where: { ownerId: me.id },
    select: {
      id: true,
      title: true,
      city: true,
      country: true,
      price: true,
      currency: true,
      images: { select: { url: true }, take: 1 }
    }
  });

  const bookings = await prisma.booking.findMany({
    where: { listing: { ownerId: me.id } },
    include: {
      guest: { select: { name: true, email: true } }
    },
    orderBy: { startDate: "desc" }
  });

  const stats = {
    totalListings: listings.length,
    totalBookings: bookings.length,
    upcoming: bookings.filter(b => b.startDate > now && b.status === "CONFIRMED").length,
    thisMonth: bookings.filter(b => b.createdAt >= startOfMonth).length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length
  };

  return NextResponse.json({
    listings,
    bookings,
    stats
  });
}
