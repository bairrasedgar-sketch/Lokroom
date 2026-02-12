/**
 * API Admin - Codes promo
 * GET /api/admin/promos - Liste
 * POST /api/admin/promos - Créer
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";
import type { Prisma, PromoType } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("promos:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
    const page = parsePageParam(searchParams.get("page"));
    const pageSize = parseLimitParam(searchParams.get("pageSize"), 20, 100);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Construire les filtres
    const where: Prisma.PromoCodeWhereInput = {};

    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    if (status === "active") {
      where.isActive = true;
      where.OR = [
        { validUntil: null },
        { validUntil: { gte: new Date() } },
      ];
    } else if (status === "expired") {
      where.validUntil = { lt: new Date() };
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [promos, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          User: {
            select: { name: true, email: true },
          },
          _count: {
            select: { usages: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.promoCode.count({ where }),
    ]);

    return NextResponse.json({
      promos: promos.map((p) => ({
        id: p.id,
        code: p.code,
        type: p.type,
        value: p.value,
        maxUses: p.maxUses,
        usedCount: p.usedCount,
        maxPerUser: p.maxPerUser,
        minBookingAmountCents: p.minBookingAmountCents,
        validFrom: p.validFrom,
        validUntil: p.validUntil,
        firstBookingOnly: p.firstBookingOnly,
        newUsersOnly: p.newUsersOnly,
        isActive: p.isActive,
        createdAt: p.createdAt,
        createdBy: p.User,
        totalUsages: p._count.usages,
      })),
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Erreur API admin promos:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission("promos:create");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const {
      code,
      type,
      value,
      maxUses,
      maxPerUser,
      minBookingAmountCents,
      validFrom,
      validUntil,
      firstBookingOnly,
      newUsersOnly,
      isActive,
    } = body;

    // Validation
    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Code, type et valeur requis" },
        { status: 400 }
      );
    }

    // Vérifier l'unicité du code
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ce code existe déjà" },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        type: type as PromoType,
        value: parseInt(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxPerUser: maxPerUser ? parseInt(maxPerUser) : 1,
        minBookingAmountCents: minBookingAmountCents
          ? parseInt(minBookingAmountCents)
          : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        firstBookingOnly: firstBookingOnly || false,
        newUsersOnly: newUsersOnly || false,
        isActive: isActive !== false,
        createdById: auth.session.user.id,
      },
    });

    // Log
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "PROMO_CREATED",
      targetType: "PromoCode",
      targetId: promo.id,
      details: { code: promo.code, type: promo.type, value: promo.value },
      request,
    });

    return NextResponse.json({ promo });
  } catch (error) {
    console.error("Erreur création promo:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
