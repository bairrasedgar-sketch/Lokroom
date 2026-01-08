// apps/web/src/app/api/reviews/pending/route.ts
// Récupère les réservations en attente d'avis pour l'utilisateur connecté
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const REVIEW_WINDOW_DAYS = 14;

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
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Récupérer les réservations terminées dans les 14 derniers jours
  // où l'utilisateur est guest ou host et n'a pas encore laissé d'avis
  const bookingsAsGuest = await prisma.booking.findMany({
    where: {
      guestId: me.id,
      status: "CONFIRMED",
      endDate: {
        lt: now,
        gte: windowStart,
      },
      reviews: {
        none: {
          authorId: me.id,
        },
      },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          images: {
            take: 1,
            orderBy: { position: "asc" },
            select: { url: true },
          },
          owner: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { avatarUrl: true },
              },
            },
          },
        },
      },
    },
    orderBy: { endDate: "desc" },
  });

  const bookingsAsHost = await prisma.booking.findMany({
    where: {
      listing: {
        ownerId: me.id,
      },
      status: "CONFIRMED",
      endDate: {
        lt: now,
        gte: windowStart,
      },
      reviews: {
        none: {
          authorId: me.id,
        },
      },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          images: {
            take: 1,
            orderBy: { position: "asc" },
            select: { url: true },
          },
        },
      },
      guest: {
        select: {
          id: true,
          name: true,
          profile: {
            select: { avatarUrl: true },
          },
        },
      },
    },
    orderBy: { endDate: "desc" },
  });

  // Formater les résultats
  const pendingReviews = [
    ...bookingsAsGuest.map((b) => ({
      bookingId: b.id,
      type: "GUEST_TO_HOST" as const,
      listing: {
        id: b.listing.id,
        title: b.listing.title,
        city: b.listing.city,
        country: b.listing.country,
        imageUrl: b.listing.images[0]?.url || null,
      },
      targetUser: {
        id: b.listing.owner.id,
        name: b.listing.owner.name,
        avatarUrl: b.listing.owner.profile?.avatarUrl || null,
      },
      startDate: b.startDate,
      endDate: b.endDate,
      daysRemaining: Math.max(
        0,
        REVIEW_WINDOW_DAYS -
          Math.floor((now.getTime() - b.endDate.getTime()) / (1000 * 60 * 60 * 24))
      ),
    })),
    ...bookingsAsHost.map((b) => ({
      bookingId: b.id,
      type: "HOST_TO_GUEST" as const,
      listing: {
        id: b.listing.id,
        title: b.listing.title,
        city: b.listing.city,
        country: b.listing.country,
        imageUrl: b.listing.images[0]?.url || null,
      },
      targetUser: {
        id: b.guest.id,
        name: b.guest.name,
        avatarUrl: b.guest.profile?.avatarUrl || null,
      },
      startDate: b.startDate,
      endDate: b.endDate,
      daysRemaining: Math.max(
        0,
        REVIEW_WINDOW_DAYS -
          Math.floor((now.getTime() - b.endDate.getTime()) / (1000 * 60 * 60 * 24))
      ),
    })),
  ].sort((a, b) => a.daysRemaining - b.daysRemaining); // Trier par urgence

  return NextResponse.json({
    pendingReviews,
    count: pendingReviews.length,
  });
}
