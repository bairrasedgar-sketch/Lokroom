'use client';

import { useEffect, useState } from 'react';

/**
 * Composant de loading uniforme pour toute l'application
 * Style professionnel avec animation fluide
 */
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full border-2 border-gray-200 border-t-black rounded-full animate-spin" />
    </div>
  );
}

/**
 * Loading state pleine page
 */
export function LoadingPage({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}

/**
 * Loading overlay (pour les modals, etc.)
 */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center">
        <LoadingSpinner size="lg" />
        {message && <p className="mt-4 text-sm text-gray-900">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Skeleton pour les cartes d'annonces
 */
export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour la liste d'annonces
 */
export function ListingsGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton pour le détail d'une annonce
 */
export function ListingDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Images skeleton */}
      <div className="grid grid-cols-2 gap-2 mb-8">
        <div className="col-span-2 h-96 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour le profil utilisateur
 */
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton générique pour les listes
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Hook pour gérer les états de loading
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return { isLoading, startLoading, stopLoading, setIsLoading };
}

/**
 * Hook pour gérer les loading states avec timeout
 */
export function useLoadingWithTimeout(timeout = 30000) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setHasTimedOut(true);
      setIsLoading(false);
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  return {
    isLoading,
    hasTimedOut,
    startLoading: () => {
      setIsLoading(true);
      setHasTimedOut(false);
    },
    stopLoading: () => setIsLoading(false),
  };
}
