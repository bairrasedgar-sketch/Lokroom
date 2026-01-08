// apps/web/src/app/api/host/listings/route.ts
// Récupère les annonces de l'hôte connecté

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien hôte
    const isHost = user.role === "HOST" || user.role === "BOTH" || user.role === "ADMIN";
    if (!isHost) {
      return NextResponse.json({ error: "Accès réservé aux hôtes" }, { status: 403 });
    }

    // Récupérer toutes les annonces de cet hôte (y compris brouillons pour gestion)
    const listings = await prisma.listing.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        price: true,
        hourlyPrice: true,
        currency: true,
        pricingMode: true,
        country: true,
        city: true,
        minNights: true,
        maxNights: true,
        createdAt: true,
        isActive: true,
        ListingModeration: {
          select: { status: true }
        },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: {
            id: true,
            url: true,
            isCover: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculer quelques stats (uniquement sur les annonces actives et approuvées)
    const activeListings = listings.filter(
      (l) => l.isActive && l.ListingModeration?.status === "APPROVED"
    );
    const stats = {
      total: listings.length,
      active: activeListings.length,
      draft: listings.filter((l) => l.ListingModeration?.status === "DRAFT").length,
      pending: listings.filter((l) => l.ListingModeration?.status === "PENDING_REVIEW").length,
      rejected: listings.filter((l) => l.ListingModeration?.status === "REJECTED").length,
      totalBookings: listings.reduce((acc, l) => acc + l._count.bookings, 0),
      totalFavorites: listings.reduce((acc, l) => acc + l._count.favorites, 0),
    };

    // Transformer les données pour le frontend (aplatir ListingModeration)
    const transformedListings = listings.map((l) => ({
      ...l,
      moderationStatus: l.ListingModeration?.status || "DRAFT",
      ListingModeration: undefined,
    }));

    return NextResponse.json({ listings: transformedListings, stats });
  } catch (error) {
    console.error("GET /api/host/listings error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
