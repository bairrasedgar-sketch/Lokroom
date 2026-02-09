/**
 * Tests unitaires pour le moteur de frais
 * Coverage: calculs de frais critiques
 */

import { computeFees, inferRegion } from '../fees';

describe('Fees Engine', () => {
  describe('computeFees', () => {
    it('should compute fees for EUR/France', () => {
      const result = computeFees({
        priceCents: 10000, // 100 EUR
        currency: 'EUR',
        region: 'FRANCE',
      });

      expect(result.currency).toBe('EUR');
      expect(result.region).toBe('FRANCE');
      expect(result.hostFeeCents).toBeGreaterThan(0);
      expect(result.guestFeeCents).toBeGreaterThan(0);
      expect(result.taxOnGuestFeeCents).toBeGreaterThan(0);
      expect(result.chargeCents).toBeGreaterThan(10000);
      expect(result.hostPayoutCents).toBeLessThan(10000);
    });

    it('should compute fees for CAD/Quebec', () => {
      const result = computeFees({
        priceCents: 10000, // 100 CAD
        currency: 'CAD',
        region: 'QC',
      });

      expect(result.currency).toBe('CAD');
      expect(result.region).toBe('QC');
      expect(result.hostFeeCents).toBeGreaterThan(0);
      expect(result.guestFeeCents).toBeGreaterThan(0);
    });

    it('should apply lower fees for higher prices', () => {
      const lowPrice = computeFees({
        priceCents: 1500, // 15 EUR
        currency: 'EUR',
        region: 'FRANCE',
      });

      const highPrice = computeFees({
        priceCents: 50000, // 500 EUR
        currency: 'EUR',
        region: 'FRANCE',
      });

      // Percentage should be lower for higher prices
      const lowPricePct = lowPrice.hostFeeCents / 1500;
      const highPricePct = highPrice.hostFeeCents / 50000;
      expect(highPricePct).toBeLessThan(lowPricePct);
    });

    it('should apply superhost discount', () => {
      const regular = computeFees({
        priceCents: 10000,
        currency: 'EUR',
        region: 'FRANCE',
        isSuperhost: false,
      });

      const superhost = computeFees({
        priceCents: 10000,
        currency: 'EUR',
        region: 'FRANCE',
        isSuperhost: true,
      });

      expect(superhost.hostFeeCents).toBeLessThan(regular.hostFeeCents);
      expect(superhost.hostPayoutCents).toBeGreaterThan(regular.hostPayoutCents);
    });

    it('should apply booking kind multipliers', () => {
      const stay = computeFees({
        priceCents: 10000,
        currency: 'EUR',
        region: 'FRANCE',
        bookingKind: 'stay',
      });

      const parking = computeFees({
        priceCents: 10000,
        currency: 'EUR',
        region: 'FRANCE',
        bookingKind: 'parking',
      });

      const meeting = computeFees({
        priceCents: 10000,
        currency: 'EUR',
        region: 'FRANCE',
        bookingKind: 'meeting',
      });

      // Parking should have lower fees
      expect(parking.hostFeeCents).toBeLessThan(stay.hostFeeCents);
      expect(parking.guestFeeCents).toBeLessThan(stay.guestFeeCents);

      // Meeting should have higher fees
      expect(meeting.hostFeeCents).toBeGreaterThan(stay.hostFeeCents);
      expect(meeting.guestFeeCents).toBeGreaterThan(stay.guestFeeCents);
    });

    it('should respect minimum fees', () => {
      const result = computeFees({
        priceCents: 100, // Very low price
        currency: 'EUR',
        region: 'FRANCE',
      });

      // Should apply minimum fee (30 cents for host, 50 for guest)
      expect(result.hostFeeCents).toBeGreaterThanOrEqual(30);
      expect(result.guestFeeCents).toBeGreaterThanOrEqual(50);
    });

    it('should throw error for invalid price', () => {
      expect(() => {
        computeFees({
          priceCents: 0,
          currency: 'EUR',
          region: 'FRANCE',
        });
      }).toThrow();

      expect(() => {
        computeFees({
          priceCents: -100,
          currency: 'EUR',
          region: 'FRANCE',
        });
      }).toThrow();
    });
  });

  describe('inferRegion', () => {
    it('should infer FRANCE for EUR', () => {
      const region = inferRegion({
        currency: 'EUR',
        country: 'France',
      });
      expect(region).toBe('FRANCE');
    });

    it('should infer Quebec for QC province', () => {
      const region = inferRegion({
        currency: 'CAD',
        country: 'Canada',
        provinceCode: 'QC',
      });
      expect(region).toBe('QC');
    });

    it('should infer Ontario for ON province', () => {
      const region = inferRegion({
        currency: 'CAD',
        country: 'Canada',
        provinceCode: 'ON',
      });
      expect(region).toBe('ON');
    });

    it('should handle lowercase province codes', () => {
      const region = inferRegion({
        currency: 'CAD',
        country: 'Canada',
        provinceCode: 'qc',
      });
      expect(region).toBe('QC');
    });

    it('should default to QC for Canada without province', () => {
      const region = inferRegion({
        currency: 'CAD',
        country: 'Canada',
      });
      expect(region).toBe('QC');
    });
  });
});
