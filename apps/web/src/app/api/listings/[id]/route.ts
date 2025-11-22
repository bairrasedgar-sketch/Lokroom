// apps/web/src/app/api/listings/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (e) {
    console.error("GET /api/listings/[id] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PUT /api/listings/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const body = (await req.json().catch(() => null)) as
      | {
          title?: string;
          description?: string;
          price?: number;
          currency?: "EUR" | "CAD";
          country?: string;
          city?: string;
          addressFull?: string;
          lat?: number | null;
          lng?: number | null;
          latPublic?: number | null;
          lngPublic?: number | null;
        }
      | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

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

    // 🔢 Coordonnées : on prend ce qui vient du body si fourni, sinon on garde celles existantes
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
    } catch (coordError: any) {
      return NextResponse.json(
        { error: coordError?.message ?? "Coordonnées invalides." },
        { status: 400 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        title,
        description,
        price: priceNum,
        currency,
        country,
        city,
        addressFull,
        lat,
        lng,
        latPublic,
        lngPublic,
      },
      include: {
        images: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ listing: updated });
  } catch (e) {
    console.error("PUT /api/listings/[id] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE /api/listings/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    await prisma.listing.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/listings/[id] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
