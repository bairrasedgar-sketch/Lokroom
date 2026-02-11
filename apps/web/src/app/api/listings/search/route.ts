// apps/web/src/app/api/listings/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma, ProvinceCA } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function safeInt(value: string | null, fallback: number | null = null): number | null {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function safeFloat(value: string | null, fallback: number | null = null): number | null {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function clampPage(n: number | null | undefined): number {
  if (!n || n < 1) return 1;
  return n;
}

function clampPageSize(n: number | null | undefined): number {
  if (!n || n < 1) return 20;
  if (n > 50) return 50;
  return n;
}

/**
 * GET /api/listings/search
 *
 * Query params (tout optionnel) :
 *
 * - q: string (recherche texte sur titre / description / ville / pays)
 * - country: string
 * - province: string (code de ProvinceCA ou texte)
 * - city: string
 *
 * - minPrice: number
 * - maxPrice: number
 *
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 *   → on exclut les annonces déjà réservées ou bloquées sur ce créneau
 *
 * - guests: number (nombre de voyageurs, filtre sur maxGuests)
 *
 * - minRating: 1–5 (filtre sur les annonces ayant au moins un avis >= minRating)
 * - hasPhoto: "1" (obliger au moins 1 image)
 *
 * - neLat, neLng, swLat, swLng: bounding box carte (lat/lng)
 *
 * - sort:
 *    - "newest" (défaut)
 *    - "price_asc"
 *    - "price_desc"
 *    - "rating_desc"
 *
 * - page: number (1+)
 * - pageSize: number (1–50)
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const sp = url.searchParams;

  // Rate limiting très permissif : 100 requêtes par minute par IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
  const rateLimitKey = `search:${ip}`;
  const rateLimitResult = await rateLimit(rateLimitKey, 100, 60_000);

  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const q = sp.get("q")?.trim() || null;
  const country = sp.get("country")?.trim() || null;
  const province = sp.get("province")?.trim() || null;
  const city = sp.get("city")?.trim() || null;

  const minPrice = safeFloat(sp.get("minPrice"));
  const maxPrice = safeFloat(sp.get("maxPrice"));

  const minRating = safeInt(sp.get("minRating"));
  const hasPhoto = sp.get("hasPhoto") === "1";

  const startDate = parseDate(sp.get("startDate"));
  const endDate = parseDate(sp.get("endDate"));

  // Nombre de voyageurs
  const guests = safeInt(sp.get("guests"));

  const neLat = safeFloat(sp.get("neLat"));
  const neLng = safeFloat(sp.get("neLng"));
  const swLat = safeFloat(sp.get("swLat"));
  const swLng = safeFloat(sp.get("swLng"));

  const sort = sp.get("sort") || "newest";

  const page = clampPage(safeInt(sp.get("page")));
  const pageSize = clampPageSize(safeInt(sp.get("pageSize")));

  // ---------------------
  // 1) Construction du where
  // ---------------------
  const where: Prisma.ListingWhereInput = {};

  // Localisation simple (pays / province / ville)
  if (country) {
    where.country = { equals: country, mode: "insensitive" };
  }
  if (province) {
    // on compare en insensible à la casse, pratique si tu passes "QC" ou "qc"
    where.province = province as ProvinceCA;
  }
  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  // Prix min / max
  if (minPrice != null || maxPrice != null) {
    where.price = {};
    if (minPrice != null) {
      (where.price as Prisma.FloatFilter).gte = minPrice;
    }
    if (maxPrice != null) {
      (where.price as Prisma.FloatFilter).lte = maxPrice;
    }
  }

  // Recherche texte (titre, description, ville, pays)
  if (q) {
    const or: Prisma.ListingWhereInput["OR"] = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
    ];
    if (where.OR && Array.isArray(where.OR)) {
      where.OR = [...where.OR, ...or];
    } else {
      where.OR = or;
    }
  }

  // Bounding box carte (si les 4 coins sont fournis)
  if (neLat != null && neLng != null && swLat != null && swLng != null) {
    where.latPublic = {
      gte: Math.min(swLat, neLat),
      lte: Math.max(swLat, neLat),
    };
    where.lngPublic = {
      gte: Math.min(swLng, neLng),
      lte: Math.max(swLng, neLng),
    };
  }

  // Filtre photo : au moins 1 image
  if (hasPhoto) {
    where.images = {
      some: {},
    };
  }

  // Filtre par note mini : on exige qu'il y ait au moins un avis >= minRating
  if (minRating && minRating >= 1 && minRating <= 5) {
    where.reviews = {
      some: {
        rating: {
          gte: minRating,
        },
      },
    };
  }

  // Filtre par nombre de voyageurs (maxGuests doit être >= au nombre demandé)
  if (guests && guests > 0) {
    where.maxGuests = {
      gte: guests,
    };
  }

  // Filtre disponibilité (pas de booking ni de blocage qui chevauche les dates)
  if (startDate && endDate && endDate > startDate) {
    // Exclure les listings avec des bookings qui chevauchent
    where.bookings = {
      none: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    };
    // Exclure aussi les listings avec des blocages calendrier
    where.calendar = {
      none: {
        start: { lt: endDate },
        end: { gt: startDate },
      },
    };
  }

  // ---------------------
  // 2) Tri
  // ---------------------
  let orderBy: Prisma.ListingOrderByWithRelationInput;

  switch (sort) {
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
    case "rating_desc":
      // On trie par moyenne de rating (desc), puis par date la plus récente
      orderBy = {
        reviews: {
          _avg: {
            rating: "desc",
          },
        },
        createdAt: "desc",
      } as Prisma.ListingOrderByWithRelationInput;
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // ---------------------
  // 3) Pagination (page / pageSize)
  // ---------------------
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    // Compte total pour pagination
    const total = await prisma.listing.count({ where });

    const listings = await prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        images: {
          select: { id: true, url: true },
          take: 4, // on renvoie quelques images pour la grille
        },
        reviews: {
          select: { rating: true },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const pageCount = Math.ceil(total / pageSize);

    // On prépare un petit summary pour les reviews
    const enriched = listings.map((l) => {
      const reviews = l.reviews ?? [];
      const reviewCount = reviews.length;
      const avgRating =
        reviewCount > 0
          ? Number(
              (
                reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              ).toFixed(2),
            )
          : null;

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        type: l.type,
        price: l.price,
        currency: l.currency,
        country: l.country,
        city: l.city,
        maxGuests: l.maxGuests,
        latPublic: l.latPublic,
        lngPublic: l.lngPublic,
        createdAt: l.createdAt,
        owner: l.owner,
        images: l.images,
        reviewSummary: {
          count: reviewCount,
          avgRating,
        },
      };
    });

    return NextResponse.json({
      page,
      pageSize,
      total,
      pageCount,
      items: enriched,
    });
  } catch (e) {
    logger.error("Error in /api/listings/search", e);
    return NextResponse.json(
      { error: "An error occurred while searching" },
      { status: 500 },
    );
  }
}
