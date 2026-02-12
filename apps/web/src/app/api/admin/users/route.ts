/**
 * API Admin - Liste des utilisateurs
 * GET /api/admin/users
 *
 * Pagination, recherche et filtres
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";
import type { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";


export async function GET(request: Request) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
    const page = parsePageParam(searchParams.get("page"));
    const pageSize = parseLimitParam(searchParams.get("pageSize"), 20, 100);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const verified = searchParams.get("verified");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Construire les filtres
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role as Prisma.EnumRoleFilter["equals"];
    }

    if (verified === "true") {
      where.emailVerified = { not: null };
    } else if (verified === "false") {
      where.emailVerified = null;
    }

    // Construire l'ordre de tri
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder as "asc" | "desc";
    } else if (sortBy === "email") {
      orderBy.email = sortOrder as "asc" | "desc";
    } else if (sortBy === "name") {
      orderBy.name = sortOrder as "asc" | "desc";
    }

    // Stats par rôle
    const [roleStats, total, users] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          country: true,
          createdAt: true,
          lastLoginAt: true,
          emailVerified: true,
          identityStatus: true,
          profile: {
            select: {
              avatarUrl: true,
              phone: true,
            },
          },
          hostProfile: {
            select: {
              superhost: true,
              payoutsEnabled: true,
            },
          },
          _count: {
            select: {
              Listing: true,
              bookings: true,
              reviewsWritten: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Transformer les stats en objet
    const stats = {
      total: 0,
      byRole: {} as Record<string, number>,
    };
    roleStats.forEach((s) => {
      stats.byRole[s.role] = s._count.role;
      stats.total += s._count.role;
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        country: u.country,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        emailVerified: !!u.emailVerified,
        identityStatus: u.identityStatus,
        avatarUrl: u.profile?.avatarUrl,
        phone: u.profile?.phone,
        superhost: u.hostProfile?.superhost || false,
        payoutsEnabled: u.hostProfile?.payoutsEnabled || false,
        listingsCount: u._count.Listing,
        bookingsCount: u._count.bookings,
        reviewsCount: u._count.reviewsWritten,
      })),
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
      stats,
    });
  } catch (error) {
    logger.error("Erreur API admin users:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
