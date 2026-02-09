"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";

function useQueryState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function setParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return { searchParams, setParams };
}

export default function ListingFilters() {
  const { searchParams, setParams } = useQueryState();
  const { logSearch } = useAnalytics();
  const [open, setOpen] = useState(false);

  // valeurs initiales depuis l’URL
  const initial = useMemo(() => {
    const get = (k: string) => searchParams?.get(k) ?? "";
    return {
      country: get("country"),
      city: get("city"),
      min: get("min"),
      max: get("max"),
    };
  }, [searchParams]);

  const [country, setCountry] = useState(initial.country);
  const [city, setCity] = useState(initial.city);
  const [minPrice, setMinPrice] = useState(initial.min);
  const [maxPrice, setMaxPrice] = useState(initial.max);

  function resetAll() {
    setCountry("");
    setCity("");
    setMinPrice("");
    setMaxPrice("");
  }

  function applyFilters() {
    setParams({
      country: country || undefined,
      city: city || undefined,
      min: minPrice || undefined,
      max: maxPrice || undefined,
    });

    // Track search analytics
    logSearch({
      query: `${city || country || 'all'}`,
      filters: {
        location: city || country || undefined,
        priceMin: minPrice ? parseFloat(minPrice) : undefined,
        priceMax: maxPrice ? parseFloat(maxPrice) : undefined,
      },
    });

    setOpen(false);
  }

  const hasActiveFilter =
    !!initial.country || !!initial.city || !!initial.min || !!initial.max;

  return (
    <>
      {/* barre compacte au-dessus de la grille */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm">
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          {hasActiveFilter ? (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              Filtres actifs
            </span>
          ) : (
            <span className="text-gray-500">Affiner ta recherche</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-black sm:text-sm"
        >
          <span>Filtres</span>
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* MODAL ple écran */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-600 hover:text-black"
              >
                Fermer
              </button>
              <h2 className="text-sm font-medium">Filtres</h2>
              <button
                type="button"
                onClick={resetAll}
                className="text-xs font-medium text-gray-600 underline"
              >
                Tout effacer
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="space-y-6 overflow-y-auto px-4 py-4 pb-24 sm:pb-6">
              {/* Destination */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Destination</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Pays</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Canada, France…"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Ville</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Montréal, Paris…"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>
              </section>

              {/* Prix */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Tranche de prix</h3>
                <p className="text-xs text-gray-500">
                  Indique un prix minimum et maximum pour une nuit.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Min</label>
                    <div className="flex items-center rounded-xl border border-gray-300 px-3 py-2 text-sm">
                      <span className="mr-1 text-gray-400">$</span>
                      <input
                        type="number"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full border-none bg-transparent outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Max</label>
                    <div className="flex items-center rounded-xl border border-gray-300 px-3 py-2 text-sm">
                      <span className="mr-1 text-gray-400">$</span>
                      <input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full border-none bg-transparent outline-none"
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Options visuelles / déco (non encore branchées) */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Options populaires</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                    Réservation instantanée
                  </span>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                    Arrivée autonome
                  </span>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                    Annulation flexible
                  </span>
                  <span className="rounded-full border border-gray-200 px-3 py-1 text-gray-600">
                    Accepte les animaux
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  (Pour l’instant ces options sont seulement visuelles. On les
                  branchera sur la base de données plus tard.)
                </p>
              </section>
            </div>

            {/* Boutons bas de modal */}
            <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-white via-white/95 to-transparent sm:static sm:bg-none">
              <div className="flex w-full max-w-2xl justify-between gap-3 border-t px-4 py-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-black"
                >
                  Tout effacer
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white"
                >
                  Afficher les résultats
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
