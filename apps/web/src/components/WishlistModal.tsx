"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { XMarkIcon, PlusIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";


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
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté côté client pour le portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Rafraîchir les wishlists quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && status === "authenticated") {
      refreshWishlists();
    }
  }, [isOpen, status, refreshWishlists]);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Erreur lors de la création");
      }

      const newWishlist = await res.json();
      setNewListName("");
      setShowCreateInput(false);
      // Ajouter immédiatement le favori à cette nouvelle liste
      await saveToWishlist(newWishlist.id);
    } catch (e) {
      logger.error("Failed to create wishlist", { error: e instanceof Error ? e.message : String(e) });
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création de la liste");
    } finally {
      setCreating(false);
    }
  };

  // Sauvegarder dans une liste
  const saveToWishlist = async (wishlistId: string) => {
    setSavingTo(wishlistId);
    try {
      const res = await fetch(`/api/favorites/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Erreur lors de l'ajout aux favoris");
      }

      // Rafraîchir les wishlists pour mettre à jour le contexte global
      await refreshWishlists();
      onSaved();
      onClose();
    } catch (e) {
      logger.error("Failed to add to wishlist", { error: e instanceof Error ? e.message : String(e) });
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'ajout aux favoris");
    } finally {
      setSavingTo(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlist-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: 99999 }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[calc(100vw-32px)] sm:max-w-md md:max-w-lg lg:max-w-2xl rounded-3xl bg-white shadow-2xl animate-modal-appear"
        style={{ zIndex: 100000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-5">
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <h2 id="wishlist-modal-title" className="text-lg sm:text-xl font-semibold">Ajouter aux favoris</h2>
          <div className="w-9 sm:w-10" />
        </div>

        {/* Content */}
        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto p-4 sm:p-8">
          {wishlistsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
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
                                  alt={`Apercu de la liste ${wishlist.name}`}
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
                    <div className="p-3 sm:p-4">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{wishlist.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
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
                <PlusIcon className="h-8 w-8 sm:h-12 sm:w-12" />
                <span className="mt-2 sm:mt-3 text-sm sm:text-base font-semibold">Créer une liste</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer - Create new list input */}
        {showCreateInput && (
          <div className="border-t border-gray-200 p-4 sm:p-6">
            <p className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Nom de la nouvelle liste</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ex: Vacances d'été..."
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-gray-900 focus:outline-none transition-colors"
                aria-label="Nom de la nouvelle liste de favoris"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowCreateInput(false);
                }}
              />
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newListName.trim()}
                  className="flex-1 sm:flex-none rounded-xl bg-[#FF385C] px-5 sm:px-6 py-3 text-base font-semibold text-white hover:bg-[#E31C5F] disabled:opacity-50 transition-colors"
                >
                  {creating ? "..." : "Créer"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateInput(false);
                    setNewListName("");
                  }}
                  className="flex-1 sm:flex-none rounded-xl border-2 border-gray-200 px-4 py-3 text-base font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
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

  // Utiliser un portal pour rendre le modal directement dans le body
  return createPortal(modalContent, document.body);
}
