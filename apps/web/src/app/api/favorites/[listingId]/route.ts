import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

// 🔒 VALIDATION: Schéma Zod pour listingId
const listingIdSchema = z.string().min(1, "listingId requis");

// Vérifier si l'annonce est déjà en favoris
export async function GET(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    // 🔒 RATE LIMITING: 30 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`favorite-get:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, favorited: false }, { status: 200 });
    }

    // 🔒 VALIDATION: Valider le listingId
    let listingId: string;
    try {
      listingId = listingIdSchema.parse(params.listingId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const fav = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id!,
          listingId,
        },
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true, favorited: !!fav });
  } catch (error) {
    logger.error("GET /api/favorites/[listingId] error", { error, listingId: params.listingId });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Ajouter en favoris (optionnellement dans une wishlist)
export async function POST(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    // 🔒 RATE LIMITING: 20 req/min pour ajout favoris
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`favorite-add:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 VALIDATION: Valider le listingId
    let listingId: string;
    try {
      listingId = listingIdSchema.parse(params.listingId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

  // Vérifier le rôle de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Seuls GUEST, BOTH et ADMIN peuvent ajouter aux favoris
  // HOST pur ne peut pas (il est hôte uniquement, pas voyageur)
  if (user?.role === "HOST") {
    return NextResponse.json(
      { error: "Les hôtes ne peuvent pas ajouter aux favoris. Active le mode voyageur pour ajouter des favoris." },
      { status: 403 }
    );
  }

  // vérifie que l'annonce existe
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Récupérer le wishlistId optionnel du body
  let wishlistId: string | null = null;
  try {
    const body = await req.json();
    wishlistId = body.wishlistId || null;
  } catch {
    // Pas de body JSON, c'est OK
  }

  // Si wishlistId fourni, vérifier qu'il appartient à l'utilisateur
  if (wishlistId) {
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, userId: session.user.id },
    });
    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }
  }

    const fav = await prisma.favorite.upsert({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
      update: { wishlistId },
      create: {
        userId: session.user.id,
        listingId,
        wishlistId,
      },
    });

    return NextResponse.json({ ok: true, favorite: fav }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/favorites/[listingId] error", { error, listingId: params.listingId });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Retirer des favoris
export async function DELETE(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    // 🔒 RATE LIMITING: 20 req/min pour suppression favoris
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`favorite-delete:${ip}`, 20, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 VALIDATION: Valider le listingId
    let listingId: string;
    try {
      listingId = listingIdSchema.parse(params.listingId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    await prisma.favorite.delete({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("DELETE /api/favorites/[listingId] error", { error, listingId: params.listingId });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
