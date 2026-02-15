// apps/web/src/app/api/listings/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cache, CacheKeys, CacheTTL, invalidateListingCache } from "@/lib/redis/cache-safe";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Même helper que dans /api/listings
 * (dupliqué ici pour rester simple)
 */
function assertValidCoordinates(options: {
  country?: string | null;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
}) {
  const { country, lat, lng } = options;

  if (lat == null || lng == null) return;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Coordonnées géographiques invalides.");
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Coordonnées géographiques invalides.");
  }

  const isRoughlyFrance =
    lat >= 41 && lat <= 51.5 && lng >= -5.5 && lng <= 9.8;

  const isRoughlyCanada =
    lat >= 41 && lat <= 84 && lng >= -141 && lng <= -52;

  if (country === "France" && isRoughlyCanada && !isRoughlyFrance) {
    throw new Error(
      "Les coordonnées semblent être au Canada alors que le pays est 'France'."
    );
  }

  if (country === "Canada" && isRoughlyFrance && !isRoughlyCanada) {
    throw new Error(
      "Les coordonnées semblent être en France alors que le pays est 'Canada'."
    );
  }
}

// GET /api/listings/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 RATE LIMITING: 60 req/min pour GET public
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`listing-get:${ip}`, 60, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Essayer de récupérer depuis le cache
    const cached = await cache.get(
      CacheKeys.listing(params.id),
      async () => {
        // Fallback: récupérer depuis la DB
        const listing = await prisma.listing.findUnique({
          where: { id: params.id },
          include: {
            images: {
              orderBy: { position: "asc" },
            },
            owner: { select: { id: true, name: true, email: true } },
            amenities: {
              include: {
                amenity: {
                  select: {
                    slug: true,
                    label: true,
                  },
                },
              },
            },
          },
        });

        if (!listing) {
          return null;
        }

        // Calculate review stats for SEO
        const reviewStats = await prisma.review.aggregate({
          where: { listingId: params.id },
          _count: { id: true },
          _avg: { rating: true },
        });

        const reviewCount = reviewStats._count.id;
        const avgRating = reviewStats._avg.rating;

        // Transform amenities to simple array
        const amenitiesFormatted = listing.amenities.map((a) => ({
          key: a.amenity.slug,
          label: a.amenity.label,
        }));

        
        const { amenities, ...listingData } = listing;
        return {
          ...listingData,
          amenities: amenitiesFormatted,
          reviewSummary: {
            count: reviewCount,
            avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          },
        };
      },
      CacheTTL.MEDIUM
    );

    if (!cached) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { listing: cached },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    logger.error("GET /api/listings/[id] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PUT /api/listings/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour updates
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`listing-update:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { owner: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (listing.owner.email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Basic required fields
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const currency =
      body.currency === "EUR" || body.currency === "CAD"
        ? body.currency
        : null;
    const country = String(body.country ?? "").trim();
    const city = String(body.city ?? "").trim();
    const addressFull = String(body.addressFull ?? "").trim();
    const priceNum = Number(body.price);

    if (
      !title ||
      !description ||
      !country ||
      !currency ||
      !city ||
      !addressFull ||
      !Number.isFinite(priceNum) ||
      priceNum < 2
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    if (!["France", "Canada"].includes(country)) {
      return NextResponse.json(
        { error: "Le pays doit être France ou Canada." },
        { status: 400 }
      );
    }

    // Coordinates
    const lat =
      body.lat !== undefined && body.lat !== null
        ? Number(body.lat)
        : listing.lat;
    const lng =
      body.lng !== undefined && body.lng !== null
        ? Number(body.lng)
        : listing.lng;
    const latPublic =
      body.latPublic !== undefined && body.latPublic !== null
        ? Number(body.latPublic)
        : listing.latPublic;
    const lngPublic =
      body.lngPublic !== undefined && body.lngPublic !== null
        ? Number(body.lngPublic)
        : listing.lngPublic;

    try {
      assertValidCoordinates({ country, lat, lng });
      assertValidCoordinates({ country, lat: latPublic, lng: lngPublic });
    } catch (coordError: unknown) {
      const error = coordError as { message?: string };
      return NextResponse.json(
        { error: error?.message ?? "Coordonnées invalides." },
        { status: 400 }
      );
    }

    // Validate listing type
    const validTypes = [
      "ROOM", "STUDIO", "APARTMENT", "HOUSE", "OFFICE", "COWORKING",
      "MEETING_ROOM", "PARKING", "GARAGE", "STORAGE", "EVENT_SPACE",
      "RECORDING_STUDIO", "OTHER"
    ];
    const type = validTypes.includes(body.type) ? body.type : listing.type;

    // Validate pricing mode
    const validPricingModes = ["HOURLY", "DAILY", "BOTH"];
    const pricingMode = validPricingModes.includes(body.pricingMode)
      ? body.pricingMode
      : listing.pricingMode;

    // Optional fields
    const addressLine1 = body.addressLine1 !== undefined
      ? String(body.addressLine1 ?? "").trim()
      : listing.addressLine1;
    const postalCode = body.postalCode !== undefined
      ? String(body.postalCode ?? "").trim()
      : listing.postalCode;

    // Province must be a valid ProvinceCA enum value
    const validProvinces = ["AB", "BC", "ON", "QC", "NB", "NS", "NL", "PE"];
    const rawProvince = body.province !== undefined
      ? String(body.province ?? "").trim()
      : listing.province;
    const province = country === "Canada" && rawProvince && validProvinces.includes(rawProvince)
      ? rawProvince as "AB" | "BC" | "ON" | "QC" | "NB" | "NS" | "NL" | "PE"
      : country === "Canada" ? listing.province : null;

    const regionFR = country === "France" && body.regionFR !== undefined
      ? String(body.regionFR ?? "").trim() || null
      : country === "France" ? listing.regionFR : null;
    const customType = type === "OTHER" && body.customType !== undefined
      ? String(body.customType ?? "").trim() || null
      : type === "OTHER" ? listing.customType : null;

    // Numeric optional fields
    const hourlyPrice = body.hourlyPrice !== undefined
      ? (Number(body.hourlyPrice) > 0 ? Number(body.hourlyPrice) : null)
      : listing.hourlyPrice;
    const maxGuests = body.maxGuests !== undefined
      ? (Number.isInteger(Number(body.maxGuests)) && Number(body.maxGuests) > 0 ? Number(body.maxGuests) : null)
      : listing.maxGuests;
    const beds = body.beds !== undefined
      ? (Number.isInteger(Number(body.beds)) && Number(body.beds) > 0 ? Number(body.beds) : null)
      : listing.beds;
    const desks = body.desks !== undefined
      ? (Number.isInteger(Number(body.desks)) && Number(body.desks) > 0 ? Number(body.desks) : null)
      : listing.desks;
    const parkings = body.parkings !== undefined
      ? (Number.isInteger(Number(body.parkings)) && Number(body.parkings) > 0 ? Number(body.parkings) : null)
      : listing.parkings;
    const bathrooms = body.bathrooms !== undefined
      ? (Number.isInteger(Number(body.bathrooms)) && Number(body.bathrooms) > 0 ? Number(body.bathrooms) : null)
      : listing.bathrooms;
    const minNights = body.minNights !== undefined
      ? (Number.isInteger(Number(body.minNights)) && Number(body.minNights) > 0 ? Number(body.minNights) : null)
      : listing.minNights;
    const maxNights = body.maxNights !== undefined
      ? (Number.isInteger(Number(body.maxNights)) && Number(body.maxNights) > 0 ? Number(body.maxNights) : null)
      : listing.maxNights;

    // Discount fields (percentages 0-100)
    const discountHours3Plus = body.discountHours3Plus !== undefined
      ? (Number.isInteger(Number(body.discountHours3Plus)) && Number(body.discountHours3Plus) >= 0 && Number(body.discountHours3Plus) <= 100 ? Number(body.discountHours3Plus) : null)
      : listing.discountHours3Plus;
    const discountHours6Plus = body.discountHours6Plus !== undefined
      ? (Number.isInteger(Number(body.discountHours6Plus)) && Number(body.discountHours6Plus) >= 0 && Number(body.discountHours6Plus) <= 100 ? Number(body.discountHours6Plus) : null)
      : listing.discountHours6Plus;
    const discountDays3Plus = body.discountDays3Plus !== undefined
      ? (Number.isInteger(Number(body.discountDays3Plus)) && Number(body.discountDays3Plus) >= 0 && Number(body.discountDays3Plus) <= 100 ? Number(body.discountDays3Plus) : null)
      : listing.discountDays3Plus;
    const discountWeekly = body.discountWeekly !== undefined
      ? (Number.isInteger(Number(body.discountWeekly)) && Number(body.discountWeekly) >= 0 && Number(body.discountWeekly) <= 100 ? Number(body.discountWeekly) : null)
      : listing.discountWeekly;
    const discountMonthly = body.discountMonthly !== undefined
      ? (Number.isInteger(Number(body.discountMonthly)) && Number(body.discountMonthly) >= 0 && Number(body.discountMonthly) <= 100 ? Number(body.discountMonthly) : null)
      : listing.discountMonthly;

    // Boolean fields
    const isInstantBook = body.isInstantBook !== undefined
      ? Boolean(body.isInstantBook)
      : listing.isInstantBook;

    // Array fields
    const spaceFeatures = Array.isArray(body.spaceFeatures)
      ? body.spaceFeatures.filter((f: unknown) => typeof f === "string")
      : listing.spaceFeatures;

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        title,
        description,
        type,
        customType,
        price: priceNum,
        hourlyPrice,
        pricingMode,
        currency,
        country,
        city,
        addressFull,
        addressLine1,
        postalCode,
        province,
        regionFR,
        lat,
        lng,
        latPublic,
        lngPublic,
        maxGuests,
        beds,
        desks,
        parkings,
        bathrooms,
        spaceFeatures,
        isInstantBook,
        minNights,
        maxNights,
        discountHours3Plus,
        discountHours6Plus,
        discountDays3Plus,
        discountWeekly,
        discountMonthly,
      },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Invalider le cache
    await invalidateListingCache(params.id);

    return NextResponse.json({ listing: updated });
  } catch (e) {
    logger.error("PUT /api/listings/[id] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/listings/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour deletes
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`listing-delete:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { owner: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (listing.owner.email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Vérifier les bookings actifs avant suppression
    const activeBookings = await prisma.booking.count({
      where: {
        listingId: params.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        endDate: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete listing with active bookings",
          code: "ACTIVE_BOOKINGS",
          activeBookingsCount: activeBookings
        },
        { status: 409 }
      );
    }

    await prisma.listing.delete({ where: { id: params.id } });

    // Invalider le cache
    await invalidateListingCache(params.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("DELETE /api/listings/[id] error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
