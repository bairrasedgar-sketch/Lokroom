/**
 * API Admin - Liste des annonces
 * GET /api/admin/listings
 *
 * Pagination, recherche et filtres avec modération
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";
import type { Prisma, ListingStatus } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("listings:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
    const page = parsePageParam(searchParams.get("page"));
    const pageSize = parseLimitParam(searchParams.get("pageSize"), 20, 100);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const reported = searchParams.get("reported") === "true";

    // Construire les filtres
    const where: Prisma.ListingWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
        { owner: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (type) {
      where.type = type as Prisma.EnumListingTypeFilter["equals"];
    }

    // Filtrer par statut de modération
    if (status && reported) {
      where.ListingModeration = {
        status: status as ListingStatus,
        reportCount: { gt: 0 },
      };
    } else if (status) {
      where.ListingModeration = {
        status: status as ListingStatus,
      };
    } else if (reported) {
      where.ListingModeration = {
        reportCount: { gt: 0 },
      };
    }

    // 🚀 PERFORMANCE : Requêtes parallèles (stats + listings)
    const [pending, reportedCount, total, listings] = await Promise.all([
      prisma.listingModeration.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.listingModeration.count({ where: { reportCount: { gt: 0 } } }),
      prisma.listing.count({ where }),
      prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        currency: true,
        city: true,
        country: true,
        isActive: true,
        createdAt: true,
        ListingModeration: {
          select: {
            status: true,
            reportCount: true,
            rejectionReason: true,
            reviewedAt: true,
            isFeatured: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          select: {
            url: true,
            isCover: true,
          },
          orderBy: [{ isCover: "desc" }, { position: "asc" }],
          take: 1,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      })
    ]);

    // Transformer pour inclure les champs de modération
    const listingsTransformed = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      type: listing.type,
      price: listing.price,
      currency: listing.currency,
      city: listing.city,
      country: listing.country,
      isActive: listing.isActive,
      createdAt: listing.createdAt,
      status: listing.ListingModeration?.status || "DRAFT",
      reportCount: listing.ListingModeration?.reportCount || 0,
      rejectionReason: listing.ListingModeration?.rejectionReason || null,
      isFeatured: listing.ListingModeration?.isFeatured || false,
      owner: listing.owner,
      imageUrl: listing.images[0]?.url || null,
      bookingsCount: listing._count.bookings,
      reviewsCount: listing._count.reviews,
      favoritesCount: listing._count.favorites,
    }));

    return NextResponse.json({
      listings: listingsTransformed,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
      stats: {
        pending,
        reported: reportedCount,
      },
    });
  } catch (error) {
    console.error("Erreur API admin listings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
