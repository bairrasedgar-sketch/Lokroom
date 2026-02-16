import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET - Récupérer l'historique de recherche de l'utilisateur
export async function GET(req: Request) {
  try {
    // 🔒 RATE LIMITING: 30 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`search-history-get:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }

    try {
      const history = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        destination: true,
        startDate: true,
        endDate: true,
        guests: true,
        createdAt: true,
      },
    });

      return NextResponse.json(history);
    } catch (error) {
      logger.error("GET /api/search-history inner error", { error });
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    logger.error("GET /api/search-history error", { error });
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Ajouter une recherche à l'historique
export async function POST(req: NextRequest) {
  try {
    // 🔒 RATE LIMITING: 20 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`search-history-post:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      // Validation Zod du body
      const { saveSearchSchema, validateRequestBody } = await import("@/lib/validations/api");
    const validation = await validateRequestBody(req, saveSearchSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { query, city, country, checkIn, checkOut, guests } = validation.data;
    const destination = query || city || country || "";

    if (!destination) {
      return NextResponse.json({ error: "destination_required" }, { status: 400 });
    }

    // Vérifier si une recherche identique existe déjà récemment
    const existing = await prisma.searchHistory.findFirst({
      where: {
        userId: session.user.id,
        destination: { equals: destination, mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - 60000) }, // Dernière minute
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Limiter à 20 entrées max par utilisateur
    const count = await prisma.searchHistory.count({
      where: { userId: session.user.id },
    });

    if (count >= 20) {
      // Supprimer les plus anciennes
      const oldest = await prisma.searchHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        take: count - 19,
        select: { id: true },
      });

      await prisma.searchHistory.deleteMany({
        where: { id: { in: oldest.map((h) => h.id) } },
      });
    }

    const history = await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        destination: destination.trim(),
        startDate: checkIn || null,
        endDate: checkOut || null,
        guests: guests || null,
      },
    });

      return NextResponse.json(history);
    } catch (error) {
      logger.error("POST /api/search-history inner error", { error });
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
  } catch (error) {
    logger.error("POST /api/search-history error", { error });
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

// DELETE - Effacer l'historique de recherche
export async function DELETE(req: Request) {
  try {
    // 🔒 RATE LIMITING: 10 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`search-history-delete:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      await prisma.searchHistory.deleteMany({
      where: { userId: session.user.id },
    });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error("DELETE /api/search-history inner error", { error });
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }
  } catch (error) {
    logger.error("DELETE /api/search-history error", { error });
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
