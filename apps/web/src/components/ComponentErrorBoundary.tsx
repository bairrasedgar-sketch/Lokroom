'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
}

/**
 * Error Boundary spécialisé pour les composants critiques
 * Affiche un fallback compact en cas d'erreur
 */
export function ComponentErrorBoundary({
  children,
  componentName = 'ce composant'
}: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Erreur dans {componentName}
              </h3>
              <p className="mt-1 text-xs text-red-600">
                Une erreur s'est produite lors du chargement de ce composant.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
