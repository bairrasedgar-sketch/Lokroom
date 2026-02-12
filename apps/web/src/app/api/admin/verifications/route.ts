/**
 * API Admin - Gestion des vérifications d'identité
 * GET /api/admin/verifications - Liste des vérifications
 * PUT /api/admin/verifications - Actions sur les vérifications
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";
import { logger } from "@/lib/logger";


export async function GET(request: Request) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), 20, 100);
  const status = searchParams.get("status"); // UNVERIFIED, PENDING, VERIFIED, REJECTED
  const search = searchParams.get("search");

  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.identityStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with identity info
    const [users, totalCount, stats] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          identityStatus: true,
          identityStripeSessionId: true,
          identityLastVerifiedAt: true,
          emailVerified: true,
          createdAt: true,
          country: true,
          profile: {
            select: {
              avatarUrl: true,
              phone: true,
              firstName: true,
              lastName: true,
              birthDate: true,
            },
          },
          hostProfile: {
            select: {
              kycStatus: true,
              payoutsEnabled: true,
              stripeAccountId: true,
            },
          },
          _count: {
            select: {
              Listing: true,
              bookings: true,
            },
          },
        },
        orderBy: [
          { identityStatus: "asc" }, // PENDING first
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
      // Stats
      Promise.all([
        prisma.user.count({ where: { identityStatus: "PENDING" } }),
        prisma.user.count({ where: { identityStatus: "VERIFIED" } }),
        prisma.user.count({ where: { identityStatus: "REJECTED" } }),
        prisma.user.count({ where: { identityStatus: "UNVERIFIED" } }),
      ]),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        listingsCount: u._count.Listing,
        bookingsCount: u._count.bookings,
      })),
      stats: {
        pending: stats[0],
        verified: stats[1],
        rejected: stats[2],
        unverified: stats[3],
        total: stats[0] + stats[1] + stats[2] + stats[3],
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error("Erreur API admin verifications:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminPermission("users:verify");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId et action requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, identityStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            identityStatus: "VERIFIED",
            identityLastVerifiedAt: new Date(),
          },
        });

        // Create notification for user
        await prisma.notification.create({
          data: {
            userId,
            type: "IDENTITY_VERIFIED",
            title: "Identité vérifiée",
            message: "Votre identité a été vérifiée avec succès. Vous avez maintenant accès à toutes les fonctionnalités.",
            actionUrl: "/account",
          },
        });

        // Grant badge
        await prisma.userBadge.upsert({
          where: {
            userId_type: { userId, type: "IDENTITY_VERIFIED" },
          },
          create: {
            id: `badge_${userId}_identity`,
            userId,
            type: "IDENTITY_VERIFIED",
          },
          update: {},
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "USER_VERIFIED",
          targetType: "User",
          targetId: userId,
          details: { email: user.email, reason },
          request,
        });

        return NextResponse.json({ success: true, status: "VERIFIED" });
      }

      case "reject": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            identityStatus: "REJECTED",
          },
        });

        // Create notification for user
        await prisma.notification.create({
          data: {
            userId,
            type: "IDENTITY_REJECTED",
            title: "Vérification refusée",
            message: reason || "Votre demande de vérification d'identité a été refusée. Veuillez soumettre des documents valides.",
            actionUrl: "/account/verify",
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "USER_VERIFIED",
          targetType: "User",
          targetId: userId,
          details: { email: user.email, status: "REJECTED", reason },
          request,
        });

        return NextResponse.json({ success: true, status: "REJECTED" });
      }

      case "request_documents": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            identityStatus: "PENDING",
          },
        });

        // Create notification for user
        await prisma.notification.create({
          data: {
            userId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Documents requis",
            message: reason || "Veuillez soumettre vos documents d'identité pour vérification.",
            actionUrl: "/account/verify",
          },
        });

        return NextResponse.json({ success: true, status: "PENDING" });
      }

      case "reset": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            identityStatus: "UNVERIFIED",
            identityStripeSessionId: null,
            identityLastVerifiedAt: null,
          },
        });

        // Remove badge
        await prisma.userBadge.deleteMany({
          where: { userId, type: "IDENTITY_VERIFIED" },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "USER_VERIFIED",
          targetType: "User",
          targetId: userId,
          details: { email: user.email, status: "RESET", reason },
          request,
        });

        return NextResponse.json({ success: true, status: "UNVERIFIED" });
      }

      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error("Erreur action verification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
