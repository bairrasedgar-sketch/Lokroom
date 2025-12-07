// apps/web/src/app/api/listings/[id]/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = {
  params: { id: string };
};

/**
 * GET /api/listings/:id/bookings
 *
 * Renvoie les plages de dates bloquées pour une annonce,
 * utile pour construire le calendrier de disponibilités.
 *
 * SÉCURITÉ: On ne renvoie que les dates (pas d'ID, pas de statut, pas d'info guest).
 * Les IDs de réservation ne doivent JAMAIS être exposés publiquement.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const listingId = params.id;

  // Vérifier que le listing existe
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      // SÉCURITÉ: Ne pas exposer l'ID ni le statut
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "asc" },
  });

  // Renommer en "blockedDates" pour être plus clair sur l'usage
  return NextResponse.json({
    blockedDates: bookings.map((b) => ({
      start: b.startDate,
      end: b.endDate,
    })),
  });
}
