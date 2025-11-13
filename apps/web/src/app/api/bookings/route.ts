import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { computeFees, inferRegion } from "@/lib/fees";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BookingStatusLiteral = "PENDING" | "CONFIRMED" | "CANCELLED";

function daysDiff(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

// GET /api/bookings -> réservations du user connecté (guest)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ bookings: [] });

  const bookings = await prisma.booking.findMany({
    where: { guestId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          images: { select: { id: true, url: true }, take: 1 },
        },
      },
    },
  });

  return NextResponse.json({ bookings });
}

// POST /api/bookings -> crée une réservation + PaymentIntent Stripe
// body: { listingId: string; startDate: "YYYY-MM-DD"; endDate: "YYYY-MM-DD" }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    listingId?: string;
    startDate?: string;
    endDate?: string;
  } | null;

  if (!body?.listingId || !body?.startDate || !body?.endDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const start = new Date(`${body.startDate}T00:00:00.000Z`);
  const end = new Date(`${body.endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !(end > start)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // On sélectionne aussi pays/province (ProvinceCA?) pour déterminer la région de frais
  const listing = await prisma.listing.findUnique({
    where: { id: body.listingId },
    select: {
      id: true,
      price: true,
      currency: true,
      ownerId: true,
      country: true,
      province: true, // enum ProvinceCA? (nullable)
    },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Empêcher de réserver sa propre annonce
  if (listing.ownerId === me.id) {
    return NextResponse.json({ error: "You cannot book your own listing." }, { status: 400 });
  }

  // Sécurité: si Canada + devise CAD mais pas de province => on refuse (barème provincial)
  if (
    listing.currency === "CAD" &&
    (listing.country?.toLowerCase() === "canada" || listing.country?.toLowerCase() === "ca") &&
    !listing.province
  ) {
    return NextResponse.json(
      { error: "Province is required for Canadian listings (QC/ON/BC/AB/NB/NS/NL/PE)." },
      { status: 400 }
    );
  }

  // Chevauchement (PENDING/CONFIRMED)
  const overlapping = await prisma.booking.findFirst({
    where: {
      listingId: listing.id,
      status: { in: ["CONFIRMED", "PENDING"] as BookingStatusLiteral[] },
      startDate: { lt: end },
      endDate: { gt: start },
    },
    select: { id: true },
  });
  if (overlapping) {
    return NextResponse.json(
      { error: "Dates not available for this listing." },
      { status: 409 }
    );
  }

  const nights = daysDiff(start, end);
  if (nights <= 0) {
    return NextResponse.json({ error: "Invalid nights count" }, { status: 400 });
  }

  const baseTotal = Number((listing.price * nights).toFixed(2)); // prix de base (sans frais)
  const priceCents = Math.round(baseTotal * 100);
  const currency = listing.currency as "EUR" | "CAD";

  // Déterminer la région (FRANCE/AB/BC/ON/QC/ATL) à partir de country + province (enum)
  const region = inferRegion({
    currency,
    country: listing.country,
    provinceCode: listing.province ?? null, // accepte enum Prisma ou string
  });

  // Calcul des frais selon TON barème
  const fees = computeFees({ priceCents, currency, region });

  // 🔁 Idempotence applicative : réutilise une PENDING identique
  const existing = await prisma.booking.findFirst({
    where: {
      guestId: me.id,
      listingId: listing.id,
      startDate: start,
      endDate: end,
      status: "PENDING",
    },
    select: {
      id: true,
      currency: true,
      listing: { select: { ownerId: true } },
      totalPrice: true,
    },
  });

  const booking =
    existing ??
    (await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: me.id,
        startDate: start,
        endDate: end,
        totalPrice: baseTotal,
        currency,
        status: "PENDING",
        // (colonnes optionnelles si tu veux les persister plus tard)
        // feeHostCents: fees.hostFeeCents,
        // feeGuestCents: fees.guestFeeCents,
        // feeTaxGuestCents: fees.taxOnGuestFeeCents,
        // feeRegion: region,
      },
      select: {
        id: true,
        currency: true,
        listing: { select: { ownerId: true } },
        totalPrice: true,
      },
    }));

  // ✅ Idempotency-Key Stripe : header client ou clé stable fallback
  const headerKey = req.headers.get("idempotency-key") ?? undefined;
  const fallbackKey = [
    "book",
    me.id,
    listing.id,
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
    String(priceCents),
    region,
  ].join(":");
  const idempotencyKey = headerKey || fallbackKey;

  // PaymentIntent sur le total débité au client (base + fees guest + taxes fees)
  const currencyStripe = currency.toLowerCase() as Stripe.PaymentIntentCreateParams["currency"];

  const intent = await stripe.paymentIntents.create(
    {
      amount: fees.chargeCents,
      currency: currencyStripe,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking.id,
        listingId: listing.id,
        hostUserId: booking.listing.ownerId,
        currency: booking.currency, // "EUR" | "CAD"
        fee_host_cents: String(fees.hostFeeCents),
        fee_guest_cents: String(fees.guestFeeCents),
        fee_tax_guest_cents: String(fees.taxOnGuestFeeCents),
        fee_region: String(region),
        price_cents: String(priceCents),
        charge_cents: String(fees.chargeCents),
      },
    },
    { idempotencyKey }
  );

  return NextResponse.json(
    {
      bookingId: booking.id,
      amount: booking.totalPrice, // base (pour affichage)
      currency: booking.currency,
      hostUserId: booking.listing.ownerId,
      payment: { clientSecret: intent.client_secret },
      breakdown: {
        priceCents,
        hostFeeCents: fees.hostFeeCents,
        guestFeeCents: fees.guestFeeCents,
        taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
        chargeCents: fees.chargeCents,
        region,
      },
    },
    { status: 201 }
  );
}
