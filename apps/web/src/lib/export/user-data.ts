/**
 * Service d'export de données utilisateur (RGPD Article 20)
 * Collecte et formate toutes les données personnelles d'un utilisateur
 */

import { prisma } from "@/lib/db";

export interface UserDataExport {
  exportDate: string;
  exportVersion: string;
  account: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    country: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
    identityStatus: string;
    emailVerified: Date | null;
  };
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    birthDate: Date | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    province: string | null;
    avatarUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    preferredLanguage: string;
    autoTranslate: boolean;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelation: string | null;
  } | null;
  hostProfile: {
    bio: string | null;
    languages: string[];
    superhost: boolean;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    experienceYears: number | null;
    responseTimeCategory: string | null;
    kycStatus: string;
    payoutsEnabled: boolean;
  } | null;
  listings: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    hourlyPrice: number | null;
    currency: string;
    type: string;
    city: string;
    country: string;
    addressFull: string;
    maxGuests: number | null;
    isActive: boolean;
    rating: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    images: Array<{
      url: string;
      isCover: boolean;
      position: number;
    }>;
    amenities: Array<{
      slug: string;
      label: string;
      category: string;
    }>;
  }>;
  bookingsAsGuest: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    currency: string;
    status: string;
    pricingMode: string;
    createdAt: Date;
    listing: {
      title: string;
      city: string;
      country: string;
    };
  }>;
  bookingsAsHost: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    currency: string;
    status: string;
    createdAt: Date;
    guest: {
      name: string | null;
      email: string;
    };
    listing: {
      title: string;
    };
  }>;
  reviewsGiven: Array<{
    id: string;
    rating: number;
    comment: string | null;
    type: string;
    status: string;
    ratingCleanliness: number | null;
    ratingAccuracy: number | null;
    ratingCommunication: number | null;
    ratingLocation: number | null;
    ratingCheckin: number | null;
    ratingValue: number | null;
    highlights: string[];
    wouldRecommend: boolean;
    createdAt: Date;
    listing: {
      title: string;
    };
  }>;
  reviewsReceived: Array<{
    id: string;
    rating: number;
    comment: string | null;
    type: string;
    status: string;
    createdAt: Date;
    author: {
      name: string | null;
    };
  }>;
  messages: Array<{
    conversationId: string;
    content: string;
    createdAt: Date;
    readAt: Date | null;
  }>;
  favorites: Array<{
    listingId: string;
    createdAt: Date;
    listing: {
      title: string;
      city: string;
      country: string;
    };
  }>;
  wishlists: Array<{
    id: string;
    name: string;
    createdAt: Date;
    favorites: Array<{
      listingId: string;
    }>;
  }>;
  notifications: Array<{
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
  }>;
  searchHistory: Array<{
    destination: string;
    startDate: string | null;
    endDate: string | null;
    guests: number | null;
    createdAt: Date;
  }>;
  payments: Array<{
    bookingId: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: Date;
  }>;
  disputes: Array<{
    id: string;
    reason: string;
    status: string;
    description: string;
    claimedAmountCents: number | null;
    awardedAmountCents: number | null;
    resolution: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }>;
  consents: Array<{
    type: string;
    version: string;
    accepted: boolean;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  auditLogs: Array<{
    action: string;
    entityType: string;
    entityId: string;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  twoFactorEnabled: boolean;
  wallet: {
    balanceCents: number;
    transactions: Array<{
      deltaCents: number;
      reason: string | null;
      createdAt: Date;
    }>;
  } | null;
}

/**
 * Collecte toutes les données personnelles d'un utilisateur
 */
export async function collectUserData(userId: string): Promise<UserDataExport | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      hostProfile: true,
      Listing: {
        include: {
          images: {
            select: {
              url: true,
              isCover: true,
              position: true,
            },
            orderBy: { position: "asc" },
          },
          amenities: {
            include: {
              amenity: {
                select: {
                  slug: true,
                  label: true,
                  category: true,
                },
              },
            },
          },
        },
      },
      bookings: {
        include: {
          listing: {
            select: {
              title: true,
              city: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reviewsWritten: {
        include: {
          listing: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reviewsReceived: {
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      messages: {
        select: {
          conversationId: true,
          content: true,
          createdAt: true,
          readAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      favorites: {
        include: {
          listing: {
            select: {
              title: true,
              city: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      wishlists: {
        include: {
          favorites: {
            select: {
              listingId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      notifications: {
        select: {
          type: true,
          title: true,
          message: true,
          read: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 500, // Limiter à 500 dernières notifications
      },
      searchHistory: {
        orderBy: { createdAt: "desc" },
        take: 100, // Limiter à 100 dernières recherches
      },
      UserConsent: {
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        select: {
          action: true,
          entityType: true,
          entityId: true,
          ipAddress: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100, // Limiter à 100 derniers logs
      },
      twoFactorSecret: {
        select: {
          enabled: true,
        },
      },
      wallet: true,
      disputesOpened: {
        select: {
          id: true,
          reason: true,
          status: true,
          description: true,
          claimedAmountCents: true,
          awardedAmountCents: true,
          resolution: true,
          createdAt: true,
          resolvedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  // Récupérer les bookings en tant qu'hôte
  const bookingsAsHost = await prisma.booking.findMany({
    where: {
      listing: {
        ownerId: userId,
      },
    },
    include: {
      guest: {
        select: {
          name: true,
          email: true,
        },
      },
      listing: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Récupérer les transactions wallet
  const walletTransactions = user.wallet
    ? await prisma.walletLedger.findMany({
        where: { hostId: userId },
        select: {
          deltaCents: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  // Récupérer les transactions PayPal
  const paypalTransactions = await prisma.payPalTransaction.findMany({
    where: {
      booking: {
        guestId: userId,
      },
    },
    select: {
      bookingId: true,
      amountCents: true,
      currency: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    exportDate: new Date().toISOString(),
    exportVersion: "2.0",
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      country: user.country,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      identityStatus: user.identityStatus,
      emailVerified: user.emailVerified,
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
          province: user.profile.province,
          avatarUrl: user.profile.avatarUrl,
          ratingAvg: user.profile.ratingAvg,
          ratingCount: user.profile.ratingCount,
          preferredLanguage: user.profile.preferredLanguage,
          autoTranslate: user.profile.autoTranslate,
          emergencyContactName: user.profile.emergencyContactName,
          emergencyContactPhone: user.profile.emergencyContactPhone,
          emergencyContactRelation: user.profile.emergencyContactRelation,
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
          responseTimeCategory: user.hostProfile.responseTimeCategory,
          kycStatus: user.hostProfile.kycStatus,
          payoutsEnabled: user.hostProfile.payoutsEnabled,
        }
      : null,
    listings: user.Listing.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      hourlyPrice: listing.hourlyPrice,
      currency: listing.currency,
      type: listing.type,
      city: listing.city,
      country: listing.country,
      addressFull: listing.addressFull,
      maxGuests: listing.maxGuests,
      isActive: listing.isActive,
      rating: listing.rating,
      viewCount: listing.viewCount,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      images: listing.images,
      amenities: listing.amenities.map((a) => a.amenity),
    })),
    bookingsAsGuest: user.bookings.map((booking) => ({
      id: booking.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
      pricingMode: booking.pricingMode,
      createdAt: booking.createdAt,
      listing: booking.listing,
    })),
    bookingsAsHost: bookingsAsHost.map((booking) => ({
      id: booking.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
      createdAt: booking.createdAt,
      guest: booking.guest,
      listing: booking.listing,
    })),
    reviewsGiven: user.reviewsWritten.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      type: review.type,
      status: review.status,
      ratingCleanliness: review.ratingCleanliness,
      ratingAccuracy: review.ratingAccuracy,
      ratingCommunication: review.ratingCommunication,
      ratingLocation: review.ratingLocation,
      ratingCheckin: review.ratingCheckin,
      ratingValue: review.ratingValue,
      highlights: review.highlights,
      wouldRecommend: review.wouldRecommend,
      createdAt: review.createdAt,
      listing: review.listing,
    })),
    reviewsReceived: user.reviewsReceived.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      type: review.type,
      status: review.status,
      createdAt: review.createdAt,
      author: review.author,
    })),
    messages: user.messages,
    favorites: user.favorites.map((fav) => ({
      listingId: fav.listingId,
      createdAt: fav.createdAt,
      listing: fav.listing,
    })),
    wishlists: user.wishlists,
    notifications: user.notifications,
    searchHistory: user.searchHistory,
    payments: paypalTransactions,
    disputes: user.disputesOpened,
    consents: user.UserConsent,
    auditLogs: user.auditLogs,
    twoFactorEnabled: user.twoFactorSecret?.enabled || false,
    wallet: user.wallet
      ? {
          balanceCents: user.wallet.balanceCents,
          transactions: walletTransactions,
        }
      : null,
  };
}
