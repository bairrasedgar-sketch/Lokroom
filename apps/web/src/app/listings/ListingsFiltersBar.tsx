// apps/web/src/app/listings/ListingsFiltersBar.tsx
"use client";

import { useState } from "react";

type ListingsFiltersBarProps = {
  initialQ: string;
  initialCountry: string;
  initialCity: string;
  initialMinPrice: string;
  initialMaxPrice: string;
  initialMinRating: string;
  initialHasPhoto: boolean;
  initialSort: string;
};

type OpenPanel = "filters" | "price" | "sort" | null;

export default function ListingsFiltersBar({
  initialQ,
  initialCountry,
  initialCity,
  initialMinPrice,
  initialMaxPrice,
  initialMinRating,
  initialHasPhoto,
  initialSort,
}: ListingsFiltersBarProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  // On garde des valeurs contrôlées pour que la modale soit agréable à utiliser
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [hasPhoto, setHasPhoto] = useState(initialHasPhoto);
  const [sort, setSort] = useState(initialSort || "newest");

  const closePanel = () => setOpenPanel(null);

  return (
    <form method="GET" action="/listings" className="space-y-3 relative">
      {/* ----- BARRE PRINCIPALE ----- */}
      <div className="rounded-3xl border border-gray-200 bg-white px-3 py-3 shadow-sm lg:px-5 lg:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Destination */}
          <div className="flex flex-1 items-center gap-3 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm">
              {/* petit point de repère propre, pas emoji flashy */}
              <span className="inline-block h-2 w-2 rounded-full bg-black" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Où allez-vous ?
              </p>
              <input
                type="text"
                name="q"
                defaultValue={initialQ}
                placeholder="Ville, région, pays…"
                className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Dates (placeholder pour l’instant) */}
          <div className="flex flex-1 items-center gap-3 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:px-4">
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Dates
              </p>
              <input
                type="text"
                readOnly
                placeholder="Ajoute tes dates (à venir)"
                className="w-full cursor-not-allowed border-none bg-transparent text-sm text-gray-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Voyageurs (placeholder) */}
          <div className="flex flex-[0.9] items-center gap-3 pb-3 lg:border-b-0 lg:px-4 lg:pb-0">
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Voyageurs
              </p>
              <input
                type="text"
                readOnly
                placeholder="2 voyageurs (bientôt réglable)"
                className="w-full cursor-not-allowed border-none bg-transparent text-sm text-gray-400 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Bouton Rechercher */}
            <button
              type="submit"
              className="ml-3 inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-xs font-medium text-white shadow-sm hover:bg-gray-900"
            >
              Rechercher
            </button>
          </div>

          {/* On garde les city / country dans l’URL */}
          {initialCountry && (
            <input
              type="hidden"
              name="country"
              defaultValue={initialCountry}
            />
          )}
          {initialCity && (
            <input type="hidden" name="city" defaultValue={initialCity} />
          )}
        </div>
      </div>

      {/* ----- RANGÉE DE PILLS ----- */}
      <div className="flex flex-wrap gap-2 text-xs">
        {/* Filtres généraux → ouvre une bulle */}
        <button
          type="button"
          onClick={() => setOpenPanel("filters")}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] shadow-sm hover:border-black"
        >
          <span className="h-4 w-4 rounded-full border border-gray-300" />
          <span>Filtres</span>
        </button>

        {/* Populaires → raccourci pour trier par meilleures notes */}
        <button
          type="submit"
          name="sort"
          value="rating_desc"
          className={`rounded-full border px-3 py-1.5 shadow-sm transition ${
            sort === "rating_desc"
              ? "border-black bg-black text-white"
              : "border-gray-300 bg-white text-gray-800 hover:border-black"
          }`}
        >
          Populaires
        </button>

        {/* Tarifs → ouvre la bulle prix */}
        <button
          type="button"
          onClick={() => setOpenPanel("price")}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] shadow-sm hover:border-black"
        >
          <span className="h-3 w-3 rounded-full border border-gray-400" />
          <span>Tarifs</span>
          {(minPrice || maxPrice) && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
              {minPrice || "0"} – {maxPrice || "∞"}
            </span>
          )}
        </button>

        {/* Pièces et espaces → placeholder pour plus tard */}
        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-400 shadow-sm"
        >
          Pièces et espaces (bientôt)
        </button>

        {/* Trier par → ouvre la bulle de tri */}
        <button
          type="button"
          onClick={() => setOpenPanel("sort")}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] shadow-sm hover:border-black"
        >
          <span className="h-3 w-3 rounded-full border border-gray-400" />
          <span>Trier par</span>
        </button>
      </div>

      {/* ----- OVERLAY / MODALES ----- */}
      {openPanel !== null && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-2 pt-24 sm:px-0"
          onClick={closePanel}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER MODALE */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {openPanel === "filters"
                  ? "Filtres"
                  : openPanel === "price"
                  ? "Tarifs"
                  : "Trier les résultats"}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* CONTENU FILTRES */}
            {openPanel === "filters" && (
              <div className="space-y-4 px-4 py-4 text-xs text-gray-700">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Note minimale
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Toutes les notes", value: "" },
                      { label: "3★ et plus", value: "3" },
                      { label: "4★ et plus", value: "4" },
                      { label: "5★ uniquement", value: "5" },
                    ].map((opt) => (
                      <button
                        key={opt.value || "all"}
                        type="button"
                        onClick={() => setMinRating(opt.value)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] ${
                          minRating === opt.value
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-800 hover:border-black"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-[11px] text-gray-700">
                    Uniquement les annonces avec photos
                  </span>
                  <input
                    type="checkbox"
                    checked={hasPhoto}
                    onChange={(e) => setHasPhoto(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                </label>
              </div>
            )}

            {/* CONTENU PRIX */}
            {openPanel === "price" && (
              <div className="space-y-4 px-4 py-4 text-xs text-gray-700">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Échelle de prix
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Pour l&apos;instant, les prix sont affichés{" "}
                    <span className="font-medium">par nuit</span>. Plus tard on
                    pourra proposer <span className="font-medium">par heure</span> ou{" "}
                    <span className="font-medium">à la minute</span>.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] text-gray-600">Min</label>
                    <input
                      type="number"
                      name="minPrice"
                      min={0}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-2 text-[11px] focus:border-black focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] text-gray-600">Max</label>
                    <input
                      type="number"
                      name="maxPrice"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-2 text-[11px] focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CONTENU TRI */}
            {openPanel === "sort" && (
              <div className="space-y-2 px-4 py-4 text-xs text-gray-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Trier par
                </p>
                <div className="space-y-1">
                  {[
                    { label: "Plus récents", value: "newest" },
                    { label: "Prix croissant", value: "price_asc" },
                    { label: "Prix décroissant", value: "price_desc" },
                    { label: "Meilleures notes", value: "rating_desc" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="sort"
                        value={opt.value}
                        checked={sort === opt.value}
                        onChange={() => setSort(opt.value)}
                        className="h-3.5 w-3.5 border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-[12px] text-gray-800">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* FOOTER MODALE */}
            <div className="flex items-center justify-between border-t px-4 py-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setMinRating("");
                  setHasPhoto(false);
                }}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
              >
                Tout effacer
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-[11px] font-medium text-white hover:bg-gray-900"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Champs réels (liés aux states) pour que le GET fonctionne même si la modale est fermée */}
      <input type="hidden" name="minRating" value={minRating} />
      <input type="hidden" name="hasPhoto" value={hasPhoto ? "1" : ""} />
      <input type="hidden" name="sort" value={sort} />
      {/* minPrice / maxPrice sont déjà les inputs de la modale, donc pas besoin de hidden en plus */}
    </form>
  );
}
