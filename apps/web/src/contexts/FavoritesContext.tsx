"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";

type WishlistFavorite = {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    price: number;
    currency: string;
    images: { url: string }[];
  };
};

type Wishlist = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { favorites: number };
  favorites: WishlistFavorite[];
};

type FavoritesContextType = {
  favoritedListings: Set<string>;
  wishlists: Wishlist[];
  addFavorite: (listingId: string) => void;
  removeFavorite: (listingId: string) => void;
  isFavorited: (listingId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  refreshWishlists: () => Promise<void>;
  deleteWishlist: (wishlistId: string) => Promise<boolean>;
  updateWishlistName: (wishlistId: string, newName: string) => Promise<boolean>;
  removeFavoriteFromWishlist: (listingId: string) => Promise<boolean>;
  isLoading: boolean;
  wishlistsLoading: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [favoritedListings, setFavoritedListings] = useState<Set<string>>(new Set());
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistsLoading, setWishlistsLoading] = useState(false);

  const addFavorite = useCallback((listingId: string) => {
    setFavoritedListings((prev) => {
      const next = new Set(prev);
      next.add(listingId);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((listingId: string) => {
    setFavoritedListings((prev) => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });
    // Mettre à jour les wishlists localement
    setWishlists((prev) =>
      prev.map((w) => ({
        ...w,
        favorites: w.favorites.filter((f) => f.listingId !== listingId),
        _count: {
          ...w._count,
          favorites: w.favorites.filter((f) => f.listingId !== listingId).length,
        },
      }))
    );
  }, []);

  const isFavorited = useCallback(
    (listingId: string) => {
      return favoritedListings.has(listingId);
    },
    [favoritedListings]
  );

  const refreshFavorites = useCallback(async () => {
    if (status !== "authenticated") {
      setFavoritedListings(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(data.favorites.map((f: { id: string }) => f.id));
        setFavoritedListings(ids);
      }
    } catch (error) {
      console.error("Error refreshing favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const refreshWishlists = useCallback(async () => {
    if (status !== "authenticated") {
      setWishlists([]);
      return;
    }

    setWishlistsLoading(true);
    try {
      const res = await fetch("/api/wishlists");
      if (res.ok) {
        const data = await res.json();
        setWishlists(Array.isArray(data) ? data : []);
        // Mettre à jour aussi les favoris depuis les wishlists
        const allFavoriteIds = new Set<string>();
        (Array.isArray(data) ? data : []).forEach((w: Wishlist) => {
          w.favorites.forEach((f) => {
            allFavoriteIds.add(f.listingId);
          });
        });
        setFavoritedListings(allFavoriteIds);
      }
    } catch (error) {
      console.error("Error refreshing wishlists:", error);
    } finally {
      setWishlistsLoading(false);
    }
  }, [status]);

  const deleteWishlist = useCallback(async (wishlistId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/wishlists/${wishlistId}`, { method: "DELETE" });
      if (res.ok) {
        // Récupérer les listingIds de cette wishlist avant de la supprimer
        const wishlistToDelete = wishlists.find((w) => w.id === wishlistId);
        const listingIdsToRemove = wishlistToDelete?.favorites.map((f) => f.listingId) || [];

        // Mettre à jour les wishlists
        setWishlists((prev) => prev.filter((w) => w.id !== wishlistId));

        // Retirer les favoris de la liste
        setFavoritedListings((prev) => {
          const next = new Set(prev);
          listingIdsToRemove.forEach((id) => next.delete(id));
          return next;
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting wishlist:", error);
      return false;
    }
  }, [wishlists]);

  const updateWishlistName = useCallback(async (wishlistId: string, newName: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setWishlists((prev) =>
          prev.map((w) => (w.id === wishlistId ? { ...w, name: newName } : w))
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating wishlist name:", error);
      return false;
    }
  }, []);

  const removeFavoriteFromWishlist = useCallback(async (listingId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/favorites/${listingId}`, { method: "DELETE" });
      if (res.ok) {
        removeFavorite(listingId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removing favorite:", error);
      return false;
    }
  }, [removeFavorite]);

  // Charger les favoris et wishlists au montage et quand l'utilisateur se connecte
  useEffect(() => {
    if (status === "authenticated") {
      refreshWishlists();
    } else {
      setFavoritedListings(new Set());
      setWishlists([]);
    }
  }, [status, refreshWishlists]);

  return (
    <FavoritesContext.Provider
      value={{
        favoritedListings,
        wishlists,
        addFavorite,
        removeFavorite,
        isFavorited,
        refreshFavorites,
        refreshWishlists,
        deleteWishlist,
        updateWishlistName,
        removeFavoriteFromWishlist,
        isLoading,
        wishlistsLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
