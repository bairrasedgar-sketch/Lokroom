/**
 * Tests unitaires pour les frais de réservation
 * Coverage: calculs de frais client
 */

import { buildClientFeeBreakdown } from '../bookingFees';

describe('Booking Fees', () => {
  describe('buildClientFeeBreakdown', () => {
    it('should build fee breakdown for single night', () => {
      const result = buildClientFeeBreakdown({
        nights: 1,
        pricePerNight: 100,
        currency: 'EUR',
        region: 'FRANCE',
      });

      expect(result.nights).toBe(1);
      expect(result.currency).toBe('EUR');
      expect(result.basePriceCents).toBe(10000);
      expect(result.lines).toHaveLength(4);

      // Check line codes
      const codes = result.lines.map(l => l.code);
      expect(codes).toContain('base');
      expect(codes).toContain('service_guest');
      expect(codes).toContain('taxes');
      expect(codes).toContain('total');
    });

    it('should build fee breakdown for multiple nights', () => {
      const result = buildClientFeeBreakdown({
        nights: 3,
        pricePerNight: 100,
        currency: 'EUR',
        region: 'FRANCE',
      });

      expect(result.nights).toBe(3);
      expect(result.basePriceCents).toBe(30000); // 3 * 100 EUR

      const baseLine = result.lines.find(l => l.code === 'base');
      expect(baseLine?.label).toContain('3 nuits');
    });

    it('should calculate total correctly', () => {
      const result = buildClientFeeBreakdown({
        nights: 2,
        pricePerNight: 100,
        currency: 'EUR',
        region: 'FRANCE',
      });

      const totalLine = result.lines.find(l => l.code === 'total');
      const baseLine = result.lines.find(l => l.code === 'base');
      const serviceLine = result.lines.find(l => l.code === 'service_guest');
      const taxLine = result.lines.find(l => l.code === 'taxes');

      expect(totalLine?.amountCents).toBe(
        (baseLine?.amountCents || 0) +
        (serviceLine?.amountCents || 0) +
        (taxLine?.amountCents || 0)
      );
    });

    it('should emphasize total line', () => {
      const result = buildClientFeeBreakdown({
        nights: 1,
        pricePerNight: 100,
        currency: 'EUR',
        region: 'FRANCE',
      });

      const totalLine = result.lines.find(l => l.code === 'total');
      expect(totalLine?.emphasize).toBe(true);
    });

    it('should calculate platform net', () => {
      const result = buildClientFeeBreakdown({
        nights: 1,
        pricePerNight: 100,
        currency: 'EUR',
        region: 'FRANCE',
      });

      expect(result.platformNetCents).toBeGreaterThan(0);
      expect(result.platformNetCents).toBeLessThan(
        result.fees.hostFeeCents + result.fees.guestFeeCents + result.fees.taxOnGuestFeeCents
      );
    });

    it('should work with CAD currency', () => {
      const result = buildClientFeeBreakdown({
        nights: 1,
        pricePerNight: 100,
        currency: 'CAD',
        region: 'QC',
      });

      expect(result.currency).toBe('CAD');
      expect(result.fees.region).toBe('QC');
    });

    it('should handle decimal prices correctly', () => {
      const result = buildClientFeeBreakdown({
        nights: 1,
        pricePerNight: 99.99,
        currency: 'EUR',
        region: 'FRANCE',
      });

      expect(result.basePriceCents).toBe(9999);
    });
  });
});
