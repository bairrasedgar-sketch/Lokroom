"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { XMarkIcon, PlusIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Image from "next/image";

type Wishlist = {
  id: string;
  name: string;
  _count: { favorites: number };
  favorites: {
    listing: {
      id: string;
      images: { url: string }[];
    };
  }[];
};

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
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [savingTo, setSavingTo] = useState<string | null>(null);

  // Charger les wishlists
  useEffect(() => {
    if (!isOpen || status !== "authenticated") return;

    setLoading(true);
    fetch("/api/wishlists")
      .then((res) => res.json())
      .then((data) => {
        setWishlists(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, status]);

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
        // Ajouter immédiatement le favori à cette nouvelle liste
        await saveToWishlist(newWishlist.id);
        setNewListName("");
        setShowCreateInput(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold">Ajouter aux favoris</h2>
          <div className="w-7" />
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
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
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:border-gray-400 hover:shadow-md"
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
                                  sizes="100px"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <HeartIcon className="h-12 w-12 text-gray-300" />
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                        {savingTo === wishlist.id ? (
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <HeartSolid className="h-8 w-8 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="font-medium text-gray-900">{wishlist.name}</p>
                      <p className="text-sm text-gray-500">
                        {wishlist._count.favorites} annonce{wishlist._count.favorites !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Bouton créer nouvelle liste */}
              <button
                onClick={() => setShowCreateInput(true)}
                className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100"
              >
                <PlusIcon className="h-8 w-8" />
                <span className="mt-2 text-sm font-medium">Créer une liste</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer - Create new list input */}
        {showCreateInput && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nom de la liste..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowCreateInput(false);
                }}
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newListName.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {creating ? "..." : "Créer"}
              </button>
              <button
                onClick={() => {
                  setShowCreateInput(false);
                  setNewListName("");
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
