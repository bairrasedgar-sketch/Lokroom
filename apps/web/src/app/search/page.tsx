"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { AdvancedFilters, type FilterValues } from "@/components/search/AdvancedFilters";
import { ListingCard } from "@/components/home/ListingCard";
import { Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import type { Currency } from "@/lib/currency";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  hourlyPrice: number | null;
  currency: string;
  country: string;
  city: string | null;
  type: string;
  pricingMode: string;
  maxGuests: number | null;
  bedrooms: number | null;
  bathroomsFull: number | null;
  rating: number;
  isInstantBook: boolean;
  images: { id: string; url: string; isCover: boolean }[];
  owner: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    isSuperhost: boolean;
  };
  amenities: Array<{
    id: string;
    slug: string;
    label: string;
    category: string;
  }>;
  highlights: string[];
}

interface SearchResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: Record<string, any>;
  sortBy: string;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "rating", label: "Mieux notés" },
  { value: "newest", label: "Plus récents" },
  { value: "popular", label: "Populaires" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    limit: 20,
  });
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [userCurrency, setUserCurrency] = useState<Currency>("EUR");

  useEffect(() => {
    // Get user's currency preference from cookie
    const match = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const currency = (match?.[1] as Currency | undefined) || "EUR";
    setUserCurrency(currency);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) throw new Error("Erreur de recherche");

      const data: SearchResponse = await response.json();
      setListings(data.listings);
      setPagination(data.pagination);
      setSortBy(data.sortBy);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = (filters: FilterValues) => {
    const params = new URLSearchParams(searchParams.toString());

    // Appliquer les filtres
    if (filters.minPrice > 0) params.set("minPrice", filters.minPrice.toString());
    else params.delete("minPrice");

    if (filters.maxPrice < 500) params.set("maxPrice", filters.maxPrice.toString());
    else params.delete("maxPrice");

    if (filters.category) params.set("category", filters.category);
    else params.delete("category");

    if (filters.pricingMode) params.set("pricingMode", filters.pricingMode);
    else params.delete("pricingMode");

    if (filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","));
    else params.delete("amenities");

    if (filters.instantBook) params.set("instantBook", "true");
    else params.delete("instantBook");

    if (filters.superhost) params.set("superhost", "true");
    else params.delete("superhost");

    if (filters.minRating > 0) params.set("minRating", filters.minRating.toString());
    else params.delete("minRating");

    if (filters.bedrooms > 0) params.set("bedrooms", filters.bedrooms.toString());
    else params.delete("bedrooms");

    if (filters.bathrooms > 0) params.set("bathrooms", filters.bathrooms.toString());
    else params.delete("bathrooms");

    // Réinitialiser la page
    params.set("page", "1");

    router.push(`/search?${params.toString()}`);
    setShowFilters(false);
  };

  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", newSortBy);
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatListingCard = (listing: Listing) => {
    // Format price with currency symbol
    const currencySymbols: Record<Currency, string> = {
      EUR: "€",
      USD: "$",
      CAD: "CAD$",
      GBP: "£",
      CNY: "¥",
    };

    const symbol = currencySymbols[userCurrency] || "€";
    const priceFormatted = `${listing.price}${symbol}`;

    return {
      id: listing.id,
      title: listing.title,
      city: listing.city,
      country: listing.country,
      type: listing.type,
      createdAt: new Date(),
      images: listing.images,
      priceFormatted,
      ownerName: listing.owner.name,
      maxGuests: listing.maxGuests,
      beds: listing.bedrooms,
      isInstantBook: listing.isInstantBook,
      hourlyPrice: listing.hourlyPrice,
    };
  };

  const query = searchParams.get("q");
  const city = searchParams.get("city");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec barre de recherche */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filtres - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <AdvancedFilters
              onApply={handleFilterApply}
              initialFilters={{
                minPrice: searchParams.get("minPrice")
                  ? parseFloat(searchParams.get("minPrice")!)
                  : 0,
                maxPrice: searchParams.get("maxPrice")
                  ? parseFloat(searchParams.get("maxPrice")!)
                  : 500,
                category: searchParams.get("category") || "",
                pricingMode: searchParams.get("pricingMode") || "",
                amenities: searchParams.get("amenities")?.split(",").filter(Boolean) || [],
                instantBook: searchParams.get("instantBook") === "true",
                superhost: searchParams.get("superhost") === "true",
                minRating: searchParams.get("minRating")
                  ? parseFloat(searchParams.get("minRating")!)
                  : 0,
                bedrooms: searchParams.get("bedrooms")
                  ? parseInt(searchParams.get("bedrooms")!)
                  : 0,
                bathrooms: searchParams.get("bathrooms")
                  ? parseInt(searchParams.get("bathrooms")!)
                  : 0,
              }}
            />
          </aside>

          {/* Résultats */}
          <main className="lg:col-span-3">
            {/* Header des résultats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    "Recherche en cours..."
                  ) : (
                    <>
                      {pagination.total} {pagination.total > 1 ? "espaces" : "espace"}
                      {query && ` pour "${query}"`}
                      {city && ` à ${city}`}
                    </>
                  )}
                </h1>
                {!loading && pagination.total > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Bouton filtres mobile */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-medium">Filtres</span>
                </button>

                {/* Tri */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtres mobile (modal) */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 bg-black/50 z-50 overflow-y-auto">
                <div className="min-h-screen p-4">
                  <div className="bg-white rounded-xl max-w-lg mx-auto">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Filtres</h2>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <span className="sr-only">Fermer</span>
                        ✕
                      </button>
                    </div>
                    <div className="p-4">
                      <AdvancedFilters
                        onApply={handleFilterApply}
                        initialFilters={{
                          minPrice: searchParams.get("minPrice")
                            ? parseFloat(searchParams.get("minPrice")!)
                            : 0,
                          maxPrice: searchParams.get("maxPrice")
                            ? parseFloat(searchParams.get("maxPrice")!)
                            : 500,
                          category: searchParams.get("category") || "",
                          pricingMode: searchParams.get("pricingMode") || "",
                          amenities:
                            searchParams.get("amenities")?.split(",").filter(Boolean) || [],
                          instantBook: searchParams.get("instantBook") === "true",
                          superhost: searchParams.get("superhost") === "true",
                          minRating: searchParams.get("minRating")
                            ? parseFloat(searchParams.get("minRating")!)
                            : 0,
                          bedrooms: searchParams.get("bedrooms")
                            ? parseInt(searchParams.get("bedrooms")!)
                            : 0,
                          bathrooms: searchParams.get("bathrooms")
                            ? parseInt(searchParams.get("bathrooms")!)
                            : 0,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* Aucun résultat */}
            {!loading && listings.length === 0 && (
              <div className="text-center py-20">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun résultat trouvé
                </h2>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={() => router.push("/search")}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            )}

            {/* Grille de résultats */}
            {!loading && listings.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listings.map((listing, index) => (
                    <ListingCard
                      key={listing.id}
                      card={formatListingCard(listing)}
                      index={index}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Précédent
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              pageNum === pagination.page
                                ? "bg-black text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
