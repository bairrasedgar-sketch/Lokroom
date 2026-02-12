/**
 * API Admin - Actions sur une annonce
 * GET /api/admin/listings/[id] - Détail complet
 * PUT /api/admin/listings/[id] - Modifier le statut de modération
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";
import type { ListingStatus } from "@prisma/client";
import { logger } from "@/lib/logger";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("listings:view");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            profile: {
              select: { avatarUrl: true, ratingAvg: true, ratingCount: true },
            },
            hostProfile: {
              select: { superhost: true, verifiedEmail: true, verifiedPhone: true },
            },
            _count: {
              select: { Listing: true, bookings: true },
            },
          },
        },
        images: {
          orderBy: [{ isCover: "desc" }, { position: "asc" }],
        },
        amenities: {
          include: { amenity: true },
        },
        ListingModeration: {
          include: {
            User: { select: { name: true, email: true } },
          },
        },
        ListingReport: {
          include: {
            User: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: {
            author: {
              select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
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
            guest: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
            conversations: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // Calculer les stats supplémentaires
    const bookingStats = await prisma.booking.aggregate({
      where: {
        listingId: id,
        status: "CONFIRMED",
      },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Récupérer les notes admin
    const adminNotes = await prisma.adminNote.findMany({
      where: {
        targetType: "Listing",
        targetId: id,
      },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer l'historique admin
    const auditHistory = await prisma.auditLog.findMany({
      where: {
        entityType: "Listing",
        entityId: id,
      },
      include: {
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      listing: {
        ...listing,
        stats: {
          ...listing._count,
          totalRevenue: bookingStats._sum.totalPrice || 0,
          confirmedBookings: bookingStats._count,
        },
        adminNotes,
        auditHistory,
      },
    });
  } catch (error) {
    logger.error("Erreur API admin listing detail:", error);
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
  const { id } = await params;
  const body = await request.json();
  const { action, reason, isFeatured, featuredUntil, adminNotes } = body;

  // Déterminer la permission requise
  let permission: "listings:approve" | "listings:edit" = "listings:edit";
  if (action === "approve" || action === "reject") {
    permission = "listings:approve";
  }

  const auth = await requireAdminPermission(permission);
  if ("error" in auth) return auth.error;

  try {
    // Vérifier que l'annonce existe
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { ListingModeration: true, owner: { select: { email: true } } },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 }
      );
    }

    // Si c'est une action de mise en avant
    if (isFeatured !== undefined) {
      await prisma.listingModeration.upsert({
        where: { listingId: id },
        update: {
          isFeatured,
          featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
          updatedAt: new Date(),
        },
        create: {
          id: `mod_${id}`,
          listingId: id,
          status: "APPROVED",
          isFeatured,
          featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
          updatedAt: new Date(),
        },
      });

      await logAdminAction({
        adminId: auth.session.user.id,
        action: "LISTING_FEATURED",
        targetType: "Listing",
        targetId: id,
        details: { isFeatured, featuredUntil },
        request,
      });

      return NextResponse.json({ success: true, isFeatured });
    }

    // Si c'est juste une mise à jour des notes admin
    if (adminNotes !== undefined && !action) {
      await prisma.listingModeration.upsert({
        where: { listingId: id },
        update: { adminNotes, updatedAt: new Date() },
        create: {
          id: `mod_${id}`,
          listingId: id,
          status: "DRAFT",
          adminNotes,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    // Actions de modération
    if (!action) {
      return NextResponse.json(
        { error: "Action requise" },
        { status: 400 }
      );
    }

    let newStatus: ListingStatus;
    let auditAction: "LISTING_APPROVED" | "LISTING_REJECTED" | "LISTING_SUSPENDED" | "LISTING_UNSUSPENDED";

    switch (action) {
      case "approve":
        newStatus = "APPROVED";
        auditAction = "LISTING_APPROVED";
        break;
      case "reject":
        if (!reason) {
          return NextResponse.json(
            { error: "Raison de rejet requise" },
            { status: 400 }
          );
        }
        newStatus = "REJECTED";
        auditAction = "LISTING_REJECTED";
        break;
      case "suspend":
        newStatus = "SUSPENDED";
        auditAction = "LISTING_SUSPENDED";
        break;
      case "unsuspend":
        newStatus = "APPROVED";
        auditAction = "LISTING_UNSUSPENDED";
        break;
      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }

    // Mettre à jour ou créer la modération
    await prisma.listingModeration.upsert({
      where: { listingId: id },
      update: {
        status: newStatus,
        reviewedById: auth.session.user.id,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? reason : null,
        adminNotes: adminNotes || undefined,
        updatedAt: new Date(),
      },
      create: {
        id: `mod_${id}`,
        listingId: id,
        status: newStatus,
        reviewedById: auth.session.user.id,
        reviewedAt: new Date(),
        rejectionReason: action === "reject" ? reason : null,
        adminNotes: adminNotes || undefined,
        updatedAt: new Date(),
      },
    });

    // Mettre à jour isActive de l'annonce
    if (action === "suspend" || action === "reject") {
      await prisma.listing.update({
        where: { id },
        data: { isActive: false },
      });
    } else if (action === "approve" || action === "unsuspend") {
      await prisma.listing.update({
        where: { id },
        data: { isActive: true },
      });
    }

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: auditAction,
      targetType: "Listing",
      targetId: id,
      details: {
        listingTitle: listing.title,
        ownerEmail: listing.owner.email,
        previousStatus: listing.ListingModeration?.status || "NONE",
        newStatus,
        reason,
      },
      request,
    });

    // TODO: Envoyer une notification à l'hôte

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    logger.error("Erreur modération annonce:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
