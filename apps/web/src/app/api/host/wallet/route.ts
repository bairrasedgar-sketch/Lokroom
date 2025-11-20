// apps/web/src/app/api/host/wallet/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHost } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await requireHost();

    const host = await prisma.hostProfile.findFirst({
      where: { user: { email: session.user.email! } },
      select: { userId: true },
    });
    if (!host) {
      return NextResponse.json({ balanceCents: 0, ledger: [] });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { hostId: host.userId },
      select: { balanceCents: true },
    });

    const ledger = await prisma.walletLedger.findMany({
      where: { hostId: host.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, deltaCents: true, reason: true, createdAt: true },
    });

    return NextResponse.json({
      balanceCents: wallet?.balanceCents ?? 0,
      ledger,
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
