/**
 * API - Export des données personnelles (Droit à la portabilité RGPD)
 * POST /api/account/export - Demander un export
 * GET /api/account/export - Statut de l'export
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Check for existing pending request
    const existingRequest = await prisma.dataExportRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "pending",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "Une demande d'export est déjà en cours",
          requestId: existingRequest.id,
          createdAt: existingRequest.createdAt,
        },
        { status: 400 }
      );
    }

    // Limit to one export per week
    const recentExport = await prisma.dataExportRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "completed",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      },
    });

    if (recentExport) {
      const nextAllowed = new Date(recentExport.createdAt);
      nextAllowed.setDate(nextAllowed.getDate() + 7);
      return NextResponse.json(
        {
          error: "Vous avez déjà effectué un export récemment",
          lastExport: recentExport.createdAt,
          nextAllowedAt: nextAllowed,
        },
        { status: 429 }
      );
    }

    // Create export request
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId: session.user.id,
        status: "pending",
      },
    });

    // In production, this would trigger a background job
    // For now, we'll generate the export inline (simplified)

    // Collect all user data
    const userData = await collectUserData(session.user.id);

    // Create file URL (in production, would upload to S3/GCS)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to download

    // Update request with generated data
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        expiresAt,
        // In production: fileUrl would be a signed URL
        fileUrl: `/api/account/export/${exportRequest.id}/download`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Export généré avec succès",
      requestId: exportRequest.id,
      downloadUrl: `/api/account/export/${exportRequest.id}/download`,
      expiresAt,
      data: userData, // Return inline for now
    });
  } catch (error) {
    logger.error("Erreur export données:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get recent export requests
    const requests = await prisma.dataExportRequest.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        expiresAt: r.expiresAt,
        downloadUrl: r.status === "completed" && r.expiresAt && r.expiresAt > new Date()
          ? `/api/account/export/${r.id}/download`
          : null,
      })),
    });
  } catch (error) {
    logger.error("Erreur statut export:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Collect all user data for export
async function collectUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      hostProfile: true,
      Listing: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          city: true,
          country: true,
          createdAt: true,
        },
      },
      bookings: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          listing: {
            select: {
              title: true,
              city: true,
            },
          },
        },
      },
      reviewsWritten: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
      reviewsReceived: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
      favorites: {
        select: {
          listingId: true,
          createdAt: true,
        },
      },
      searchHistory: {
        select: {
          destination: true,
          startDate: true,
          endDate: true,
          guests: true,
          createdAt: true,
        },
      },
      notifications: {
        select: {
          type: true,
          title: true,
          message: true,
          createdAt: true,
          read: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      UserConsent: {
        select: {
          type: true,
          version: true,
          accepted: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  // Get messages (without full content for privacy of other users)
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ guestId: userId }, { hostId: userId }],
    },
    select: {
      id: true,
      createdAt: true,
      messages: {
        where: { senderId: userId }, // Only user's own messages
        select: {
          content: true,
          createdAt: true,
        },
      },
    },
  });

  // Format data for export
  return {
    exportDate: new Date().toISOString(),
    exportVersion: "1.0",
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      country: user.country,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      identityStatus: user.identityStatus,
    },
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phone: user.profile.phone,
          city: user.profile.city,
          country: user.profile.country,
          birthDate: user.profile.birthDate,
          addressLine1: user.profile.addressLine1,
          addressLine2: user.profile.addressLine2,
          postalCode: user.profile.postalCode,
          ratingAvg: user.profile.ratingAvg,
          ratingCount: user.profile.ratingCount,
        }
      : null,
    hostProfile: user.hostProfile
      ? {
          bio: user.hostProfile.bio,
          languages: user.hostProfile.languages,
          superhost: user.hostProfile.superhost,
          verifiedEmail: user.hostProfile.verifiedEmail,
          verifiedPhone: user.hostProfile.verifiedPhone,
          experienceYears: user.hostProfile.experienceYears,
        }
      : null,
    listings: user.Listing,
    bookings: user.bookings,
    reviewsWritten: user.reviewsWritten,
    reviewsReceived: user.reviewsReceived,
    favorites: user.favorites,
    searchHistory: user.searchHistory,
    recentNotifications: user.notifications,
    myMessages: conversations.map((c) => ({
      conversationId: c.id,
      messages: c.messages,
    })),
    consents: user.UserConsent,
  };
}
