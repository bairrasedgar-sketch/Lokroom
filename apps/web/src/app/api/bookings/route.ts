// apps/web/src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings
 *
 * ➜ Renvoie les réservations du user connecté (en tant que guest).
 * Supporte la pagination avec ?page=1&pageSize=20
 */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return jsonError("unauthorized", 401);
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { guestId: me.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
    prisma.booking.count({ where: { guestId: me.id } }),
  ]);

  return NextResponse.json({
    bookings,
    page,
    pageSize,
    total,
    pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
  });
}
