// apps/web/src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { cache, CacheKeys, CacheTTL } from "@/lib/redis/cache-safe";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";

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
  // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
  const page = parsePageParam(searchParams.get("page"));
  const pageSize = parseLimitParam(searchParams.get("pageSize"), 20, 100);

  // Clé de cache incluant la pagination
  const cacheKey = `${CacheKeys.bookingsByUser(me.id)}:page:${page}:size:${pageSize}`;

  const cached = await cache.get(
    cacheKey,
    async () => {
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

      return {
        bookings,
        page,
        pageSize,
        total,
        pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
      };
    },
    CacheTTL.SHORT // Les bookings changent fréquemment
  );

  return NextResponse.json(cached);
}
