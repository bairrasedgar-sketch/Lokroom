// apps/web/src/app/api/listings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/listings  → liste toutes les annonces
export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        images: true,
        owner: true,
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
