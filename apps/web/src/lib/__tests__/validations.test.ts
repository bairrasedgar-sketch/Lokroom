/**
 * Tests unitaires pour les validations Zod
 * Coverage: schémas de validation critiques
 */

import {
  emailSchema,
  idSchema,
  priceSchema,
  currencySchema,
  createListingSchema,
  createBookingSchema,
  parseWithSchema,
} from '../validations';

describe('Validations - Primitives', () => {
  describe('emailSchema', () => {
    it('should validate correct email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should normalize email to lowercase', () => {
      const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  test@example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });
  });

  describe('idSchema', () => {
    it('should validate valid ID', () => {
      const result = idSchema.safeParse('clx123abc');
      expect(result.success).toBe(true);
    });

    it('should reject empty ID', () => {
      const result = idSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject ID with invalid characters', () => {
      const result = idSchema.safeParse('id with spaces');
      expect(result.success).toBe(false);
    });
  });

  describe('priceSchema', () => {
    it('should validate valid price', () => {
      const result = priceSchema.safeParse(50);
      expect(result.success).toBe(true);
    });

    it('should reject price below minimum', () => {
      const result = priceSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject price above maximum', () => {
      const result = priceSchema.safeParse(200000);
      expect(result.success).toBe(false);
    });
  });

  describe('currencySchema', () => {
    it('should validate supported currencies', () => {
      expect(currencySchema.safeParse('EUR').success).toBe(true);
      expect(currencySchema.safeParse('CAD').success).toBe(true);
      expect(currencySchema.safeParse('USD').success).toBe(true);
    });

    it('should reject unsupported currency', () => {
      const result = currencySchema.safeParse('JPY');
      expect(result.success).toBe(false);
    });
  });
});

describe('Validations - Listings', () => {
  describe('createListingSchema', () => {
    const validListing = {
      title: 'Beautiful Apartment in Paris',
      description: 'A lovely place to stay with great amenities and location.',
      price: 100,
      currency: 'EUR',
      country: 'France',
      addressFull: '123 Rue de la Paix, 75001 Paris',
      type: 'APARTMENT',
      pricingMode: 'DAILY',
    };

    it('should validate complete listing', () => {
      const result = createListingSchema.safeParse(validListing);
      expect(result.success).toBe(true);
    });

    it('should reject listing with short title', () => {
      const result = createListingSchema.safeParse({
        ...validListing,
        title: 'Ab',
      });
      expect(result.success).toBe(false);
    });

    it('should reject listing with short description', () => {
      const result = createListingSchema.safeParse({
        ...validListing,
        description: 'Short',
      });
      expect(result.success).toBe(false);
    });

    it('should validate listing with optional fields', () => {
      const result = createListingSchema.safeParse({
        ...validListing,
        maxGuests: 4,
        beds: 2,
        bathrooms: 1,
        isInstantBook: true,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validations - Bookings', () => {
  describe('createBookingSchema', () => {
    const validBooking = {
      listingId: 'clx123abc',
      startDate: '2026-03-01T10:00:00Z',
      endDate: '2026-03-03T10:00:00Z',
      pricingMode: 'DAILY',
    };

    it('should validate complete booking', () => {
      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('should reject booking with end date before start date', () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        startDate: '2026-03-03T10:00:00Z',
        endDate: '2026-03-01T10:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should validate booking with guest count', () => {
      const result = createBookingSchema.safeParse({
        ...validBooking,
        guests: 2,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Validation Helpers', () => {
  describe('parseWithSchema', () => {
    it('should return success for valid data', () => {
      const result = parseWithSchema(priceSchema, 50);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(50);
      }
    });

    it('should return error for invalid data', () => {
      const result = parseWithSchema(priceSchema, -10);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.errors).toBeDefined();
      }
    });
  });
});
