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
      { status: 404 }
    );
  }

  const acc = await stripe.accounts.retrieve(host.stripeAccountId);

  // ✅ KYC “live” depuis Stripe (pas notre champ local)
  const currently_due = acc.requirements?.currently_due ?? [];
  const eventually_due = acc.requirements?.eventually_due ?? [];
  const past_due = acc.requirements?.past_due ?? [];
  const kycStatus = currently_due.length === 0 ? "complete" : "incomplete";

  // ✅ Si KYC complet → on promeut l'utilisateur en HOST dans la BDD
  if (kycStatus === "complete") {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { role: "HOST" },
    });
  }

  return NextResponse.json({
    payoutsEnabled: acc.payouts_enabled === true,
    kycStatus,
    requirements: { currently_due, eventually_due, past_due },
  });
}
