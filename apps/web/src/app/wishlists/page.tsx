"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { PencilIcon, TrashIcon, HeartIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/FavoritesContext";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3 h-6 w-2/3 rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-gray-200" />
        ))}
      </div>
      <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

export default function WishlistsPage() {
  const { status } = useSession();
  const {
    wishlists,
    wishlistsLoading,
    deleteWishlist,
    updateWishlistName,
    removeFavoriteFromWishlist,
    refreshWishlists,
  } = useFavorites();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Rafraîchir les wishlists au montage
  useEffect(() => {
    if (status === "authenticated") {
      refreshWishlists();
    }
  }, [status, refreshWishlists]);

  // Supprimer une wishlist
  async function handleDeleteWishlist(id: string, name: string) {
    if (!confirm(`Supprimer la liste "${name}" ? Tous les favoris de cette liste seront supprimés.`)) return;

    const success = await deleteWishlist(id);
    if (success) {
      toast.success("Liste supprimée");
      if (expandedId === id) setExpandedId(null);
    } else {
      toast.error("Impossible de supprimer la liste");
    }
  }

  // Modifier le nom d'une wishlist
  async function handleUpdateWishlistName(id: string) {
    if (!editName.trim()) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }

    const success = await updateWishlistName(id, editName.trim());
    if (success) {
      setEditingId(null);
      setEditName("");
      toast.success("Liste renommée");
    } else {
      toast.error("Impossible de renommer la liste");
    }
  }

  // Supprimer une annonce d'une wishlist
  async function handleRemoveFavorite(listingId: string, wishlistName: string) {
    if (!confirm(`Retirer cette annonce de "${wishlistName}" ?`)) return;

    const success = await removeFavoriteFromWishlist(listingId);
    if (success) {
      toast.success("Annonce retirée des favoris");
    } else {
      toast.error("Impossible de retirer l'annonce");
    }
  }

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <HeartIcon className="mb-4 h-16 w-16 text-gray-300" />
          <h1 className="text-2xl font-semibold text-gray-900">Connecte-toi pour voir tes listes</h1>
          <p className="mt-2 text-sm text-gray-500">
            Crée des listes pour organiser tes annonces favorites
          </p>
          <Link
            href="/api/auth/signin"
            className="mt-6 inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Mes listes de favoris</h1>
        <p className="mt-2 text-sm text-gray-500">
          Organise tes annonces favorites en catégories
        </p>
      </header>

      {wishlistsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : wishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF385C]/10">
            <HeartSolid className="h-8 w-8 text-[#FF385C]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Aucune liste pour le moment</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Commence à ajouter des annonces à tes favoris pour créer des listes
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition"
          >
            Découvrir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlists.map((wishlist) => {
            const previewImages = wishlist.favorites
              .slice(0, 4)
              .map((f) => f.listing.images[0]?.url)
              .filter(Boolean);

            const isExpanded = expandedId === wishlist.id;
            const isEditing = editingId === wishlist.id;

            return (
              <div
                key={wishlist.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Header avec nom et actions */}
                <div className="border-b border-gray-100 p-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateWishlistName(wishlist.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                      />
                      <button
                        onClick={() => handleUpdateWishlistName(wishlist.id)}
                        className="rounded-lg bg-gray-900 p-1.5 text-white hover:bg-black"
                        title="Valider"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName("");
                        }}
                        className="rounded-lg border border-gray-300 p-1.5 hover:bg-gray-50"
                        title="Annuler"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">{wishlist.name}</h2>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(wishlist.id);
                            setEditName(wishlist.name);
                          }}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Renommer"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWishlist(wishlist.id, wishlist.name)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {wishlist._count.favorites} annonce{wishlist._count.favorites !== 1 ? "s" : ""}
                  </p>
                </div>

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
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
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
                </div>

                {/* Bouton pour voir toutes les annonces */}
                {wishlist.favorites.length > 0 && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : wishlist.id)}
                    className="border-t border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    {isExpanded ? "Masquer les annonces" : "Voir toutes les annonces"}
                  </button>
                )}

                {/* Liste complète des annonces (expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-3">
                      {wishlist.favorites.map((fav) => {
                        const listing = fav.listing;
                        const imageUrl = listing.images[0]?.url;
                        const location = [listing.city, listing.country].filter(Boolean).join(", ");

                        return (
                          <div
                            key={fav.id}
                            className="group flex gap-3 rounded-lg border border-gray-200 bg-white p-2 transition hover:shadow-sm"
                          >
                            {/* Image */}
                            <Link
                              href={`/listings/${listing.id}`}
                              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                            >
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={listing.title}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  Pas d&apos;image
                                </div>
                              )}
                            </Link>

                            {/* Info */}
                            <div className="flex flex-1 flex-col justify-between overflow-hidden">
                              <Link href={`/listings/${listing.id}`} className="hover:underline">
                                <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">
                                  {listing.title}
                                </h3>
                              </Link>
                              <p className="line-clamp-1 text-xs text-gray-500">{location}</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {Math.round(listing.price)} {listing.currency === "CAD" ? "CAD" : "€"} / nuit
                              </p>
                            </div>

                            {/* Bouton supprimer */}
                            <button
                              onClick={() => handleRemoveFavorite(listing.id, wishlist.name)}
                              className="shrink-0 self-start rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                              title="Retirer des favoris"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
