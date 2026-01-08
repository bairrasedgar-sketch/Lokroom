/**
 * API Admin - Détail d'un utilisateur
 * GET /api/admin/users/[id]
 * PUT /api/admin/users/[id] - Modifier un utilisateur
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        hostProfile: true,
        wallet: true,
        UserBadge: true,
        Listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            price: true,
            currency: true,
            isActive: true,
            rating: true,
            viewCount: true,
            createdAt: true,
            images: {
              where: { isCover: true },
              take: 1,
              select: { url: true },
            },
            ListingModeration: {
              select: { status: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            currency: true,
            status: true,
            createdAt: true,
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
                images: {
                  where: { isCover: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        reviewsWritten: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            listing: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reviewsReceived: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        disputesOpened: {
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        UserBan_UserBan_userIdToUser: {
          orderBy: { createdAt: "desc" },
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            read: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            Listing: true,
            bookings: true,
            reviewsWritten: true,
            reviewsReceived: true,
            disputesOpened: true,
            messages: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Calculer les statistiques supplémentaires
    const activeBan = user.UserBan_UserBan_userIdToUser.find(b => b.isActive);
    const banHistory = user.UserBan_UserBan_userIdToUser;

    // Calculer les revenus totaux si c'est un hôte
    const totalRevenue = await prisma.booking.aggregate({
      where: {
        listing: { ownerId: id },
        status: "CONFIRMED",
      },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Calculer les dépenses totales si c'est un voyageur
    const totalSpent = await prisma.booking.aggregate({
      where: {
        guestId: id,
        status: "CONFIRMED",
      },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Récupérer les notes admin
    const adminNotes = await prisma.adminNote.findMany({
      where: {
        targetType: "User",
        targetId: id,
      },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer l'historique des actions admin sur cet utilisateur
    const auditHistory = await prisma.auditLog.findMany({
      where: {
        entityType: "User",
        entityId: id,
      },
      include: {
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        emailVerified: user.emailVerified,
        identityStatus: user.identityStatus,
        profile: user.profile,
        hostProfile: user.hostProfile,
        wallet: user.wallet,
        badges: user.UserBadge,
        listings: user.Listing.map(l => ({
          ...l,
          coverImage: l.images[0]?.url || null,
          status: l.ListingModeration?.status || "DRAFT",
        })),
        bookings: user.bookings.map(b => ({
          ...b,
          coverImage: b.listing.images[0]?.url || null,
        })),
        reviewsWritten: user.reviewsWritten,
        reviewsReceived: user.reviewsReceived,
        disputes: user.disputesOpened,
        notifications: user.notifications,
        ban: activeBan ? {
          id: activeBan.id,
          reason: activeBan.reason,
          expiresAt: activeBan.expiresAt,
          createdAt: activeBan.createdAt,
        } : null,
        banHistory,
        stats: {
          ...user._count,
          totalRevenueAsHost: totalRevenue._sum.totalPrice || 0,
          totalBookingsAsHost: totalRevenue._count,
          totalSpentAsGuest: totalSpent._sum.totalPrice || 0,
          totalBookingsAsGuest: totalSpent._count,
          avgRatingReceived: user.profile?.ratingAvg || 0,
          ratingCount: user.profile?.ratingCount || 0,
        },
        adminNotes,
        auditHistory,
      },
    });
  } catch (error) {
    console.error("Erreur API admin user detail:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:edit");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { email, name, role, country, emailVerified, identityStatus } = body;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true, identityStatus: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: "Cette adresse email est déjà utilisée" },
          { status: 400 }
        );
      }
    }

    // Construire les données de mise à jour
    const updateData: Record<string, unknown> = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (country !== undefined) updateData.country = country;
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified ? new Date() : null;
    }
    if (identityStatus !== undefined) updateData.identityStatus = identityStatus;

    // Mettre à jour
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        identityStatus: true,
        emailVerified: true,
      },
    });

    // Log l'action appropriée
    if (email && email !== existingUser.email) {
      await logAdminAction({
        adminId: auth.session.user.id,
        action: "USER_EMAIL_CHANGED",
        targetType: "User",
        targetId: id,
        details: {
          previousEmail: existingUser.email,
          newEmail: email,
        },
        request,
      });
    } else if (role && role !== existingUser.role) {
      await logAdminAction({
        adminId: auth.session.user.id,
        action: "USER_ROLE_CHANGED",
        targetType: "User",
        targetId: id,
        details: {
          previousRole: existingUser.role,
          newRole: role,
        },
        request,
      });
    } else if (identityStatus && identityStatus !== existingUser.identityStatus) {
      await logAdminAction({
        adminId: auth.session.user.id,
        action: "USER_VERIFIED",
        targetType: "User",
        targetId: id,
        details: {
          previousStatus: existingUser.identityStatus,
          newStatus: identityStatus,
        },
        request,
      });
    } else {
      await logAdminAction({
        adminId: auth.session.user.id,
        action: "USER_UPDATED",
        targetType: "User",
        targetId: id,
        details: body,
        request,
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Erreur API admin user update:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
