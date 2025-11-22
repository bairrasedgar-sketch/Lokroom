// apps/web/src/app/api/listings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

  // 2. Garde-fou simple France / Canada (rien de parfait, juste éviter l’absurde)
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

// GET /api/listings  → liste toutes les annonces
export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        owner: true,
        images: {
          orderBy: {
            position: "asc", // 👈 images triées dans l’ordre
          } as any,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("GET /api/listings error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/listings → créer une annonce
export async function POST(req: Request) {
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const contentType = req.headers.get("content-type") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {};

    if (contentType.includes("application/json")) {
      data = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      data = {
        title: form.get("title") as string,
        description: form.get("description") as string,
        price: Number(form.get("price")),
        currency: form.get("currency") as string,
        country: form.get("country") as string,
        city: (form.get("city") as string) || null,
        addressFull: (form.get("addressFull") as string) || "",
        lat: form.get("lat"),
        lng: form.get("lng"),
        latPublic: form.get("latPublic"),
        lngPublic: form.get("lngPublic"),
        // en multipart on ne gère pas les images ici (elles sont uploadées séparément)
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported content-type" },
        { status: 400 }
      );
    }

    // Validation minimale côté serveur
    if (
      !data.title ||
      !data.description ||
      data.price == null ||
      !data.currency ||
      !data.country ||
      !data.city ||
      !data.addressFull
    ) {
      return NextResponse.json(
        {
          error:
            "Champs requis manquants (titre, description, prix, devise, pays, ville, adresse).",
        },
        { status: 400 }
      );
    }

    // Optionnel : forcer le pays France / Canada côté serveur
    if (!["France", "Canada"].includes(data.country)) {
      return NextResponse.json(
        { error: "Le pays doit être France ou Canada." },
        { status: 400 }
      );
    }

    const priceNumber = Number(data.price);
    if (!Number.isFinite(priceNumber)) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    if (priceNumber < 2) {
      return NextResponse.json(
        { error: "Le prix minimum est de 2 (EUR ou CAD)." },
        { status: 400 }
      );
    }

    // Parsing des coordonnées éventuelles
    const lat =
      data.lat !== undefined && data.lat !== null
        ? Number(data.lat)
        : undefined;
    const lng =
      data.lng !== undefined && data.lng !== null
        ? Number(data.lng)
        : undefined;
    const latPublic =
      data.latPublic !== undefined && data.latPublic !== null
        ? Number(data.latPublic)
        : undefined;
    const lngPublic =
      data.lngPublic !== undefined && data.lngPublic !== null
        ? Number(data.lngPublic)
        : undefined;

    // ✅ Validation "propre" des coords (brutes et publiques)
    try {
      assertValidCoordinates({
        country: data.country,
        lat,
        lng,
      });
      assertValidCoordinates({
        country: data.country,
        lat: latPublic,
        lng: lngPublic,
      });
    } catch (coordError: any) {
      return NextResponse.json(
        { error: coordError?.message ?? "Coordonnées invalides." },
        { status: 400 }
      );
    }

    // 👇 Récupération éventuelle des images (JSON seulement)
    // On attend un tableau de strings : images: ["url1", "url2", ...]
    const images: string[] = Array.isArray(data.images)
      ? data.images.filter(
          (u: unknown) => typeof u === "string" && u.trim().length > 0
        )
      : [];

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: priceNumber,
        currency: data.currency,
        country: data.country,
        city: data.city,
        addressFull: data.addressFull,
        ...(Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat: lat as number, lng: lng as number }
          : {}),
        ...(Number.isFinite(latPublic) && Number.isFinite(lngPublic)
          ? {
              latPublic: latPublic as number,
              lngPublic: lngPublic as number,
            }
          : {}),
        ownerId: user.id,

        // ✅ Création des images avec isCover + position
        ...(images.length
          ? {
              images: {
                create: images.map((url, index) => ({
                  url,
                  position: index,
                  isCover: index === 0,
                })),
              },
            }
          : {}),
      },
      include: {
        images: {
          orderBy: { position: "asc" } as any,
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
