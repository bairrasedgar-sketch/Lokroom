// apps/web/src/lib/validations.ts
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalide");

export const idSchema = z
  .string()
  .min(1, "ID requis")
  .regex(/^[a-zA-Z0-9_-]+$/, "ID invalide");

export const priceSchema = z
  .number()
  .min(1, "Prix minimum 1")
  .max(100000, "Prix maximum 100000");

export const currencySchema = z.enum(["EUR", "CAD", "USD", "GBP", "CNY"]);

export const createListingSchema = z.object({
  title: z.string().min(5, "Titre trop court (min 5 caractères)"),
  description: z.string().min(20, "Description trop courte (min 20 caractères)"),
  price: priceSchema,
  priceHourly: priceSchema.optional(),
  currency: currencySchema,
  country: z.string().min(1, "Pays requis"),
  city: z.string().optional(),
  addressFull: z.string().min(1, "Adresse requise"),
  addressLine1: z.string().optional(),
  postalCode: z.string().optional(),
  province: z.string().optional(),
  regionFR: z.string().optional(),
  type: z.enum([
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
    "OTHER"
  ]),
  additionalTypes: z.array(z.string()).optional(),
  customType: z.string().optional(),
  pricingMode: z.enum(["DAILY", "HOURLY", "BOTH"]),
  maxGuests: z.number().int().min(1).optional(),
  beds: z.number().int().min(0).optional(),
  desks: z.number().int().min(0).optional(),
  parkings: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  spaceFeatures: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  isInstantBook: z.boolean().optional(),
  discountHours3Plus: z.number().min(0).max(100).optional(),
  discountHours6Plus: z.number().min(0).max(100).optional(),
  discountDays3Plus: z.number().min(0).max(100).optional(),
  discountWeekly: z.number().min(0).max(100).optional(),
  discountMonthly: z.number().min(0).max(100).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bedConfiguration: z.string().optional(),
  bathroomsFull: z.number().int().min(0).optional(),
  bathroomsHalf: z.number().int().min(0).optional(),
  bathroomsShared: z.boolean().optional(),
  spaceType: z.enum(["ENTIRE_PLACE", "PRIVATE_ROOM", "SHARED_ROOM", "SHARED_SPACE"]).optional(),
  floors: z.number().int().min(0).optional(),
  hasGarden: z.boolean().optional(),
  gardenSize: z.number().min(0).optional(),
  hasPool: z.boolean().optional(),
  poolType: z.string().optional(),
  poolHeated: z.boolean().optional(),
  hasSpa: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  terraceSize: z.number().min(0).optional(),
  garageSpaces: z.number().int().min(0).optional(),
  studioType: z.string().optional(),
  studioHeight: z.number().min(0).optional(),
  hasGreenScreen: z.boolean().optional(),
  hasSoundproofing: z.boolean().optional(),
  parkingType: z.string().optional(),
  parkingCovered: z.boolean().optional(),
  parkingSecured: z.boolean().optional(),
  parkingLength: z.number().min(0).optional(),
  parkingWidth: z.number().min(0).optional(),
  parkingHeight: z.number().min(0).optional(),
  hasEVCharger: z.boolean().optional(),
  hourlyIncrement: z.number().int().min(15).max(1440).optional(),
  minDurationMinutes: z.number().int().min(0).optional(),
  maxDurationMinutes: z.number().int().min(0).optional(),
  advanceNoticeDays: z.number().int().min(0).optional(),
  maxAdvanceBookingDays: z.number().int().min(0).optional(),
  cleaningFee: z.number().min(0).optional(),
  extraGuestFee: z.number().min(0).optional(),
  extraGuestThreshold: z.number().int().min(1).optional(),
  weekendPriceMultiplier: z.number().min(0).optional(),
  discountHours2Plus: z.number().min(0).max(100).optional(),
  discountHours4Plus: z.number().min(0).max(100).optional(),
  discountHours8Plus: z.number().min(0).max(100).optional(),
  discountDays2Plus: z.number().min(0).max(100).optional(),
  discountDays5Plus: z.number().min(0).max(100).optional(),
  discountDays14Plus: z.number().min(0).max(100).optional(),
  lastMinuteDiscount: z.number().min(0).max(100).optional(),
  lastMinuteDiscountDays: z.number().int().min(1).optional(),
  earlyBirdDiscount: z.number().min(0).max(100).optional(),
  earlyBirdDiscountDays: z.number().int().min(1).optional(),
  firstBookingDiscount: z.number().min(0).max(100).optional(),
  spaceDescription: z.string().optional(),
  guestAccessDescription: z.string().optional(),
  neighborhoodDescription: z.string().optional(),
  transitDescription: z.string().optional(),
  houseRules: z.array(z.string()).optional(),
  notesDescription: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  customHouseRules: z.string().optional(),
  checkInStart: z.string().optional(),
  checkInEnd: z.string().optional(),
  checkOutTime: z.string().optional(),
  selfCheckIn: z.boolean().optional(),
  checkInMethod: z.enum(["MEET_IN_PERSON", "LOCKBOX", "KEYPAD", "SMART_LOCK", "DOORMAN"]).optional(),
  petsAllowed: z.boolean().optional(),
  petTypes: z.array(z.string()).optional(),
  petFee: z.number().min(0).optional(),
  smokingAllowed: z.boolean().optional(),
  eventsAllowed: z.boolean().optional(),
  childrenAllowed: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  latPublic: z.number().min(-90).max(90),
  lngPublic: z.number().min(-180).max(180),
});

export const createBookingSchema = z
  .object({
    listingId: idSchema,
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    pricingMode: z.enum(["DAILY", "HOURLY", "BOTH"]),
    guests: z.union([
      z.number().int().min(1),
      z.object({
        adults: z.number().int().min(0).optional(),
        children: z.number().int().min(0).optional(),
        infants: z.number().int().min(0).optional(),
      })
    ]).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "La date de fin doit être après la date de début",
    path: ["endDate"],
  });

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const signupEmailSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Mot de passe minimum 8 caractères"),
  name: z.string().min(1, "Nom requis"),
});

export const signupVerifySchema = z.object({
  email: emailSchema,
  code: z.string().min(6, "Code requis"),
});

// Booking schemas
export const refundBookingSchema = z.object({
  bookingId: idSchema,
  reason: z.string().min(10, "Raison requise (min 10 caractères)"),
});

// Checkout schema
export const createCheckoutSchema = z.object({
  amountCents: z.number().int().min(1),
  currency: currencySchema.optional(),
  applicationFeeCents: z.number().int().min(0).optional(),
  metadata: z.record(z.string()).optional(),
});

// Message schema
export const sendMessageSchema = z.object({
  conversationId: idSchema.optional(),
  content: z.string().min(1, "Message requis").max(5000, "Message trop long"),
  listingId: idSchema.optional(),
  bookingId: idSchema.optional(),
  recipientId: idSchema.optional(),
});

// Profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nom requis").optional(),
  bio: z.string().max(500, "Bio trop longue").optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  postalAddressLine1: z.string().optional(),
  postalAddressLine2: z.string().optional(),
  postalAddressCity: z.string().optional(),
  postalAddressPostalCode: z.string().optional(),
  postalAddressCountry: z.string().optional(),
  postalAddressProvince: z.string().optional(),
  postalAddressSameAsResidential: z.boolean().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
});

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

export function parseWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message ?? "Validation échouée",
    errors: result.error.issues,
  };
}

export async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; error: string; status: number }
> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Validation échouée",
      status: 400,
    };
  } catch (error) {
    return {
      success: false,
      error: "Corps de requête invalide",
      status: 400,
    };
  }
}
