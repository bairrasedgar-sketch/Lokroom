// apps/web/src/app/listings/FiltersBar.tsx
"use client";

import { useRef, useState } from "react";

type FiltersBarProps = {
  qInitial: string;
  countryInitial: string;
  cityInitial: string;
  minPriceInitial: string;
  maxPriceInitial: string;
  minRatingInitial: string;
  sortInitial: string;
  hasPhotoInitial: boolean;
};

type PanelKey = "filters" | "price" | "sort" | null;

const sortOptions = [
  { value: "newest", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "rating_desc", label: "Meilleures notes" },
];

export default function FiltersBar({
  qInitial,
  countryInitial,
  cityInitial,
  minPriceInitial,
  maxPriceInitial,
  minRatingInitial,
  sortInitial,
  hasPhotoInitial,
}: FiltersBarProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);

  const [minRating, setMinRating] = useState<string>(minRatingInitial || "");
  const [hasPhoto, setHasPhoto] = useState<boolean>(hasPhotoInitial);
  const [minPrice, setMinPrice] = useState<string>(minPriceInitial || "");
  const [maxPrice, setMaxPrice] = useState<string>(maxPriceInitial || "");
  const [sort, setSort] = useState<string>(sortInitial || "newest");

  const togglePanel = (key: PanelKey) => {
    setOpenPanel((prev) => (prev === key ? null : key));
  };

  const closePanels = () => setOpenPanel(null);

  const submitForm = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const applyAndClose = () => {
    closePanels();
    submitForm();
  };

  return (
    <section className="space-y-3">
      <form ref={formRef} method="GET" className="space-y-3">
        {/* Barre principale (destination / dates / voyageurs) */}
        <div className="rounded-3xl border border-gray-200 bg-white px-3 py-3 shadow-sm lg:px-5 lg:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Destination */}
            <div className="flex flex-1 flex-col gap-1 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Destination
              </p>
              <input
                type="text"
                name="q"
                defaultValue={qInitial}
                placeholder="Ville, région, pays…"
                className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
            </div>

            {/* Dates & horaires – pour l'instant seulement visuel, filtrage à venir */}
            <div className="flex flex-1 flex-col gap-1 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:px-4 lg:pb-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Dates & horaires
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  placeholder="Dates (à venir)"
                  className="w-full cursor-not-allowed rounded-full border border-dashed border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 focus:outline-none"
                />
                <input
                  type="text"
                  readOnly
                  placeholder="À l&apos;heure / à la minute (à venir)"
                  className="w-full cursor-not-allowed rounded-full border border-dashed border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Voyageurs + bouton rechercher */}
            <div className="flex flex-[0.9] items-end gap-3 lg:px-4">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Voyageurs
                </p>
                <input
                  type="text"
                  readOnly
                  placeholder="2 personnes (bientôt réglable)"
                  className="w-full cursor-not-allowed border-none bg-transparent text-sm text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-xs font-medium text-white shadow-sm hover:bg-gray-900"
              >
                Rechercher
              </button>
            </div>

            {/* City / country conservés si présents dans l'URL */}
            {countryInitial && (
              <input type="hidden" name="country" value={countryInitial} />
            )}
            {cityInitial && (
              <input type="hidden" name="city" value={cityInitial} />
            )}

            {/* Champs cachés pilotés par React pour les vrais filtres */}
            <input type="hidden" name="minRating" value={minRating} />
            <input
              type="hidden"
              name="hasPhoto"
              value={hasPhoto ? "1" : ""}
            />
            <input type="hidden" name="minPrice" value={minPrice} />
            <input type="hidden" name="maxPrice" value={maxPrice} />
            <input type="hidden" name="sort" value={sort} />
          </div>
        </div>

        {/* Rangée de pilules / boutons de filtres */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Filtres généraux */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel("filters")}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition ${
                openPanel === "filters"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:border-black"
              }`}
            >
              <span className="text-[13px]">Filtres</span>
              {minRating || hasPhoto ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                  actifs
                </span>
              ) : null}
            </button>

            {openPanel === "filters" && (
              <>
                {/* backdrop click-outside */}
                <button
                  type="button"
                  className="fixed inset-0 z-20 bg-black/5"
                  onClick={closePanels}
                />
                <div className="absolute left-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 text-[12px] shadow-xl">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Affiner les résultats
                  </h3>

                  {/* Note minimale */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-gray-700">
                      Note minimale
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { value: "", label: "Toutes" },
                        { value: "3", label: "3+ / 5" },
                        { value: "4", label: "4+ / 5" },
                        { value: "5", label: "5 / 5" },
                      ].map((opt) => (
                        <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => setMinRating(opt.value)}
                          className={`rounded-full px-3 py-1 text-[11px] ${
                            minRating === opt.value
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photos uniquement */}
                  <div className="mt-3">
                    <label className="flex items-center gap-2 text-[11px] text-gray-700">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                        checked={hasPhoto}
                        onChange={(e) => setHasPhoto(e.target.checked)}
                      />
                      <span>Afficher uniquement les annonces avec photos</span>
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMinRating("");
                        setHasPhoto(false);
                      }}
                      className="rounded-full border border-gray-300 px-3 py-1 text-[11px] text-gray-700 hover:border-gray-400"
                    >
                      Réinitialiser
                    </button>
                    <button
                      type="button"
                      onClick={applyAndClose}
                      className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white hover:bg-gray-900"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tarifs */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel("price")}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition ${
                openPanel === "price"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:border-black"
              }`}
            >
              <span className="text-[13px]">Tarifs</span>
              {(minPrice || maxPrice) && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                  {minPrice && maxPrice
                    ? `${minPrice} – ${maxPrice}`
                    : minPrice
                    ? `min ${minPrice}`
                    : `max ${maxPrice}`}
                </span>
              )}
            </button>

            {openPanel === "price" && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 bg-black/5"
                  onClick={closePanels}
                />
                <div className="absolute left-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 text-[12px] shadow-xl">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Filtrer par prix
                  </h3>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-600">Min</span>
                      <input
                        type="number"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className="h-8 rounded-full border border-gray-200 bg-gray-50 px-3 text-[11px] focus:border-black focus:outline-none"
                      />
                    </div>
                    <span className="mt-5 text-gray-400">–</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-600">Max</span>
                      <input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Illimité"
                        className="h-8 rounded-full border border-gray-200 bg-gray-50 px-3 text-[11px] focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="rounded-full border border-gray-300 px-3 py-1 text-[11px] text-gray-700 hover:border-gray-400"
                    >
                      Réinitialiser
                    </button>
                    <button
                      type="button"
                      onClick={applyAndClose}
                      className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white hover:bg-gray-900"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Trier par */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePanel("sort")}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition ${
                openPanel === "sort"
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-800 hover:border-black"
              }`}
            >
              <span className="hidden text-[13px] text-gray-700 sm:inline">
                Trier par
              </span>
              <span className="text-[13px] font-medium">
                {
                  sortOptions.find((opt) => opt.value === sort)?.label ??
                  "Plus récents"
                }
              </span>
            </button>

            {openPanel === "sort" && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 bg-black/5"
                  onClick={closePanels}
                />
                <div className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 text-[12px] shadow-xl">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Trier les résultats
                  </h3>

                  <div className="space-y-1.5">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSort(opt.value)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] ${
                          sort === opt.value
                            ? "bg-black text-white"
                            : "bg-gray-50 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span
                          className={`h-3 w-3 rounded-full border ${
                            sort === opt.value
                              ? "border-white bg-white"
                              : "border-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={applyAndClose}
                      className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white hover:bg-gray-900"
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
