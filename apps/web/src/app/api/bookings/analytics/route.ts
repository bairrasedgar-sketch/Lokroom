// apps/web/src/app/api/host/analytics/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getHostAnalytics } from "@/lib/hostAnalytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/analytics
 *
 * → Retourne un résumé mensuel :
 *   - nombre de réservations
 *   - montant brut
 *   - payout hôte estimé
 *   - marge plateforme estimée
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  const points = await getHostAnalytics(me.id);

  return NextResponse.json({
    analytics: points,
  });
}
