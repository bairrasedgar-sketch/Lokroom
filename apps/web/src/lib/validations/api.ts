/**
 * Lok'Room - Schémas de validation Zod pour les API
 * Schémas réutilisables pour tous les endpoints
 */

import { z } from "zod";

// ============================================
// SCHÉMAS COMMUNS RÉUTILISABLES
// ============================================

/**
 * ID de base de données (CUID)
 */
export const idSchema = z.string().cuid("ID invalide");

/**
 * Email normalisé
 */
export const emailSchema = z
  .string()
  .email("Email invalide")
  .max(255, "Email trop long")
  .transform((v) => v.toLowerCase().trim());

/**
 * Téléphone international
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Numéro de téléphone invalide")
  .optional()
  .nullable();

/**
 * URL sécurisée (HTTPS uniquement en production)
 */
export const urlSchema = z
  .string()
  .url("URL invalide")
  .max(2048, "URL trop longue")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const allowedProtocols = ["https:"];
        if (process.env.NODE_ENV === "development") {
          allowedProtocols.push("http:");
        }
        return allowedProtocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "URL doit utiliser HTTPS" }
  );

/**
 * Date ISO 8601
 */
export const dateSchema = z.string().datetime("Date invalide");

/**
 * Montant monétaire (centimes)
 */
export const moneyAmountSchema = z
  .number()
  .int("Le montant doit être un entier")
  .min(0, "Le montant ne peut pas être négatif")
  .max(100_000_000, "Montant trop élevé");

/**
 * Devise supportée
 */
export const currencySchema = z.enum(["EUR", "CAD", "USD", "GBP", "CNY"]);

// ============================================
// PAGINATION & FILTRES
// ============================================

/**
 * Pagination standard
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Filtres de recherche
 */
export const searchFilterSchema = z.object({
  q: z.string().max(200).optional(),
  search: z.string().max(255).optional(),
  status: z.string().max(50).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================
// DISPUTES
// ============================================

export const disputeReasonSchema = z.enum([
  "PROPERTY_NOT_AS_DESCRIBED",
  "CLEANLINESS_ISSUE",
  "AMENITIES_MISSING",
  "HOST_UNRESPONSIVE",
  "GUEST_DAMAGE",
  "GUEST_VIOLATION",
  "PAYMENT_ISSUE",
  "CANCELLATION_DISPUTE",
  "SAFETY_CONCERN",
  "NOISE_COMPLAINT",
  "UNAUTHORIZED_GUESTS",
  "OTHER",
]);

export const createDisputeSchema = z.object({
  bookingId: idSchema,
  reason: disputeReasonSchema,
  description: z.string().min(10, "Description trop courte").max(5000, "Description trop longue"),
  claimedAmountCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
});

export const updateDisputeSchema = z.object({
  status: z.enum([
    "OPEN",
    "UNDER_REVIEW",
    "AWAITING_RESPONSE",
    "RESOLVED_GUEST",
    "RESOLVED_HOST",
    "RESOLVED_PARTIAL",
    "CLOSED",
  ]).optional(),
  response: z.string().max(5000).optional(),
  awardedAmountCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
});

// ============================================
// REVIEWS
// ============================================

export const reviewRatingSchema = z.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  bookingId: idSchema,
  rating: reviewRatingSchema,
  comment: z.string().min(1).max(2000).optional().nullable(),
  // Sous-notes pour voyageurs
  ratingCleanliness: reviewRatingSchema.optional().nullable(),
  ratingAccuracy: reviewRatingSchema.optional().nullable(),
  ratingCommunication: reviewRatingSchema.optional().nullable(),
  ratingLocation: reviewRatingSchema.optional().nullable(),
  ratingCheckin: reviewRatingSchema.optional().nullable(),
  ratingValue: reviewRatingSchema.optional().nullable(),
  // Sous-notes pour hôtes
  ratingRespect: reviewRatingSchema.optional().nullable(),
  ratingTidiness: reviewRatingSchema.optional().nullable(),
  // Autres
  highlights: z.array(z.string().max(50)).max(10).optional(),
  wouldRecommend: z.boolean().optional(),
});

export const respondToReviewSchema = z.object({
  reviewId: idSchema,
  response: z.string().min(1, "Réponse vide").max(1000, "Réponse trop longue"),
});

// ============================================
// WISHLISTS
// ============================================

export const createWishlistSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long").transform((v) => v.trim()),
});

export const updateWishlistSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long").transform((v) => v.trim()).optional(),
  isPublic: z.boolean().optional(),
});

export const addToWishlistSchema = z.object({
  listingId: idSchema,
  wishlistId: idSchema.optional(),
});

// ============================================
// ADMIN - USERS
// ============================================

export const adminUpdateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().max(100).optional(),
  role: z.enum(["GUEST", "HOST", "BOTH", "ADMIN"]).optional(),
  country: z.string().max(60).optional(),
  emailVerified: z.boolean().optional(),
  identityStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]).optional(),
});

export const adminBanUserSchema = z.object({
  reason: z.string().min(10, "Raison trop courte").max(500, "Raison trop longue"),
  expiresAt: z.string().datetime().optional().nullable(),
  isPermanent: z.boolean().optional(),
});

// ============================================
// ADMIN - LISTINGS
// ============================================

