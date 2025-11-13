import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/listings  -> liste (simple)
export async function GET() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ listings });
}

// POST /api/listings  -> création
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as {
    title?: string;
    description?: string;
    price?: number;             // float
    currency?: "EUR" | "CAD";
    country?: string;
    city?: string | null;
    // images?: string[] // si tu envoies déjà des URLs
  } | null;

  if (
    !body ||
    !body.title ||
    !body.description ||
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    (body.currency !== "EUR" && body.currency !== "CAD") ||
    !body.country
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const created = await prisma.listing.create({
    data: {
      title: body.title,
      description: body.description,
      price: body.price,                 // float
      currency: body.currency,           // "EUR" | "CAD"
      country: body.country,
      city: body.city ?? null,
      ownerId: user.id,
      // images: { create: (body.images ?? []).map(url => ({ url })) }
    },
    include: {
      images: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ listing: created }, { status: 201 });
}
