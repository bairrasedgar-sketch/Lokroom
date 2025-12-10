"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type FavoritesContextType = {
  favorites: Set<string>;
  setFavorited: (listingId: string, isFavorited: boolean) => void;
  isFavorited: (listingId: string) => boolean;
  refreshKey: number;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  const setFavorited = useCallback((listingId: string, isFavorited: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorited) {
        next.add(listingId);
      } else {
        next.delete(listingId);
      }
      return next;
    });
    // Incrémenter la clé pour forcer le re-render des composants qui écoutent
    setRefreshKey((k) => k + 1);
  }, []);

  const isFavorited = useCallback(
    (listingId: string) => favorites.has(listingId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, setFavorited, isFavorited, refreshKey }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    // Retourner des valeurs par défaut si pas de provider (pour éviter les erreurs)
    return {
      favorites: new Set<string>(),
      setFavorited: () => {},
      isFavorited: () => false,
      refreshKey: 0,
    };
  }
  return context;
}
