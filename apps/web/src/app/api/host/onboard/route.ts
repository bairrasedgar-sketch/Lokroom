// apps/web/src/app/api/host/onboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getOrigin } from "@/lib/origin";

export async function POST() {
  try {
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
    let host = await prisma.hostProfile.findUnique({ where: { userId: user.id } });
    if (!host) {
      host = await prisma.hostProfile.create({ data: { userId: user.id } });
    }

    // IMPORTANT : on crée un compte **EXPRESS** (pas Custom)
    if (!host.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express", // 👈 EXPRESS
        country: "FR",   // ou "CA" selon ton hôte
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
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

    return NextResponse.json({ url: accountLinks.url });
  } catch (e: any) {
    console.error("host/onboard error:", e);
    const msg = e?.raw?.message || e?.message || "onboard_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
