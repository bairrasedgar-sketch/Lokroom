import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic"; // pas de cache pour cette route

// GET /api/listings/[id]
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ listing });
  } catch (e) {
    console.error("GET /api/listings/[id] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PUT /api/listings/[id]  (update complet)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { owner: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (listing.owner.email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as {
      title?: string;
      description?: string;
      price?: number;
      currency?: "EUR" | "CAD";
      country?: string;
      city?: string | null;
    } | null;

    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // — mini validation “maison” simple et claire
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const currency = body.currency === "EUR" || body.currency === "CAD" ? body.currency : null;
    const country = String(body.country ?? "").trim();
    const city = body.city === null ? null : String(body.city ?? "").trim();
    const priceNum = Number(body.price);

    if (
      !title ||
      !description ||
      !country ||
      !currency ||
      !Number.isFinite(priceNum) ||
      priceNum < 0
    ) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        title,
        description,
        price: priceNum,    // Float
        currency,           // "EUR" | "CAD"
        country,
        city,
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

// DELETE /api/listings/[id] (optionnel mais pratique)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { owner: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
