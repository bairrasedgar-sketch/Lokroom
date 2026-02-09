/**
 * Tests unitaires pour les utilitaires
 * Coverage: fonctions helper critiques
 */

import { cn } from '../utils';

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should handle false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).not.toContain('active-class');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      // Should keep the last px value
      expect(result).toContain('px-4');
      expect(result).toContain('py-1');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['text-sm', 'font-bold'], 'text-red-500');
      expect(result).toContain('text-sm');
      expect(result).toContain('font-bold');
      expect(result).toContain('text-red-500');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'other');
      expect(result).toContain('base');
      expect(result).toContain('other');
    });

    it('should handle empty strings', () => {
      const result = cn('base', '', 'other');
      expect(result).toContain('base');
      expect(result).toContain('other');
    });
  });
});
