import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/host/analytics/export - Exporter les analytics en CSV
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const period = searchParams.get("period") || "all";

  // Calculer les dates
  const now = new Date();
  let startDate = new Date(0);

  switch (period) {
    case "7d":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "30d":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      break;
    case "1y":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Récupérer les annonces de l'hôte
  const listings = await prisma.listing.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      city: true,
      country: true,
      viewCount: true,
      createdAt: true,
    },
  });

  const listingIds = listings.map((l) => l.id);

  // Récupérer toutes les réservations
  const bookings = await prisma.booking.findMany({
    where: {
      listingId: { in: listingIds },
      createdAt: { gte: startDate },
    },
    include: {
      guest: {
        select: { name: true, email: true },
      },
      listing: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (format === "csv") {
    // Générer le CSV des réservations
    const headers = [
      "Date de réservation",
      "Annonce",
      "Voyageur",
      "Email voyageur",
      "Check-in",
      "Check-out",
      "Nuits",
      "Statut",
      "Montant total",
      "Devise",
    ];

    const rows = bookings.map((b) => {
      const nights = Math.ceil(
        (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return [
        new Date(b.createdAt).toLocaleDateString("fr-FR"),
        b.listing.title,
        b.guest.name || "N/A",
        b.guest.email,
        new Date(b.startDate).toLocaleDateString("fr-FR"),
        new Date(b.endDate).toLocaleDateString("fr-FR"),
        nights.toString(),
        translateStatus(b.status),
        ((b.totalPrice || 0)).toFixed(2),
        b.currency,
      ];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map(escapeCSV).join(";")),
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations_${period}_${formatDateForFilename(now)}.csv"`,
      },
    });
  }

  // Format JSON par défaut
  return NextResponse.json({
    period,
    exportDate: now.toISOString(),
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      price: l.price,
      currency: l.currency,
      location: `${l.city}, ${l.country}`,
      views: l.viewCount,
      createdAt: l.createdAt.toISOString(),
    })),
    bookings: bookings.map((b) => ({
      id: b.id,
      listingTitle: b.listing.title,
      guestName: b.guest.name,
      guestEmail: b.guest.email,
      checkIn: b.startDate.toISOString(),
      checkOut: b.endDate.toISOString(),
      status: b.status,
      totalPrice: b.totalPrice,
      currency: b.currency,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    CANCELLED: "Annulée",
    COMPLETED: "Terminée",
    REFUNDED: "Remboursée",
  };
  return translations[status] || status;
}

function escapeCSV(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}
