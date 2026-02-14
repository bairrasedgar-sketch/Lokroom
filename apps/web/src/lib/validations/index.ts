/**
 * Lok'Room - Schémas de validation Zod
 * Validation robuste pour toutes les APIs
 */

import { z } from "zod";

// ============================================
// PRIMITIVES SÉCURISÉES
// ============================================

/**
 * Email normalisé et validé
 */
export const emailSchema = z
  .string()
  .email("Email invalide")
  .max(255, "Email trop long")
  .transform((v) => v.toLowerCase().trim());

/**
 * ID de base de données (CUID ou UUID)
 */
export const idSchema = z
  .string()
  .min(1, "ID requis")
  .max(128, "ID invalide")
  .regex(/^[a-zA-Z0-9_-]+$/, "ID contient des caractères invalides");

/**
 * URL sécurisée (HTTPS uniquement, pas de data: ou javascript:)
 */
export const safeUrlSchema = z
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
 * Montant monétaire (centimes)
 */
export const moneyAmountSchema = z
  .number()
  .int("Le montant doit être un entier (centimes)")
  .min(0, "Le montant ne peut pas être négatif")
  .max(100_000_000, "Montant trop élevé");

/**
 * Prix (décimal pour l'affichage)
 */
export const priceSchema = z
  .number()
  .min(1, "Prix minimum 1")
  .max(100_000, "Prix maximum 100 000")
  .refine((n) => Number.isFinite(n), "Prix invalide");

/**
 * Devise supportée
 */
export const currencySchema = z.enum(["EUR", "CAD", "USD", "GBP", "CNY"], {
  errorMap: () => ({ message: "Devise non supportée" }),
});

/**
 * Coordonnées GPS
 */
export const latitudeSchema = z
  .number()
  .min(-90, "Latitude invalide")
  .max(90, "Latitude invalide")
  .refine((n) => Number.isFinite(n) && !Number.isNaN(n), "Latitude invalide");

export const longitudeSchema = z
  .number()
  .min(-180, "Longitude invalide")
  .max(180, "Longitude invalide")
  .refine((n) => Number.isFinite(n) && !Number.isNaN(n), "Longitude invalide");

/**
 * Date ISO
 */
export const isoDateSchema = z.string().refine(
  (v) => {
    const d = new Date(v);
    return !Number.isNaN(d.getTime());
  },
  { message: "Date invalide" }
);

/**
 * Texte sécurisé simple
 */
export const safeStringSchema = z.string().trim();

