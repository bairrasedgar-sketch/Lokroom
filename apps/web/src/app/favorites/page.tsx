"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  PencilIcon,
  TrashIcon,
  HeartIcon,
  XMarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  MapPinIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/FavoritesContext";

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-xl bg-gray-200" />
      <div className="mt-3 h-5 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

export default function FavoritesPage() {
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
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Rafraîchir les wishlists au montage
  useEffect(() => {
    if (status === "authenticated") {
      refreshWishlists();
    }
  }, [status, refreshWishlists]);

  // Créer une nouvelle liste
  async function handleCreateList() {
    if (!newListName.trim()) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }

    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });

      if (res.ok) {
        toast.success("Liste créée");
        setCreatingList(false);
        setNewListName("");
        refreshWishlists();
      } else {
        toast.error("Impossible de créer la liste");
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  }

  // Supprimer une wishlist
  async function handleDeleteWishlist(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Supprimer la liste "${name}" ? Tous les favoris de cette liste seront supprimés.`)) return;

    const success = await deleteWishlist(id);
    if (success) {
      toast.success("Liste supprimée");
      if (selectedWishlist === id) setSelectedWishlist(null);
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
    const success = await removeFavoriteFromWishlist(listingId);
    if (success) {
      toast.success(`Retiré de "${wishlistName}"`);
    } else {
      toast.error("Impossible de retirer l'annonce");
    }
  }

  // Page non connecté
  if (status === "unauthenticated") {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100">
            <HeartSolid className="h-10 w-10 text-[#FF385C]" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Tes favoris t&apos;attendent</h1>
          <p className="mt-3 text-gray-500">
            Connecte-toi pour retrouver tes annonces préférées et créer des listes personnalisées
          </p>
          <Link
            href="/api/auth/signin"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FF385C] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#E31C5F] active:scale-[0.98]"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  // Vue détaillée d'une wishlist
  const currentWishlist = wishlists.find(w => w.id === selectedWishlist);

  if (selectedWishlist && currentWishlist) {
    return (
      <main className="mx-auto max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec retour */}
        <div className="mb-8">
          <button
            onClick={() => setSelectedWishlist(null)}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Retour aux listes
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {editingId === currentWishlist.id ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-semibold border-b-2 border-gray-900 bg-transparent focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateWishlistName(currentWishlist.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditName("");
                      }
                    }}
                  />
                  <button
                    onClick={() => handleUpdateWishlistName(currentWishlist.id)}
                    className="rounded-full bg-gray-900 p-2 text-white hover:bg-black transition"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditName("");
                    }}
                    className="rounded-full border border-gray-300 p-2 hover:bg-gray-50 transition"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <h1 className="text-2xl font-semibold text-gray-900">{currentWishlist.name}</h1>
              )}
              <p className="mt-1 text-gray-500">
                {currentWishlist._count.favorites} annonce{currentWishlist._count.favorites !== 1 ? "s" : ""} enregistrée{currentWishlist._count.favorites !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingId(currentWishlist.id);
                  setEditName(currentWishlist.name);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                title="Renommer"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handleDeleteWishlist(currentWishlist.id, currentWishlist.name, e)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                title="Supprimer la liste"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grille des annonces */}
        {currentWishlist.favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-20 text-center">
            <HeartIcon className="mb-4 h-12 w-12 text-gray-300" />
            <h2 className="text-lg font-medium text-gray-900">Cette liste est vide</h2>
            <p className="mt-2 text-sm text-gray-500">
              Ajoute des annonces à cette liste en cliquant sur le coeur
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition"
            >
              Explorer les annonces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {currentWishlist.favorites.map((fav) => {
              const listing = fav.listing;
              const imageUrl = listing.images[0]?.url;
              const location = [listing.city, listing.country].filter(Boolean).join(", ");

              return (
                <div key={fav.id} className="group relative">
                  {/* Bouton supprimer */}
                  <button
                    onClick={() => handleRemoveFavorite(listing.id, currentWishlist.name)}
                    className="absolute right-2 top-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-[#FF385C] shadow-sm backdrop-blur-sm transition hover:bg-white active:scale-95"
                    title="Retirer des favoris"
                  >
                    <HeartSolid className="h-5 w-5" />
                  </button>

                  <Link href={`/listings/${listing.id}`} className="block">
                    {/* Image carrée */}
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="50vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <HeartIcon className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {listing.title}
                      </h3>
                      {location && (
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                          {location}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-900">
                        <span className="font-semibold">{Math.round(listing.price)} {listing.currency === "CAD" ? "CAD" : "€"}</span>
                        <span className="text-gray-500 text-xs"> / nuit</span>
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // Compter le total des favoris
  const totalFavorites = wishlists.reduce((acc, w) => acc + w._count.favorites, 0);

  // Vue principale - Liste des wishlists (catégories)
  return (
    <main className="mx-auto max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Favoris</h1>
          {totalFavorites > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {totalFavorites} annonce{totalFavorites !== 1 ? "s" : ""} dans {wishlists.length} liste{wishlists.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {wishlists.length > 0 && (
          <button
            onClick={() => setCreatingList(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle liste</span>
          </button>
        )}
      </header>

      {/* Modal création de liste */}
      {creatingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Créer une nouvelle liste</h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la liste..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateList();
                if (e.key === "Escape") {
                  setCreatingList(false);
                  setNewListName("");
                }
              }}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setCreatingList(false);
                  setNewListName("");
                }}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateList}
                className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white hover:bg-black transition"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {wishlistsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : wishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100">
            <HeartSolid className="h-10 w-10 text-[#FF385C]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Crée ta première liste</h2>
          <p className="mt-2 max-w-sm text-gray-500">
            Clique sur le coeur d&apos;une annonce pour l&apos;ajouter à tes favoris et créer des listes
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FF385C] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#E31C5F] active:scale-[0.98]"
          >
            Découvrir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {wishlists.map((wishlist) => {
            const previewImages = wishlist.favorites
              .slice(0, 4)
              .map((f) => f.listing.images[0]?.url)
              .filter(Boolean);

            return (
              <div
                key={wishlist.id}
                className="group cursor-pointer"
                onClick={() => setSelectedWishlist(wishlist.id)}
              >
                {/* Image carrée avec grille */}
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                  {previewImages.length >= 4 ? (
                    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
                      {previewImages.slice(0, 4).map((url, idx) => (
                        <div key={idx} className="relative overflow-hidden">
                          <Image
                            src={url}
                            alt={`Aperçu ${idx + 1} des favoris`}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                            sizes="25vw"
                          />
                        </div>
                      ))}
                    </div>
                  ) : previewImages.length >= 1 ? (
                    <Image
                      src={previewImages[0]}
                      alt="Aperçu des favoris"
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="50vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <HeartIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}

                  {/* Overlay au hover */}
                  <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/5" />
                </div>

                {/* Infos */}
                <div className="mt-2">
                  <h2 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {wishlist.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {wishlist._count.favorites} enregistrée{wishlist._count.favorites !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
