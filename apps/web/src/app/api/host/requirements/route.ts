// apps/web/src/app/api/host/requirements/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = await prisma.hostProfile.findFirst({
    where: { user: { email: session.user.email } },
    select: { stripeAccountId: true },
  });

  if (!host?.stripeAccountId) {
    return NextResponse.json(
      { error: "Host account missing" },
      { status: 404 },
    );
  }

  const acc = await stripe.accounts.retrieve(host.stripeAccountId);

  // KYC “live” depuis Stripe
  const currently_due = acc.requirements?.currently_due ?? [];
  const eventually_due = acc.requirements?.eventually_due ?? [];
  const past_due = acc.requirements?.past_due ?? [];

  const kycStatus =
    currently_due.length === 0 && past_due.length === 0
      ? "complete"
      : "incomplete";

  const payoutsEnabled = acc.payouts_enabled === true;

  // Sync HostProfile (optionnel mais propre)
  await prisma.hostProfile.updateMany({
    where: { stripeAccountId: host.stripeAccountId },
    data: {
      kycStatus,
      payoutsEnabled,
    },
  });

  // Si KYC complet → promeut l'utilisateur en HOST
  if (kycStatus === "complete") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { role: "HOST" },
    });
  }

  return NextResponse.json({
    payoutsEnabled,
    kycStatus,
    requirements: { currently_due, eventually_due, past_due },
  });
}
