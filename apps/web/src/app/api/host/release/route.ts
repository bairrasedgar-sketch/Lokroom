// apps/web/src/app/api/host/release/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { requireHost } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";

type Cur = "EUR" | "CAD";

async function getPlatformAvailable() {
  try {
    const bal = await stripe.balance.retrieve();
    const by: Record<Cur, number> = { EUR: 0, CAD: 0 };

    for (const a of bal.available ?? []) {
      const c = a.currency.toUpperCase();
      if (c === "EUR" || c === "CAD") by[c] += a.amount ?? 0;
    }

    return by;
  } catch {
    return { EUR: 0, CAD: 0 } as Record<Cur, number>;
  }
}

export async function POST(req: Request) {
  try {
    const { session } = await requireHost();

    const url = new URL(req.url);
    const devMode = url.searchParams.get("dev") === "1"; // ▶️ ?dev=1 pour émuler le virement

    const userId = (session.user as any).id as string;

    // 🚦 Rate limit : max 10 releases par heure par host
    const { ok } = await rateLimit(`host-release:${userId}`, 10, 60 * 60 * 1000);
    if (!ok) {
      return NextResponse.json(
        { error: "Too many payout attempts" },
        { status: 429 }
      );
    }

    // Compte connecté Stripe de l'hôte
    const host = await prisma.hostProfile.findFirst({
      where: { user: { email: session.user.email! } },
      select: { userId: true, stripeAccountId: true },
    });

    if (!host?.stripeAccountId) {
      return NextResponse.json(
        { error: "missing_connect_account" },
        { status: 400 }
      );
    }

    // Réservations terminées (CONFIRMED)
    const today = new Date();
    const ended = await prisma.booking.findMany({
      where: {
        listing: { ownerId: host.userId },
        endDate: { lt: today },
        status: "CONFIRMED",
      },
      select: { id: true, totalPrice: true, currency: true },
    });

    if (ended.length === 0) {
      return NextResponse.json({ ok: true, released: 0, results: [] });
    }

    // Somme due par devise (en cents) — total des bookings soldées
    const dueByCurrency: Record<Cur, number> = { EUR: 0, CAD: 0 };
    for (const b of ended) {
      const cents = Math.round(b.totalPrice * 100);
      dueByCurrency[b.currency as Cur] += cents;
    }

    // Solde Wallet de l'hôte dans l'app
    const wallet = await prisma.wallet.findUnique({
      where: { hostId: host.userId },
      select: { balanceCents: true },
    });

    let remaining = wallet?.balanceCents ?? 0;
    if (remaining <= 0) {
      return NextResponse.json({ ok: true, released: 0, results: [] });
    }

    // Solde Stripe plateforme
    const platformBalance = await getPlatformAvailable(); // { EUR, CAD } en cents

    const results: Array<{
      currency: Cur;
      amountCents: number;
      transferId: string;
    }> = [];

    const skipped: Array<{
      currency: Cur;
      reason: string;
      wantedCents: number;
      availableCents: number;
    }> = [];

    const errors: Array<{
      currency: Cur;
      reason: string;
      wantedCents: number;
    }> = [];

    for (const currencyKey of ["EUR", "CAD"] as const) {
      if (remaining <= 0) break;

      const amountDue = dueByCurrency[currencyKey]; // ce que l'on DOIT à l'hôte pour les bookings finies
      if (amountDue <= 0) continue;

      // On ne peut pas dépasser le wallet
      const want = Math.min(remaining, amountDue);

      if (!devMode) {
        // En mode réel, on exige que la plateforme ait assez dans la même devise
        const platAvail = platformBalance[currencyKey];
        if (platAvail <= 0 || platAvail < want) {
          skipped.push({
            currency: currencyKey,
            reason: "insufficient_platform_balance",
            wantedCents: want,
            availableCents: platAvail,
          });
          continue;
        }
      }

      try {
        let transferId = `dev_${Date.now()}`;

        if (!devMode) {
          const transfer = await stripe.transfers.create({
            amount: want,
            currency: currencyKey.toLowerCase(), // "eur" | "cad"
            destination: host.stripeAccountId,
            metadata: { userId: host.userId, reason: "release_payout" },
          });
          transferId = transfer.id;
        }

        await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { hostId: host.userId },
            data: { balanceCents: { decrement: want } },
          });

          await tx.walletLedger.create({
            data: {
              hostId: host.userId,
              deltaCents: -want, // débit
              reason: devMode
                ? `release_payout_dev:${currencyKey}`
                : `release_payout:${currencyKey}`,
            },
          });
        });

        remaining -= want;
        results.push({ currency: currencyKey, amountCents: want, transferId });
      } catch {
        errors.push({
          currency: currencyKey,
          reason: "stripe_transfer_failed",
          wantedCents: want,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      released: results.length,
      results,
      skipped,
      errors,
      platformBalance: { eur: platformBalance.EUR, cad: platformBalance.CAD },
    });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e?.message === "FORBIDDEN_HOST_ONLY") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
