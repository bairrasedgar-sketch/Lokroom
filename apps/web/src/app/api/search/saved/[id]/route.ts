import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 🔒 VALIDATION: Schéma Zod pour l'ID
const searchIdSchema = z.string().min(1, "searchId requis");

/**
 * DELETE /api/search/saved/[id]
 * Supprime une recherche sauvegardée
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 RATE LIMITING: 20 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`search-delete:${ip}`, 20, 60_000);

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

    // 🔒 VALIDATION: Valider l'ID
    let searchId: string;
    try {
      searchId = searchIdSchema.parse(params.id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Invalid search ID" }, { status: 400 });
    }

    // TODO: Supprimer la recherche sauvegardée en DB
    // Pour l'instant, on retourne juste un succès

    return NextResponse.json({ message: "Search deleted" });
  } catch (err) {
    logger.error("DELETE /api/search/saved/[id] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
