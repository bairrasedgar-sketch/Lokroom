// apps/web/src/app/api/bookings/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings
 *
 * ➜ Renvoie les réservations du user connecté (en tant que guest).
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return jsonError("unauthorized", 401);
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          images: { select: { id: true, url: true }, take: 1 },
        },
      },
    },
  });

  return NextResponse.json({ bookings });
}
