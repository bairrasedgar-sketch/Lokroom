import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createListingSchema, validateRequestBody } from "@/lib/validations";
import type { ProvinceCA } from "@prisma/client";
import { logger } from "@/lib/logger";
import { apiRateLimiter, publicRateLimiter, withRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText, sanitizeRichText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

/**
 * Vérification "propre" des coordonnées côté serveur.
 * - Vérifie les bornes lat/lng
 * - Petit garde-fou France / Canada (évite une annonce France placée au Canada).
 */
function assertValidCoordinates(options: {
  country?: string | null;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
}) {
  const { country, lat, lng } = options;

  // Pas de coordonnées → on laisse passer
  if (lat == null || lng == null) return;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Coordonnées géographiques invalides.");
  }

  // 1. Bornes globales
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Coordonnées géographiques invalides.");
  }

  // 2. Garde-fou simple France / Canada (rien de parfait, juste éviter l'absurde)
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

// GET /api/listings  → liste toutes les annonces avec pagination
export async function GET(req: NextRequest) {
  try {
    // Rate limiting pour routes publiques
    const rateLimitResult = await withRateLimit(req, publicRateLimiter);
    if (rateLimitResult.success !== true) {
      return rateLimitResult;
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          hourlyPrice: true,
          currency: true,
          country: true,
          city: true,
          province: true,
          type: true,
          pricingMode: true,
          latPublic: true,
          lngPublic: true,
          createdAt: true,
          ownerId: true,
          owner: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { avatarUrl: true },
              },
            },
          },
          images: {
            orderBy: { position: "asc" },
            take: 5,
            select: {
              id: true,
              url: true,
              isCover: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count(),
    ]);

    return NextResponse.json({
      listings,
      page,
      pageSize,
      total,
      pageCount: total === 0 ? 0 : Math.ceil(total / pageSize),
    });
  } catch (err) {
    logger.error("GET /api/listings error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/listings → créer une annonce
export async function POST(req: NextRequest) {
  try {
    // Rate limiting pour création d'annonce
    const rateLimitResult = await withRateLimit(req, apiRateLimiter);
    if (rateLimitResult.success !== true) {
      return rateLimitResult;
    }

    const session = await getServerSession(authOptions);

    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        identityStatus: true,
        hostProfile: {
          select: {
            id: true,
            payoutsEnabled: true,
            stripeAccountId: true,
          }
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 🔐 Seuls les hôtes peuvent créer une annonce
    const isHostFlag = !!user.hostProfile;
    const role = user.role;
    const isHost =
      isHostFlag ||
      role === "HOST" ||
      role === "BOTH" ||
      role === "ADMIN";

    if (!isHost) {
      return NextResponse.json(
        {
          error:
            "Seuls les hôtes Lok'Room peuvent créer une annonce. Passez en mode hôte pour continuer.",
          code: "NOT_HOST",
        },
        { status: 403 }
      );
    }

    // 🔐 SÉCURITÉ : Vérification KYC obligatoire pour créer une annonce
    if (user.identityStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error: "Vous devez vérifier votre identité avant de créer une annonce.",
          code: "KYC_REQUIRED",
          identityStatus: user.identityStatus,
        },
        { status: 403 }
      );
    }

    // ℹ️ NOTE : On ne bloque plus la création si Stripe Connect n'est pas configuré
    // L'utilisateur pourra créer son annonce mais devra configurer ses versements
    // pour recevoir ses paiements. On stocke l'info pour afficher un message à la fin.
    const needsStripeSetup = !user.hostProfile?.stripeAccountId || !user.hostProfile?.payoutsEnabled;

    // Validation Zod du body
    const validation = await validateRequestBody(req, createListingSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const data = validation.data;

    // Optionnel : forcer le pays France / Canada côté serveur
    if (!["France", "Canada"].includes(data.country)) {
      return NextResponse.json(
        { error: "Le pays doit être France ou Canada." },
        { status: 400 }
      );
    }

    // ✅ Validation "propre" des coords (brutes et publiques)
    try {
      assertValidCoordinates({
        country: data.country,
        lat: data.lat,
        lng: data.lng,
      });
      assertValidCoordinates({
        country: data.country,
        lat: data.latPublic,
        lng: data.lngPublic,
      });
    } catch (coordError: unknown) {
      const message = coordError instanceof Error ? coordError.message : "Coordonnées invalides.";
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        hourlyPrice: data.priceHourly,
        currency: data.currency,
        country: data.country,
        city: data.city ?? undefined,
        addressFull: data.addressFull,
        addressLine1: data.addressLine1 ?? undefined,
        postalCode: data.postalCode ?? undefined,
        province: (data.province as ProvinceCA | null) ?? undefined,
        regionFR: data.regionFR ?? undefined,
        type: data.type,
        additionalTypes: data.additionalTypes ?? [],
        customType: data.customType ?? undefined,
        pricingMode: data.pricingMode,
        maxGuests: data.maxGuests ?? undefined,
        beds: data.beds ?? undefined,
        desks: data.desks ?? undefined,
        parkings: data.parkings ?? undefined,
        bathrooms: data.bathrooms ?? undefined,
        spaceFeatures: data.spaceFeatures ?? [],
        isInstantBook: data.isInstantBook ?? false,
        discountHours3Plus: data.discountHours3Plus ?? undefined,
        discountHours6Plus: data.discountHours6Plus ?? undefined,
        discountDays3Plus: data.discountDays3Plus ?? undefined,
        discountWeekly: data.discountWeekly ?? undefined,
        discountMonthly: data.discountMonthly ?? undefined,
        ...(data.lat != null && data.lng != null
          ? { lat: data.lat, lng: data.lng }
          : {}),
        ...(data.latPublic != null && data.lngPublic != null
          ? { latPublic: data.latPublic, lngPublic: data.lngPublic }
          : {}),

        // === CONFIGURATION DÉTAILLÉE ===
        bedrooms: data.bedrooms ?? undefined,
        bedConfiguration: data.bedConfiguration ?? undefined,
        bathroomsFull: data.bathroomsFull ?? undefined,
        bathroomsHalf: data.bathroomsHalf ?? undefined,
        bathroomsShared: data.bathroomsShared ?? false,
        spaceType: data.spaceType ?? "ENTIRE_PLACE",

        // Espaces (HOUSE)
        floors: data.floors ?? undefined,
        hasGarden: data.hasGarden ?? false,
        gardenSize: data.gardenSize ?? undefined,
        hasPool: data.hasPool ?? false,
        poolType: data.poolType ?? undefined,
        poolHeated: data.poolHeated ?? false,
        hasSpa: data.hasSpa ?? false,
        hasTerrace: data.hasTerrace ?? false,
        terraceSize: data.terraceSize ?? undefined,
        garageSpaces: data.garageSpaces ?? undefined,

        // Studio spécifique
        studioType: data.studioType ?? undefined,
        studioHeight: data.studioHeight ?? undefined,
        hasGreenScreen: data.hasGreenScreen ?? false,
        hasSoundproofing: data.hasSoundproofing ?? false,

        // Parking/Garage spécifique
        parkingType: data.parkingType ?? undefined,
        parkingCovered: data.parkingCovered ?? false,
        parkingSecured: data.parkingSecured ?? false,
        parkingLength: data.parkingLength ?? undefined,
        parkingWidth: data.parkingWidth ?? undefined,
        parkingHeight: data.parkingHeight ?? undefined,
        hasEVCharger: data.hasEVCharger ?? false,

        // === TARIFICATION AVANCÉE ===
        hourlyIncrement: typeof data.hourlyIncrement === 'number' ? data.hourlyIncrement : 60,
        minDurationMinutes: data.minDurationMinutes ?? undefined,
        maxDurationMinutes: data.maxDurationMinutes ?? undefined,
        advanceNoticeDays: data.advanceNoticeDays ?? 1,
        maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? undefined,

        // Frais supplémentaires
        cleaningFee: data.cleaningFee ?? undefined,
        extraGuestFee: data.extraGuestFee ?? undefined,
        extraGuestThreshold: data.extraGuestThreshold ?? undefined,
        weekendPriceMultiplier: data.weekendPriceMultiplier ?? undefined,

        // === RÉDUCTIONS AVANCÉES ===
        discountHours2Plus: data.discountHours2Plus ?? undefined,
        discountHours4Plus: data.discountHours4Plus ?? undefined,
        discountHours8Plus: data.discountHours8Plus ?? undefined,
        discountDays2Plus: data.discountDays2Plus ?? undefined,
        discountDays5Plus: data.discountDays5Plus ?? undefined,
        discountDays14Plus: data.discountDays14Plus ?? undefined,
        lastMinuteDiscount: data.lastMinuteDiscount ?? undefined,
        lastMinuteDiscountDays: data.lastMinuteDiscountDays ?? undefined,
        earlyBirdDiscount: data.earlyBirdDiscount ?? undefined,
        earlyBirdDiscountDays: data.earlyBirdDiscountDays ?? undefined,
        firstBookingDiscount: data.firstBookingDiscount ?? undefined,

        // === DESCRIPTION ENRICHIE ===
        spaceDescription: data.spaceDescription ?? undefined,
        guestAccessDescription: data.guestAccessDescription ?? undefined,
        neighborhoodDescription: data.neighborhoodDescription ?? undefined,
        transitDescription: data.transitDescription ?? undefined,
        notesDescription: data.notesDescription ?? undefined,
        highlights: data.highlights ?? [],

        // === RÈGLES DE LA MAISON ===
        houseRules: data.houseRules ?? [],
        customHouseRules: data.customHouseRules ?? undefined,
        checkInStart: data.checkInStart ?? undefined,
        checkInEnd: data.checkInEnd ?? undefined,
        checkOutTime: data.checkOutTime ?? undefined,
        selfCheckIn: data.selfCheckIn ?? false,
        checkInMethod: data.checkInMethod ?? undefined,

        // Politiques
        petsAllowed: data.petsAllowed ?? false,
        petTypes: data.petTypes ?? [],
        petFee: data.petFee ?? undefined,
        smokingAllowed: data.smokingAllowed ?? false,
        eventsAllowed: data.eventsAllowed ?? false,
        childrenAllowed: data.childrenAllowed ?? true,
        quietHoursStart: data.quietHoursStart ?? undefined,
        quietHoursEnd: data.quietHoursEnd ?? undefined,

        ownerId: user.id,
      },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    // Ajouter les amenities si fournies
    if (data.amenityIds && data.amenityIds.length > 0) {
      await prisma.listingAmenity.createMany({
        data: data.amenityIds.map((amenityId) => ({
          listingId: listing.id,
          amenityId,
        })),
      });
    }

    return NextResponse.json({
      listing,
      needsStripeSetup,
      message: needsStripeSetup
        ? "Annonce créée ! Configurez vos versements pour recevoir vos paiements."
        : undefined,
    }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/listings error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
