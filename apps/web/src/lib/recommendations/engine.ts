// apps/web/src/lib/recommendations/engine.ts
import { prisma } from "@/lib/db";
import type { Listing, User, Favorite, Booking, Review, ListingImage } from "@prisma/client";
import { logger } from "@/lib/logger";


type ListingWithRelations = Listing & {
  images: ListingImage[];
  reviews: Review[];
  bookings: Booking[];
  amenities: { amenity: { id: string; slug: string } }[];
};

type UserWithRelations = User & {
  bookings: (Booking & { listing: ListingWithRelations })[];
  favorites: (Favorite & { listing: ListingWithRelations })[];
  behaviors: { action: string; listingId: string | null; metadata: any; createdAt: Date }[];
  profile: { city: string | null } | null;
};

export interface Recommendation {
  listing: ListingWithRelations;
  score: number;
  reason: string;
}

/**
 * Génère des recommandations personnalisées pour un utilisateur
 */
export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  // 1. Récupérer le profil utilisateur avec toutes les relations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        include: {
          listing: {
            include: {
              images: true,
              reviews: true,
              bookings: true,
              amenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      favorites: {
        include: {
          listing: {
            include: {
              images: true,
              reviews: true,
              bookings: true,
              amenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      behaviors: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      profile: {
        select: { city: true },
      },
    },
  }) as UserWithRelations | null;

  if (!user) {
    return [];
  }

  // 2. Récupérer tous les listings actifs (exclure ceux déjà réservés/favoris)
  const bookedListingIds = user.bookings.map((b) => b.listingId);
  const favoriteListingIds = user.favorites.map((f) => f.listingId);
  const excludedIds = [...new Set([...bookedListingIds, ...favoriteListingIds])];

  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
      id: { notIn: excludedIds },
      ownerId: { not: userId }, // Ne pas recommander ses propres annonces
    },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
      reviews: true,
      bookings: true,
      amenities: {
        include: {
          amenity: true,
        },
      },
    },
    take: 200, // Limiter pour la performance
  }) as ListingWithRelations[];

  // 3. Calculer les scores pour chaque listing
  const recommendations: Recommendation[] = [];

  for (const listing of listings) {
    let score = 0;
    const reasons: string[] = [];

    // Score basé sur les favoris similaires (30%)
    const similarFavorites = calculateSimilarityToFavorites(listing, user.favorites);
    score += similarFavorites * 0.3;
    if (similarFavorites > 0.7) reasons.push("similar_to_favorites");

    // Score basé sur l'historique de réservations (25%)
    const similarBookings = calculateSimilarityToBookings(listing, user.bookings);
    score += similarBookings * 0.25;
    if (similarBookings > 0.7) reasons.push("similar_to_bookings");

    // Score basé sur la popularité (15%)
    const popularity = calculatePopularity(listing);
    score += popularity * 0.15;
    if (popularity > 0.8) reasons.push("popular");

    // Score basé sur la localisation (15%)
    const locationScore = calculateLocationScore(listing, user);
    score += locationScore * 0.15;
    if (locationScore > 0.7) reasons.push("near_you");

    // Score basé sur le prix (10%)
    const priceScore = calculatePriceScore(listing, user);
    score += priceScore * 0.1;
    if (priceScore > 0.8) reasons.push("good_value");

    // Score basé sur les avis (5%)
    const reviewScore = calculateReviewScore(listing);
    score += reviewScore * 0.05;
    if (reviewScore > 0.9) reasons.push("highly_rated");

    // Ne recommander que si score > 0.3
    if (score > 0.3) {
      recommendations.push({
        listing,
        score,
        reason: reasons[0] || "recommended_for_you",
      });
    }
  }

  // 4. Trier par score et retourner top 20
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 20);
}

/**
 * Calcule la similarité avec les favoris de l'utilisateur
 */
function calculateSimilarityToFavorites(
  listing: ListingWithRelations,
  favorites: (Favorite & { listing: ListingWithRelations })[]
): number {
  if (favorites.length === 0) return 0;

  let totalSimilarity = 0;

  for (const fav of favorites) {
    let similarity = 0;

    // Même catégorie (30%)
    if (listing.type === fav.listing.type) similarity += 0.3;

    // Prix similaire ±20% (20%)
    const priceDiff = Math.abs(listing.price - fav.listing.price) / fav.listing.price;
    if (priceDiff < 0.2) similarity += 0.2;

    // Même ville (20%)
    if (listing.city && fav.listing.city && listing.city === fav.listing.city) {
      similarity += 0.2;
    }

    // Amenities similaires (30%)
    const listingAmenityIds = listing.amenities.map((a) => a.amenity.id);
    const favAmenityIds = fav.listing.amenities.map((a) => a.amenity.id);
    const commonAmenities = listingAmenityIds.filter((id) => favAmenityIds.includes(id)).length;
    const maxAmenities = Math.max(listingAmenityIds.length, favAmenityIds.length, 1);
    similarity += (commonAmenities / maxAmenities) * 0.3;

    totalSimilarity += similarity;
  }

  return Math.min(totalSimilarity / favorites.length, 1);
}

