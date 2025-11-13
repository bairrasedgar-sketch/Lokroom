// apps/web/src/app/api/seed-wallet/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden_in_prod" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    route: "/api/seed-wallet",
    hint: "POST: crée une booking CONFIRMED terminée (200 €) ET crédite TON wallet de 200 €.",
  });
}

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "forbidden_in_prod" }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hôte = l’utilisateur connecté
    const hostUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!hostUser) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    // Guest factice
    const guestEmail = "dev-guest@example.com";
    let guest = await prisma.user.findUnique({ where: { email: guestEmail }, select: { id: true } });
    if (!guest) {
      guest = await prisma.user.create({
        data: { email: guestEmail, name: "Dev Guest" },
        select: { id: true },
      });
    }

    // Listing EUR (100€/nuit) appartenant à l’hôte
    let listing = await prisma.listing.findFirst({
      where: { ownerId: hostUser.id, currency: "EUR" },
      select: { id: true, price: true, currency: true, ownerId: true },
      orderBy: { createdAt: "desc" },
    });

    if (!listing) {
      listing = await prisma.listing.create({
        data: {
          title: "DEV — Listing de test",
          description: "Listing seed pour tests release.",
          price: 100, // 100 €/nuit -> 2 nuits = 200 €
          currency: "EUR",
          country: "France",
          city: "Paris",
          ownerId: hostUser.id,
        },
        select: { id: true, price: true, currency: true, ownerId: true },
      });
    }

    // Période terminée (2 nuits)
    const today = new Date();
    const start = new Date(today); start.setDate(start.getDate() - 3);
    const end = new Date(today);   end.setDate(end.getDate() - 1);

    // Booking CONFIRMED terminée de 200 €
    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        startDate: start,
        endDate: end,
        totalPrice: 200,
        currency: "EUR",
        status: "CONFIRMED",
      },
      select: { id: true },
    });

    // Créditer TON wallet de 200 € + ledger
    const cents = 20000;
    await prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { hostId: hostUser.id },
        update: { balanceCents: { increment: cents } },
        create: { hostId: hostUser.id, balanceCents: cents },
      });
      await tx.walletLedger.create({
        data: {
          hostId: hostUser.id,
          deltaCents: cents,
          reason: `dev_seed_wallet_200_eur:${booking.id}`,
          bookingId: booking.id,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      creditedCents: cents,
      message: "OK : booking terminée (200 €) + wallet crédité (200 €). Lance POST /api/host/release.",
    });
  } catch (e) {
    console.error("seed-wallet error:", e);
    return NextResponse.json({ error: "seed_wallet_failed" }, { status: 500 });
  }
}
