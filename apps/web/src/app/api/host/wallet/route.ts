import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const host = await prisma.hostProfile.findFirst({
    where: { user: { email: session.user.email } },
    select: { userId: true },
  });
  if (!host) return NextResponse.json({ balanceCents: 0, ledger: [] });

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
}
