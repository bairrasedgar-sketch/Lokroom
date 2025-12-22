"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { XMarkIcon, PlusIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useFavorites } from "@/contexts/FavoritesContext";

type WishlistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  onSaved: () => void;
};

export default function WishlistModal({
  isOpen,
  onClose,
  listingId,
  onSaved,
}: WishlistModalProps) {
  const { status } = useSession();
  const { wishlists, refreshWishlists, wishlistsLoading } = useFavorites();
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [savingTo, setSavingTo] = useState<string | null>(null);

  // Rafraîchir les wishlists quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && status === "authenticated") {
      refreshWishlists();
    }
  }, [isOpen, status, refreshWishlists]);

  // Créer une nouvelle liste
  const handleCreate = async () => {
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });

      if (res.ok) {
        const newWishlist = await res.json();
        setNewListName("");
        setShowCreateInput(false);
        // Ajouter immédiatement le favori à cette nouvelle liste
        await saveToWishlist(newWishlist.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  // Sauvegarder dans une liste
  const saveToWishlist = async (wishlistId: string) => {
    setSavingTo(wishlistId);
    try {
      await fetch(`/api/favorites/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId }),
      });
      // Rafraîchir les wishlists pour mettre à jour le contexte global
      await refreshWishlists();
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTo(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Plus grand et mieux centré */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl animate-modal-appear">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-5">
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold">Ajouter aux favoris</h2>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-8">
          {wishlistsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {/* Listes existantes */}
              {wishlists.map((wishlist) => {
                const previewImages = wishlist.favorites
                  .slice(0, 4)
                  .map((f) => f.listing.images[0]?.url)
                  .filter(Boolean);

                return (
                  <button
                    key={wishlist.id}
                    onClick={() => saveToWishlist(wishlist.id)}
                    disabled={savingTo === wishlist.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white text-left transition-all hover:border-gray-400 hover:shadow-lg hover:scale-[1.02]"
                  >
                    {/* Preview images grid */}
                    <div className="relative aspect-square w-full bg-gray-100">
                      {previewImages.length > 0 ? (
                        <div className="grid h-full w-full grid-cols-2 gap-0.5">
                          {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="relative bg-gray-200">
                              {previewImages[idx] && (
                                <Image
                                  src={previewImages[idx]}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="150px"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <HeartIcon className="h-16 w-16 text-gray-300" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        {savingTo === wishlist.id ? (
                          <div className="h-8 w-8 animate-spin rounded-full border-3 border-white border-t-transparent" />
                        ) : (
                          <HeartSolid className="h-12 w-12 text-white drop-shadow-lg" />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-base">{wishlist.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {wishlist._count.favorites} annonce{wishlist._count.favorites !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Bouton créer nouvelle liste */}
              <button
                onClick={() => setShowCreateInput(true)}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-all hover:border-[#FF385C] hover:bg-[#FF385C]/5 hover:text-[#FF385C] hover:scale-[1.02]"
              >
                <PlusIcon className="h-12 w-12" />
                <span className="mt-3 text-base font-semibold">Créer une liste</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer - Create new list input */}
        {showCreateInput && (
          <div className="border-t border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Nom de la nouvelle liste</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ex: Vacances d'été, Week-end..."
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-gray-900 focus:outline-none transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowCreateInput(false);
                }}
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newListName.trim()}
                className="rounded-xl bg-[#FF385C] px-6 py-3 text-base font-semibold text-white hover:bg-[#E31C5F] disabled:opacity-50 transition-colors"
              >
                {creating ? "..." : "Créer"}
              </button>
              <button
                onClick={() => {
                  setShowCreateInput(false);
                  setNewListName("");
                }}
                className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animation CSS */}
      <style jsx global>{`
        @keyframes modal-appear {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-appear {
          animation: modal-appear 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
