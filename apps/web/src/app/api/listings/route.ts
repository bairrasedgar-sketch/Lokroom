// app/api/listings/route.ts
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported content-type" },
        { status: 400 }
      );
    }

    if (
      !data.title ||
      !data.description ||
      data.price == null ||
      !data.currency ||
      !data.country
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const priceNumber = Number(data.price);
    if (Number.isNaN(priceNumber)) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: priceNumber,
        currency: data.currency,
        country: data.country,
        city: data.city,
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
