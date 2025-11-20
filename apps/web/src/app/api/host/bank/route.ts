// apps/web/src/app/api/host/bank/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { requireHost } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/host/bank",
    hint: "Utilise POST pour lier un compte bancaire (utile en test).",
  });
}

export async function POST(req: Request) {
  try {
    const { session } = await requireHost();

    const userId = (session.user as any).id as string | undefined;

    // 🚦 Rate limit basique : 20 requêtes / minute par host
    const rlKey = userId
      ? `host-bank:${userId}`
      : `host-bank:ip:${req.headers.get("x-forwarded-for") ?? "unknown"}`;

    const { ok } = await rateLimit(rlKey);
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const host = await prisma.hostProfile.findFirst({
      where: { user: { email: session.user.email! } },
      select: { stripeAccountId: true },
    });

    if (!host?.stripeAccountId) {
      return NextResponse.json(
        { error: "Host account missing" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json(
        { error: "Bad JSON" },
        { status: 400 }
      );

    const {
      country,
      currency,
      accountHolderName,
      iban,
      routingNumber,
      accountNumber,
    } = body as {
      country?: string;
      currency?: "eur" | "cad";
      accountHolderName?: string;
      iban?: string;
      routingNumber?: string;
      accountNumber?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let external_account: any;

    if (iban && /^[A-Z]{2}/i.test(iban)) {
      external_account = {
        object: "bank_account",
        country: (country ?? "FR").toUpperCase(),
        currency: (currency ?? "eur").toLowerCase(),
        account_holder_name: accountHolderName || undefined,
        account_number: iban.replace(/\s+/g, ""),
      };
    } else if (
      (country ?? "").toUpperCase() === "CA" &&
      routingNumber &&
      accountNumber
    ) {
      external_account = {
        object: "bank_account",
        country: "CA",
        currency: "cad",
        account_holder_name: accountHolderName || undefined,
        routing_number: routingNumber,
        account_number: accountNumber,
      };
    } else {
      return NextResponse.json(
        { error: "Missing/invalid bank fields" },
        { status: 400 }
      );
    }

    const updated = await stripe.accounts.update(host.stripeAccountId, {
      external_account,
    });

    return NextResponse.json({
      ok: true,
      payoutsEnabled: updated.payouts_enabled,
      externalAccountsCount:
        updated.external_accounts?.data?.length ?? 0,
    });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e?.message === "FORBIDDEN_HOST_ONLY") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const msg = e?.raw?.message || e?.message || "attach_bank_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