/**
 * Calcule la similarité avec les réservations passées
 */
function calculateSimilarityToBookings(
  listing: ListingWithRelations,
  bookings: (Booking & { listing: ListingWithRelations })[]
): number {
  if (bookings.length === 0) return 0;

  let totalSimilarity = 0;

  for (const booking of bookings) {
    let similarity = 0;

    // Même catégorie (30%)
    if (listing.type === booking.listing.type) similarity += 0.3;

    // Prix similaire ±20% (20%)
    const priceDiff = Math.abs(listing.price - booking.listing.price) / booking.listing.price;
    if (priceDiff < 0.2) similarity += 0.2;

    // Même ville (20%)
    if (listing.city && booking.listing.city && listing.city === booking.listing.city) {
      similarity += 0.2;
    }

    // Amenities similaires (30%)
    const listingAmenityIds = listing.amenities.map((a) => a.amenity.id);
    const bookingAmenityIds = booking.listing.amenities.map((a) => a.amenity.id);
    const commonAmenities = listingAmenityIds.filter((id) => bookingAmenityIds.includes(id)).length;
    const maxAmenities = Math.max(listingAmenityIds.length, bookingAmenityIds.length, 1);
    similarity += (commonAmenities / maxAmenities) * 0.3;

    totalSimilarity += similarity;
  }

  return Math.min(totalSimilarity / bookings.length, 1);
}

/**
 * Calcule le score de popularité d'un listing
 */
function calculatePopularity(listing: ListingWithRelations): number {
  const bookingsCount = listing.bookings.length;
  const reviewsCount = listing.reviews.length;
  const avgRating =
    reviewsCount > 0 ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount : 0;

  // Normaliser les valeurs
  const normalizedBookings = Math.min(bookingsCount / 10, 1); // 10+ réservations = max
  const normalizedReviews = Math.min(reviewsCount / 5, 1); // 5+ avis = max
  const normalizedRating = avgRating / 5;

  return normalizedBookings * 0.4 + normalizedReviews * 0.3 + normalizedRating * 0.3;
}

/**
 * Calcule le score de localisation
 */
function calculateLocationScore(listing: ListingWithRelations, user: UserWithRelations): number {
  // Si l'utilisateur a une ville dans son profil
  if (user.profile?.city && listing.city === user.profile.city) {
    return 1;
  }

  // Si l'utilisateur a déjà réservé dans cette ville
  const bookingsInCity = user.bookings.filter((b) => b.listing.city === listing.city).length;
  if (bookingsInCity > 0) {
    return 0.8;
  }

  // Si l'utilisateur a des favoris dans cette ville
  const favoritesInCity = user.favorites.filter((f) => f.listing.city === listing.city).length;
  if (favoritesInCity > 0) {
    return 0.6;
  }

  return 0.3; // Score par défaut
}

/**
 * Calcule le score de prix
 */
function calculatePriceScore(listing: ListingWithRelations, user: UserWithRelations): number {
  if (user.bookings.length === 0) return 0.5; // Score neutre si pas d'historique

  // Calculer le prix moyen des réservations passées
  const avgPrice =
    user.bookings.reduce((sum, b) => sum + b.totalPrice, 0) / user.bookings.length;

  // Score élevé si le prix est proche du prix moyen (±30%)
  const priceDiff = Math.abs(listing.price - avgPrice) / avgPrice;
  return Math.max(1 - priceDiff, 0);
}

/**
 * Calcule le score basé sur les avis
 */
function calculateReviewScore(listing: ListingWithRelations): number {
  if (listing.reviews.length === 0) return 0.5; // Score neutre si pas d'avis

  const avgRating = listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length;
  return avgRating / 5;
}

/**
 * Régénère les recommandations pour un utilisateur et les sauvegarde en DB
 */
export async function regenerateRecommendations(userId: string): Promise<void> {
  try {
    // Générer les nouvelles recommandations
    const recommendations = await generateRecommendations(userId);

    // Supprimer les anciennes recommandations
    await prisma.userRecommendation.deleteMany({
      where: { userId },
    });

    // Sauvegarder les nouvelles recommandations
    if (recommendations.length > 0) {
      await prisma.userRecommendation.createMany({
        data: recommendations.map((rec) => ({
          userId,
          listingId: rec.listing.id,
          score: rec.score,
          reason: rec.reason,
        })),
      });
    }
  } catch (error) {
    logger.error(`[Recommendations] Error regenerating for user ${userId}:`, error);
    throw error;
  }
}
