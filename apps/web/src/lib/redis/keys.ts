// apps/web/src/lib/redis/keys.ts

/**
 * Clés de cache standardisées pour Redis.
 * Permet une gestion cohérente et une invalidation facile.
 */

export const CacheKeys = {
  // Listings
  listing: (id: string) => `listing:${id}`,
  listings: (filters: string) => `listings:${filters}`,
  listingsByCity: (city: string) => `listings:city:${city}`,
  listingsByOwner: (ownerId: string) => `listings:owner:${ownerId}`,
  listingSearch: (query: string) => `listings:search:${query}`,

  // Users
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userProfile: (id: string) => `user:profile:${id}`,

  // Bookings
  booking: (id: string) => `booking:${id}`,
  bookingsByUser: (userId: string) => `bookings:user:${userId}`,
  bookingsByListing: (listingId: string) => `bookings:listing:${listingId}`,
  bookingAvailability: (listingId: string, date: string) =>
    `bookings:availability:${listingId}:${date}`,

  // Reviews
  reviews: (listingId: string) => `reviews:${listingId}`,
  reviewStats: (listingId: string) => `reviews:stats:${listingId}`,
  userReviews: (userId: string) => `reviews:user:${userId}`,

  // Amenities
  amenities: () => `amenities:all`,
  amenitiesByCategory: (category: string) => `amenities:category:${category}`,

  // Search
  searchResults: (query: string) => `search:${query}`,
  searchSuggestions: (query: string) => `search:suggestions:${query}`,

  // Stats
  stats: (type: string) => `stats:${type}`,
  dashboardStats: (userId: string) => `stats:dashboard:${userId}`,
  listingStats: (listingId: string) => `stats:listing:${listingId}`,

  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,

  // Session
  session: (sessionId: string) => `session:${sessionId}`,

  // Notifications
  notifications: (userId: string) => `notifications:${userId}`,
  unreadCount: (userId: string) => `notifications:unread:${userId}`,

  // Favorites
  favorites: (userId: string) => `favorites:${userId}`,

  // Messages
  messages: (conversationId: string) => `messages:${conversationId}`,
  unreadMessages: (userId: string) => `messages:unread:${userId}`,
};

export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 heure
  VERY_LONG: 86400, // 24 heures
  WEEK: 604800, // 7 jours
};

// Patterns pour l'invalidation en masse
export const CachePatterns = {
  allListings: () => `listings:*`,
  allUsers: () => `user:*`,
  allBookings: () => `bookings:*`,
  allReviews: () => `reviews:*`,
  allStats: () => `stats:*`,
  userRelated: (userId: string) => `*:${userId}*`,
  listingRelated: (listingId: string) => `*:${listingId}*`,
};