export const adminUpdateListingSchema = z.object({
  isActive: z.boolean().optional(),
  moderationStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "FLAGGED"]).optional(),
  moderationNotes: z.string().max(1000).optional().nullable(),
});

// ============================================
// ADMIN - BOOKINGS
// ============================================

export const adminUpdateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  adminNotes: z.string().max(1000).optional().nullable(),
});

// ============================================
// ADMIN - NOTES
// ============================================

export const createAdminNoteSchema = z.object({
  targetType: z.enum(["User", "Listing", "Booking", "Dispute"]),
  targetId: idSchema,
  content: z.string().min(1, "Contenu requis").max(5000, "Contenu trop long"),
  isImportant: z.boolean().optional(),
});

// ============================================
// ADMIN - SETTINGS
// ============================================

export const updateAdminSettingsSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(10000),
  category: z.string().max(50).optional(),
});

// ============================================
// ADMIN - PROMOS
// ============================================

export const createPromoSchema = z.object({
  code: z.string().min(3, "Code trop court").max(50, "Code trop long").transform((v) => v.toUpperCase().trim()),
  discountPercent: z.number().int().min(1).max(100).optional().nullable(),
  discountAmountCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  minPurchaseAmountCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updatePromoSchema = createPromoSchema.partial();

// ============================================
// CONTACT
// ============================================

export const contactSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(100, "Nom trop long"),
  email: emailSchema,
  subject: z.string().min(3, "Sujet trop court").max(200, "Sujet trop long"),
  message: z.string().min(10, "Message trop court").max(5000, "Message trop long"),
  category: z.enum(["GENERAL", "SUPPORT", "BILLING", "TECHNICAL", "PARTNERSHIP", "OTHER"]).optional(),
});

// ============================================
// ACCOUNT
// ============================================

export const deleteAccountSchema = z.object({
  reason: z.string().max(500).optional(),
  password: z.string().min(1, "Mot de passe requis"),
});

export const exportAccountSchema = z.object({
  format: z.enum(["JSON", "CSV"]).default("JSON"),
  includeBookings: z.boolean().optional(),
  includeMessages: z.boolean().optional(),
  includeReviews: z.boolean().optional(),
});

// ============================================
// NOTIFICATIONS
// ============================================

export const updateNotificationPreferencesSchema = z.object({
  emailBookingConfirmed: z.boolean().optional(),
  emailBookingCancelled: z.boolean().optional(),
  emailMessageReceived: z.boolean().optional(),
  emailReviewReceived: z.boolean().optional(),
  emailDisputeOpened: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: idSchema,
});

// ============================================
// PROMO VALIDATION
// ============================================

export const validatePromoSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  bookingId: idSchema.optional(),
  totalAmountCents: z.number().int().min(0).optional(),
});

// ============================================
// SEARCH HISTORY
// ============================================

export const saveSearchSchema = z.object({
  query: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(60).optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  guests: z.number().int().min(1).max(100).optional(),
});

// ============================================
// HOST - CALENDAR
// ============================================

export const updateCalendarSchema = z.object({
  listingId: idSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
  isAvailable: z.boolean(),
  customPrice: z.number().min(0).max(100_000).optional().nullable(),
});

export const bulkUpdateCalendarSchema = z.object({
  listingId: idSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAvailable: z.boolean(),
  customPrice: z.number().min(0).max(100_000).optional().nullable(),
});

// ============================================
// HOST - ICAL IMPORT
// ============================================

export const importIcalSchema = z.object({
  listingId: idSchema,
  url: urlSchema,
  name: z.string().max(100).optional(),
});

// ============================================
// SUPPORT
// ============================================

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3, "Sujet trop court").max(200, "Sujet trop long"),
  message: z.string().min(10, "Message trop court").max(5000, "Message trop long"),
  category: z.enum(["TECHNICAL", "BILLING", "BOOKING", "ACCOUNT", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  bookingId: idSchema.optional(),
  listingId: idSchema.optional(),
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: idSchema.optional().nullable(),
});

export const addSupportMessageSchema = z.object({
  ticketId: idSchema,
  message: z.string().min(1, "Message vide").max(5000, "Message trop long"),
  isInternal: z.boolean().optional(),
});

// ============================================
// BADGES
// ============================================

export const checkBadgeSchema = z.object({
  badgeType: z.string().max(50),
});

// ============================================
// TRANSLATION
// ============================================

export const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  targetLanguage: z.string().length(2, "Code langue à 2 lettres requis"),
  sourceLanguage: z.string().length(2).optional(),
});

// ============================================
// HELPERS
// ============================================

/**
 * Parse et valide des données avec un schéma Zod
 */
export function parseWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.issues[0];
  const errorMessage = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "Données invalides";

  return {
    success: false,
    error: errorMessage,
    errors: result.error.issues,
  };
}

/**
 * Middleware de validation pour les API routes (body JSON)
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<
  { success: true; data: T } | { success: false; error: string; status: number }
> {
  try {
    const body = await request.json();
    const result = parseWithSchema(schema, body);

    if (!result.success) {
      return { success: false, error: result.error, status: 400 };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Corps de requête invalide", status: 400 };
  }
}

/**
 * Valide les paramètres de recherche (query string)
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return parseWithSchema(schema, params);
}
