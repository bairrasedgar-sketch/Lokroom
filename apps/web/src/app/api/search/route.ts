import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

/**
 * GET /api/search
 * Recherche avancée avec filtres multiples et tri
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    // Paramètres de recherche
    const query = params.get("q") || "";
    const city = params.get("city");
    const country = params.get("country");
    const category = params.get("category");
    const minPrice = params.get("minPrice") ? parseFloat(params.get("minPrice")!) : undefined;
    const maxPrice = params.get("maxPrice") ? parseFloat(params.get("maxPrice")!) : undefined;
    const guests = params.get("guests") ? parseInt(params.get("guests")!) : undefined;
    const bedrooms = params.get("bedrooms") ? parseInt(params.get("bedrooms")!) : undefined;
    const bathrooms = params.get("bathrooms") ? parseInt(params.get("bathrooms")!) : undefined;
    const amenities = params.get("amenities")?.split(",").filter(Boolean) || [];
    const instantBook = params.get("instantBook") === "true";
    const superhost = params.get("superhost") === "true";
    const minRating = params.get("minRating") ? parseFloat(params.get("minRating")!) : undefined;
    const pricingMode = params.get("pricingMode"); // HOURLY, DAILY, BOTH

    // Pagination
    const page = params.get("page") ? parseInt(params.get("page")!) : 1;
    const limit = Math.min(50, params.get("limit") ? parseInt(params.get("limit")!) : 20);
    const skip = (page - 1) * limit;

    // Tri
    const sortBy = params.get("sortBy") || "relevance";

    // Construction de la requête Prisma
    const where: Prisma.ListingWhereInput = {
      isActive: true,
    };

    // Recherche textuelle (titre, description, ville, adresse)
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { addressLine1: { contains: query, mode: "insensitive" } },
        { spaceDescription: { contains: query, mode: "insensitive" } },
        { neighborhoodDescription: { contains: query, mode: "insensitive" } },
      ];
    }

    // Filtres géographiques
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = country;

    // Filtre par catégorie
    if (category) where.type = category as any;

    // Filtres de prix
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Filtres de capacité
    if (guests) where.maxGuests = { gte: guests };
    if (bedrooms) where.bedrooms = { gte: bedrooms };
    if (bathrooms) where.bathroomsFull = { gte: bathrooms };

    // Filtre réservation instantanée
    if (instantBook) where.isInstantBook = true;

    // Filtre mode de tarification
    if (pricingMode) {
      where.pricingMode = pricingMode as any;
    }

    // Filtre amenities (doit avoir TOUS les amenities sélectionnés)
    if (amenities.length > 0) {
      where.amenities = {
        some: {
          amenityId: { in: amenities },
        },
      };
    }

    // Filtre superhost
    if (superhost) {
      where.owner = {
        hostProfile: {
          superhost: true,
        },
      };
    }

    // Filtre note minimum
    if (minRating) {
      where.rating = { gte: minRating };
    }

    // Tri
    let orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "price-asc":
        orderBy = [{ price: "asc" }];
        break;
      case "price-desc":
        orderBy = [{ price: "desc" }];
        break;
      case "rating":
        orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
        break;
      case "newest":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "popular":
        orderBy = [{ viewCount: "desc" }, { rating: "desc" }];
        break;
      case "relevance":
      default:
        // Tri par pertinence : note + nombre de vues + récence
        orderBy = [
          { rating: "desc" },
          { viewCount: "desc" },
          { createdAt: "desc" },
        ];
    }

    // Exécution de la requête
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: {
            orderBy: { position: "asc" },
            take: 5,
            select: {
              id: true,
              url: true,
              isCover: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
              hostProfile: {
                select: {
                  superhost: true,
                },
              },
            },
          },
          amenities: {
            include: {
              amenity: {
                select: {
                  id: true,
                  slug: true,
                  label: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    // Formater les résultats
    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      hourlyPrice: listing.hourlyPrice,
      currency: listing.currency,
      country: listing.country,
      city: listing.city,
      type: listing.type,
      pricingMode: listing.pricingMode,
      maxGuests: listing.maxGuests,
      bedrooms: listing.bedrooms,
      bathroomsFull: listing.bathroomsFull,
      rating: listing.rating,
      isInstantBook: listing.isInstantBook,
      latPublic: listing.latPublic,
      lngPublic: listing.lngPublic,
      images: listing.images,
      owner: {
        id: listing.owner.id,
        name: listing.owner.name,
        avatarUrl: listing.owner.profile?.avatarUrl,
        isSuperhost: listing.owner.hostProfile?.superhost || false,
      },
      amenities: listing.amenities.map((a) => a.amenity),
      highlights: listing.highlights,
    }));

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        query,
        city,
        country,
        category,
        minPrice,
        maxPrice,
        guests,
        bedrooms,
        bathrooms,
        amenities,
        instantBook,
        superhost,
        minRating,
        pricingMode,
      },
      sortBy,
    });
  } catch (err) {
    logger.error("GET /api/search error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
