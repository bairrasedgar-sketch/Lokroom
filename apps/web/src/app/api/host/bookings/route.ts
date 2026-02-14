import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

function parseIntParam(
  raw: string | null,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (!raw) return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return defaultValue;
  return Math.min(Math.max(n, min), max);
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return null;
  return new Date(t);
}

export async function GET(req: NextRequest) {
  try {
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

    const search = req.nextUrl.searchParams;

    const page = parseIntParam(search.get("page"), 1, 1, 10_000);
    const pageSize = parseIntParam(search.get("pageSize"), 20, 1, 100);

  const statusRaw = search.get("status");
  const allowedStatus: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED"];
  const statusFilter = allowedStatus.includes(statusRaw as BookingStatus)
    ? (statusRaw as BookingStatus)
    : null;

  const fromDate = parseDate(search.get("from")); // inclusive
  const toDate = parseDate(search.get("to")); // inclusive

  // 🔍 Filtre de base : toutes les bookings dont l'annonce appartient à ce host
  const where: Prisma.BookingWhereInput = {
    listing: {
      ownerId: me.id,
    },
  };

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (fromDate || toDate) {
    where.startDate = {};
    if (fromDate) {
      (where.startDate as Prisma.DateTimeFilter).gte = fromDate;
    }
    if (toDate) {
      // on prend la fin de journée si seulement la date est fournie
      (where.startDate as Prisma.DateTimeFilter).lte = toDate;
    }
  }

  // 🚀 PERFORMANCE : Requêtes parallèles au lieu de séquentielles
  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: {
        startDate: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        currency: true,
        status: true,
        createdAt: true,
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            images: {
              select: {
                id: true,
                url: true,
              },
              take: 1,
            },
          },
        },
      },
    })
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
    items: bookings,
  });
  } catch (error) {
    logger.error("Failed to fetch host bookings", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "BOOKINGS_FETCH_FAILED",
        message: "Failed to fetch bookings. Please try again."
      },
      { status: 500 }
    );
  }
}