/**
 * Numéro de téléphone (format international)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    "Numéro de téléphone invalide (format international requis)"
  )
  .optional()
  .nullable();

// ============================================
// SCHÉMAS AUTH
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const signupEmailSchema = z.object({
  email: emailSchema,
});

export const signupVerifySchema = z.object({
  email: emailSchema,
  code: z.string().length(6, "Code à 6 chiffres requis").regex(/^\d{6}$/, "Code invalide"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Mot de passe minimum 8 caractères").max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Nouveau mot de passe minimum 8 caractères").max(100),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, "Code à 6 chiffres requis").regex(/^\d{6}$/, "Code invalide"),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
});

// ============================================
// SCHÉMAS PAYMENT
// ============================================

export const createCheckoutSchema = z.object({
  amountCents: z.number().int().min(50, "Montant minimum 50 centimes").max(100_000_000),
  currency: currencySchema.default("EUR"),
  applicationFeeCents: z.number().int().min(0).max(100_000_000).optional().default(0),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const paymentIntentSchema = z.object({
  bookingId: idSchema,
  paymentMethodId: z.string().optional(),
});

// ============================================
// SCHÉMAS MÉTIER - UTILISATEURS
// ============================================

export const userRoleSchema = z.enum(["GUEST", "HOST", "BOTH", "ADMIN"]);

export const updateProfileSchema = z.object({
  name: z.string().max(100, "Nom trop long").optional(),
  firstName: z.string().max(50, "Prénom trop long").optional(),
  lastName: z.string().max(50, "Nom trop long").optional(),
  phone: phoneSchema,
  country: z.string().max(60, "Pays trop long").optional(),
  city: z.string().max(100, "Ville trop longue").optional(),
  postalCode: z.string().max(20, "Code postal trop long").optional(),
  addressLine1: z.string().max(200, "Adresse trop longue").optional(),
  addressLine2: z.string().max(200, "Adresse trop longue").optional(),
  province: z.string().max(50, "Province trop longue").optional(),
  // Adresse postale
  postalAddressLine1: z.string().max(200, "Adresse trop longue").optional(),
  postalAddressLine2: z.string().max(200, "Adresse trop longue").optional(),
  postalAddressCity: z.string().max(100, "Ville trop longue").optional(),
  postalAddressPostalCode: z.string().max(20, "Code postal trop long").optional(),
  postalAddressCountry: z.string().max(60, "Pays trop long").optional(),
  postalAddressProvince: z.string().max(50, "Province trop longue").optional(),
  postalAddressSameAsResidential: z.boolean().optional(),
  // Contact d'urgence
  emergencyContactName: z.string().max(100, "Nom trop long").optional(),
  emergencyContactPhone: phoneSchema,
  emergencyContactRelation: z.string().max(50, "Relation trop longue").optional(),
});

// ============================================
// SCHÉMAS MÉTIER - LISTINGS
// ============================================

export const listingTypeSchema = z.enum([
  "ROOM",
  "STUDIO",
  "APARTMENT",
  "HOUSE",
  "OFFICE",
  "COWORKING",
  "MEETING_ROOM",
  "PARKING",
  "GARAGE",
  "STORAGE",
  "EVENT_SPACE",
  "RECORDING_STUDIO",
  "OTHER",
]);

export const pricingModeSchema = z.enum(["HOURLY", "DAILY", "BOTH"]);

export const spaceAccessTypeSchema = z.enum([
  "ENTIRE_PLACE",
  "PRIVATE_ROOM",
  "SHARED_ROOM",
  "SHARED_SPACE",
]);

export const checkInMethodSchema = z.enum([
  "MEET_IN_PERSON",
  "LOCKBOX",
  "KEYPAD",
  "SMART_LOCK",
  "DOORMAN",
  "BUILDING_STAFF",
]);

export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, "Titre trop court (min 3 caractères)")
    .max(120, "Titre trop long (max 120 caractères)"),
  description: z
    .string()
    .min(10, "Description trop courte (min 10 caractères)")
    .max(5000, "Description trop longue (max 5000 caractères)"),
  price: priceSchema,
  priceHourly: priceSchema.optional(),
  currency: currencySchema,
  country: z.string().min(1, "Pays requis").max(60),
  city: z.string().max(100).optional(),
  addressFull: z.string().min(5, "Adresse requise").max(300),
  addressLine1: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  province: z.string().max(10).optional().nullable(),
  regionFR: z.string().max(10).optional().nullable(),
  type: listingTypeSchema.optional().default("OTHER"),
  additionalTypes: z.array(listingTypeSchema).max(4).optional().default([]),
  customType: z.string().max(100).optional().nullable(),
  pricingMode: pricingModeSchema.optional().default("DAILY"),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  latPublic: latitudeSchema.optional(),
  lngPublic: longitudeSchema.optional(),
  maxGuests: z.number().int().min(1).max(100).optional(),
  beds: z.number().int().min(0).max(50).optional().nullable(),
  desks: z.number().int().min(0).max(100).optional().nullable(),
  parkings: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().int().min(0).max(20).optional().nullable(),
  spaceFeatures: z.array(z.string().max(50)).max(20).optional(),
  isInstantBook: z.boolean().optional(),
  discountHours3Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountHours6Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountDays3Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountWeekly: z.number().int().min(0).max(100).optional().nullable(),
  discountMonthly: z.number().int().min(0).max(100).optional().nullable(),

  // === CONFIGURATION DÉTAILLÉE ===
  bedrooms: z.number().int().min(0).max(20).optional().nullable(),
  bedConfiguration: z.any().optional().nullable(), // JSON
  bathroomsFull: z.number().int().min(0).max(20).optional().nullable(),
  bathroomsHalf: z.number().int().min(0).max(20).optional().nullable(),
  bathroomsShared: z.boolean().optional(),
  spaceType: spaceAccessTypeSchema.optional(),

  // Espaces (HOUSE)
  floors: z.number().int().min(1).max(10).optional().nullable(),
  hasGarden: z.boolean().optional(),
  gardenSize: z.number().int().min(0).max(100000).optional().nullable(),
  hasPool: z.boolean().optional(),
  poolType: z.enum(["indoor", "outdoor"]).optional().nullable(),
  poolHeated: z.boolean().optional(),
  hasSpa: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  terraceSize: z.number().int().min(0).max(10000).optional().nullable(),
  garageSpaces: z.number().int().min(0).max(10).optional().nullable(),

  // Studio spécifique
  studioType: z.enum(["photo", "video", "music", "podcast", "dance", "art"]).optional().nullable(),
  studioHeight: z.number().min(2).max(20).optional().nullable(),
  hasGreenScreen: z.boolean().optional(),
  hasSoundproofing: z.boolean().optional(),

  // Parking/Garage spécifique
  parkingType: z.enum(["outdoor", "indoor", "underground"]).optional().nullable(),
  parkingCovered: z.boolean().optional(),
  parkingSecured: z.boolean().optional(),
  parkingLength: z.number().min(0).max(50).optional().nullable(),
  parkingWidth: z.number().min(0).max(50).optional().nullable(),
  parkingHeight: z.number().min(0).max(10).optional().nullable(),
  hasEVCharger: z.boolean().optional(),

  // === TARIFICATION AVANCÉE ===
  hourlyIncrement: z.number().int().refine((val) => val === 30 || val === 60, {
    message: "L'incrément doit être 30 ou 60 minutes",
  }).optional(),
  minDurationMinutes: z.number().int().min(30).max(1440).optional().nullable(),
  maxDurationMinutes: z.number().int().min(30).max(43200).optional().nullable(),
  advanceNoticeDays: z.number().int().min(0).max(365).optional(),
  maxAdvanceBookingDays: z.number().int().min(1).max(730).optional().nullable(),

  // Frais supplémentaires
  cleaningFee: z.number().min(0).max(10000).optional().nullable(),
  extraGuestFee: z.number().min(0).max(1000).optional().nullable(),
  extraGuestThreshold: z.number().int().min(1).max(100).optional().nullable(),
  weekendPriceMultiplier: z.number().min(1).max(5).optional().nullable(),

  // === RÉDUCTIONS AVANCÉES ===
  discountHours2Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountHours4Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountHours8Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountDays2Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountDays5Plus: z.number().int().min(0).max(100).optional().nullable(),
  discountDays14Plus: z.number().int().min(0).max(100).optional().nullable(),
  lastMinuteDiscount: z.number().int().min(0).max(100).optional().nullable(),
  lastMinuteDiscountDays: z.number().int().min(1).max(30).optional().nullable(),
  earlyBirdDiscount: z.number().int().min(0).max(100).optional().nullable(),
  earlyBirdDiscountDays: z.number().int().min(1).max(365).optional().nullable(),
  firstBookingDiscount: z.number().int().min(0).max(100).optional().nullable(),

  // === DESCRIPTION ENRICHIE ===
  spaceDescription: z.string().max(2000).optional().nullable(),
  guestAccessDescription: z.string().max(1000).optional().nullable(),
  neighborhoodDescription: z.string().max(1000).optional().nullable(),
  transitDescription: z.string().max(1000).optional().nullable(),
  notesDescription: z.string().max(1000).optional().nullable(),
  highlights: z.array(z.string().max(100)).max(3).optional(),

  // === RÈGLES DE LA MAISON ===
  houseRules: z.array(z.string().max(200)).max(20).optional(),
  customHouseRules: z.string().max(2000).optional().nullable(),
  checkInStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  checkInEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  selfCheckIn: z.boolean().optional(),
  checkInMethod: checkInMethodSchema.optional().nullable(),

  // Politiques
  petsAllowed: z.boolean().optional(),
  petTypes: z.array(z.string().max(50)).max(10).optional(),
  petFee: z.number().min(0).max(1000).optional().nullable(),
  smokingAllowed: z.boolean().optional(),
  eventsAllowed: z.boolean().optional(),
  childrenAllowed: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),

  // Amenities (IDs)
  amenityIds: z.array(z.string()).max(50).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const searchListingsSchema = z.object({
  q: z.string().max(200).optional(),
  country: z.string().max(60).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(50).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(100000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  type: listingTypeSchema.optional(),
  hasPhoto: z.coerce.boolean().optional(),
  sort: z
    .enum(["newest", "oldest", "price_asc", "price_desc", "rating"])
    .optional(),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================
// SCHÉMAS MÉTIER - BOOKINGS
// ============================================

export const bookingStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);

export const createBookingSchema = z
  .object({
    listingId: idSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    pricingMode: pricingModeSchema.optional().default("DAILY"),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    timezone: z.string().max(50).optional(),
    guestMessage: z.string().max(1000).optional(),
    // Nombre de voyageurs - accepte un nombre ou un objet { adults, children, infants }
    guests: z.union([
      z.number().int().min(1).max(100),
      z.object({
        adults: z.number().int().min(1).max(100),
        children: z.number().int().min(0).max(100),
        infants: z.number().int().min(0).max(100),
      }),
    ]).optional(),
    promoCodeId: idSchema.optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"],
  });

export const bookingPreviewSchema = z.object({
  listingId: idSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  pricingMode: pricingModeSchema.optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  hours: z.coerce.number().min(1).max(24).optional(),
  province: z.string().max(50).optional(),
});

export const refundBookingSchema = z.object({
  bookingId: idSchema,
  reason: z.string().max(500).optional(),
});

// ============================================
// SCHÉMAS MÉTIER - PAIEMENTS
// ============================================

export const createPaymentIntentSchema = z.object({
  bookingId: idSchema,
  currency: currencySchema.optional(),
});

export const checkoutSchema = z.object({
  bookingId: idSchema,
  successUrl: safeUrlSchema.optional(),
  cancelUrl: safeUrlSchema.optional(),
});

// ============================================
// SCHÉMAS MÉTIER - UPLOADS
// ============================================

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const presignUploadSchema = z.object({
  filename: z
    .string()
    .min(1, "Nom de fichier requis")
    .max(255, "Nom de fichier trop long"),
  contentType: z
    .string()
    .refine(
      (type): type is (typeof ALLOWED_IMAGE_TYPES)[number] =>
        (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type),
      `Type de fichier non autorisé. Types acceptés: ${ALLOWED_IMAGE_TYPES.join(", ")}`
    ),
  fileSize: z
    .number()
    .int()
    .min(1, "Fichier vide")
    .max(8 * 1024 * 1024, "Fichier trop lourd (max 8 Mo)"),
});

export const presignListingImageSchema = presignUploadSchema.extend({
  listingId: idSchema,
});

export const saveAvatarSchema = z.object({
  url: z.string().url("URL invalide").max(2048),
});

export const saveListingImageSchema = z.object({
  url: z.string().url("URL invalide").max(2048),
  width: z.number().int().min(1).max(10000).optional(),
  height: z.number().int().min(1).max(10000).optional(),
  position: z.number().int().min(0).max(100).optional(),
});

// ============================================
// SCHÉMAS MÉTIER - FAVORIS
// ============================================

export const toggleFavoriteSchema = z.object({
  listingId: idSchema,
});

// ============================================
// SCHÉMAS MÉTIER - MESSAGES
// ============================================

export const sendMessageSchema = z
  .object({
    conversationId: idSchema.optional(),
    listingId: idSchema.optional(),
    bookingId: idSchema.optional(),
    recipientId: idSchema.optional(),
    content: z
      .string()
      .min(1, "Message vide")
      .max(5000, "Message trop long (max 5000 caractères)"),
  })
  .refine((data) => data.conversationId || data.listingId || data.recipientId, {
    message: "conversationId, listingId ou recipientId requis",
  });

// ============================================
// SCHÉMAS MÉTIER - HOST
// ============================================

export const updateHostProfileSchema = z.object({
  bio: z.string().max(2000, "Bio trop longue").optional(),
  languages: z.array(z.string().max(50)).max(10).optional(),
  instagram: z
    .string()
    .max(100)
    .regex(/^@?[\w.]+$/, "Handle Instagram invalide")
    .optional()
    .nullable(),
  website: safeUrlSchema.optional().nullable(),
  experienceYears: z.number().int().min(0).max(100).optional(),
  responseTimeCategory: z
    .enum(["within_hour", "within_day", "within_few_days"])
    .optional(),
});

export const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2).max(100),
  accountNumber: z.string().min(5).max(34),
  routingNumber: z.string().max(20).optional(),
  bankCountry: z.string().length(2, "Code pays à 2 lettres requis"),
  currency: currencySchema,
});

// ============================================
// SCHÉMAS MÉTIER - REVIEWS
// ============================================

export const createReviewSchema = z.object({
  bookingId: idSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(10).max(2000),
  cleanliness: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  checkIn: z.number().int().min(1).max(5).optional(),
  accuracy: z.number().int().min(1).max(5).optional(),
  location: z.number().int().min(1).max(5).optional(),
  value: z.number().int().min(1).max(5).optional(),
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
 * Middleware de validation pour les API routes
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
