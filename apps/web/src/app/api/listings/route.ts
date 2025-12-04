import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createListingSchema, validateRequestBody } from "@/lib/validations";

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
    console.error("GET /api/listings error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/listings → créer une annonce
export async function POST(req: NextRequest) {
  try {
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
        hostProfile: { select: { id: true } },
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
            "Seuls les hôtes Lok'Room peuvent créer une annonce. Passe en mode hôte pour continuer.",
        },
        { status: 403 }
      );
    }

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
        type: data.type,
        pricingMode: data.pricingMode,
        ...(data.lat != null && data.lng != null
          ? { lat: data.lat, lng: data.lng }
          : {}),
        ...(data.latPublic != null && data.lngPublic != null
          ? { latPublic: data.latPublic, lngPublic: data.lngPublic }
          : {}),
        ownerId: user.id,
      },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    console.error("POST /api/listings error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
