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
 * Renvoie toutes les réservations (PENDING + CONFIRMED) pour une annonce,
 * utile pour construire le calendrier de disponibilités.
 *
 * Pas besoin d’auth, on ne renvoie que des dates (pas d’info perso).
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const listingId = params.id;

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ bookings });
}
