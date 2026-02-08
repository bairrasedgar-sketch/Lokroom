/**
 * Optimisations de performance pour Next.js
 * Lazy loading, code splitting, et optimisations avancées
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Lazy load un composant avec loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFunc, {
    loading: options?.loading || (() => (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    )),
    ssr: options?.ssr ?? true,
  });
}

/**
 * Composants lazy loadés pour optimiser le bundle
 */

// Modals (chargés uniquement quand nécessaire)
export const LazyLoginModal = lazyLoad(
  () => import('@/components/modals/LoginModal'),
  { ssr: false }
);

export const LazyBookingModal = lazyLoad(
  () => import('@/components/modals/BookingModal'),
  { ssr: false }
);

export const LazyImageGallery = lazyLoad(
  () => import('@/components/ImageGallery'),
  { ssr: false }
);

// Maps (lourd, chargé uniquement sur les pages qui en ont besoin)
export const LazyMap = lazyLoad(
  () => import('@/components/Map'),
  { ssr: false }
);

// Éditeur de texte riche (très lourd)
export const LazyRichTextEditor = lazyLoad(
  () => import('@/components/RichTextEditor'),
  { ssr: false }
);

// Graphiques et analytics
export const LazyChart = lazyLoad(
  () => import('@/components/Chart'),
  { ssr: false }
);

// Calendrier (lourd)
export const LazyCalendar = lazyLoad(
  () => import('@/components/Calendar'),
  { ssr: false }
);

/**
 * Précharger un composant (pour améliorer la perception de performance)
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Précharger après un court délai
    setTimeout(() => {
      importFunc();
    }, 100);
  }
}

/**
 * Hook pour lazy load des données
 */
export function useLazyData<T>(
  fetchFunc: () => Promise<T>,
  options?: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunc();
      setData(result);
      options?.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunc, options]);

  return { data, isLoading, error, load };
}

/**
 * Optimisation des images avec lazy loading natif
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onLoad,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
}) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
      />
    </div>
  );
}

/**
 * Intersection Observer pour lazy loading manuel
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Composant pour lazy load au scroll
 */
export function LazyLoadOnScroll({
  children,
  placeholder,
  rootMargin = '100px',
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin });
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isVisible, hasLoaded]);

  return (
    <div ref={ref}>
      {hasLoaded ? children : placeholder || <div className="h-64 bg-gray-100 animate-pulse" />}
    </div>
  );
}

/**
 * Debounce pour optimiser les recherches
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle pour optimiser les événements fréquents
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook pour mesurer les performances de rendu
 */
export function useRenderPerformance(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 16) { // Plus de 16ms = moins de 60fps
        console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  });
}

// Import React pour les hooks
import React from 'react';
