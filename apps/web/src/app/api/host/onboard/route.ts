// apps/web/src/app/api/host/onboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getOrigin } from "@/lib/origin";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMITING: 10 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`host-onboard:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Récupère/Crée le hostProfile
    let host = await prisma.hostProfile.findUnique({
      where: { userId: user.id },
    });

    if (!host) {
      host = await prisma.hostProfile.create({
        data: { userId: user.id },
      });
    }

    // IMPORTANT : compte EXPRESS (pas Custom)
    if (!host.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR", // TODO: rendre dynamique FR/CA plus tard
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          lokroomUserId: user.id,
        },
      });

      host = await prisma.hostProfile.update({
        where: { userId: user.id },
        data: { stripeAccountId: account.id },
      });
    }

    const origin = getOrigin();

    const accountLinks = await stripe.accountLinks.create({
      account: host.stripeAccountId!,
      refresh_url: `${origin}/profile`,
      return_url: `${origin}/profile`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLinks.url,
      stripeAccountId: host.stripeAccountId,
    });
  } catch (e: unknown) {
    logger.error("POST /api/host/onboard error", { error: e });
    const error = e as { raw?: { message?: string }; message?: string };
    const msg = error?.raw?.message || error?.message || "onboard_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
