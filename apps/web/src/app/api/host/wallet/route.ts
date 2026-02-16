// apps/web/src/app/api/host/wallet/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHost } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 🔒 RATE LIMITING: 30 req/min pour wallet
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`wallet-get:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

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
      select: {
        id: true,
        deltaCents: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      balanceCents: wallet?.balanceCents ?? 0,
      ledger,
    });
  } catch (e: unknown) {
    const error = e as { message?: string };
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN_HOST_ONLY") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    logger.error("GET /api/host/wallet error", { error: e });
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
