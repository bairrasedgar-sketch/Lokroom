/**
 * API Admin - Liste des réservations
 * GET /api/admin/bookings
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("bookings:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Construire les filtres
    const where: Prisma.BookingWhereInput = {};

    if (search) {
      where.OR = [
        { listing: { title: { contains: search, mode: "insensitive" } } },
        { guest: { email: { contains: search, mode: "insensitive" } } },
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { id: { contains: search } },
      ];
    }

    if (status) {
      where.status = status as Prisma.EnumBookingStatusFilter["equals"];
    }

    if (dateFrom) {
      where.startDate = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.endDate = { lte: new Date(dateTo) };
    }

    // Stats par statut
    const [statusStats, total, bookings] = await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          currency: true,
          status: true,
          pricingMode: true,
          createdAt: true,
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              images: {
                select: { url: true },
                take: 1,
              },
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              disputes: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Transformer les stats
    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
    };
    statusStats.forEach((s) => {
      stats.byStatus[s.status] = s._count.status;
      stats.total += s._count.status;
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        startDate: b.startDate,
        endDate: b.endDate,
        totalPrice: b.totalPrice,
        currency: b.currency,
        status: b.status,
        pricingMode: b.pricingMode,
        createdAt: b.createdAt,
        listing: {
          id: b.listing.id,
          title: b.listing.title,
          city: b.listing.city,
          imageUrl: b.listing.images[0]?.url || null,
        },
        guest: b.guest,
        hasDispute: b._count.disputes > 0,
        hasReview: b._count.reviews > 0,
      })),
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
      stats,
    });
  } catch (error) {
    console.error("Erreur API admin bookings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
