// apps/web/src/components/listings/FiltersBar.tsx
"use client";

import { useState } from "react";

type FiltersBarProps = {
  q: string;
  country: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sort: string;
  hasPhoto: boolean;
};

export default function FiltersBar(props: FiltersBarProps) {
  const {
    q,
    country,
    city,
    minPrice,
    maxPrice,
    minRating,
    sort,
    hasPhoto,
  } = props;

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <section className="space-y-3">
      {/* ⚠️ Un seul form GET pour tout (barre + gros pop-up filtres) */}
      <form method="GET" className="space-y-3">
        {/* ====== BARRE PRINCIPALE (destination / dates / heures / voyageurs) ====== */}
        <div className="rounded-3xl border border-gray-200 bg-white px-3 py-3 shadow-sm lg:px-5 lg:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Destination */}
            <div className="flex flex-1 items-center gap-3 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-black" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Où allez-vous ?
                </p>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Ville, région, pays…"
                  className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Dates + Heures */}
            <div className="flex flex-1 items-stretch gap-3 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:px-4">
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Dates &amp; heures
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-gray-400">
                      Arrivée
                    </span>
                    <input
                      type="date"
                      name="startDate"
                      className="h-7 rounded-full border border-gray-200 bg-gray-50 px-2 text-[11px] text-gray-800 focus:border-black focus:outline-none"
                    />
                    <input
                      type="time"
                      name="startTime"
                      className="h-7 rounded-full border border-gray-200 bg-gray-50 px-2 text-[11px] text-gray-800 focus:border-black focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-gray-400">
                      Départ
                    </span>
                    <input
                      type="date"
                      name="endDate"
                      className="h-7 rounded-full border border-gray-200 bg-gray-50 px-2 text-[11px] text-gray-800 focus:border-black focus:outline-none"
                    />
                    <input
                      type="time"
                      name="endTime"
                      className="h-7 rounded-full border border-gray-200 bg-gray-50 px-2 text-[11px] text-gray-800 focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Voyageurs */}
            <div className="flex flex-[0.9] items-center gap-3 lg:px-4">
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm sm:flex">
                <span className="h-4 w-4 rounded-full border border-gray-400" />
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

            {/* On garde country / city si déjà dans l’URL */}
            {country && (
              <input type="hidden" name="country" defaultValue={country} />
            )}
            {city && <input type="hidden" name="city" defaultValue={city} />}
          </div>
        </div>

        {/* ====== RANGÉE DE PILULES (Filtres, Populaires, Tarifs, Trier) ====== */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Bouton qui ouvre le GRAND panneau de filtres façon Airbnb */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] text-gray-800 shadow-sm transition hover:border-black hover:bg-gray-50"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px]">
              ●
            </span>
            Filtres
          </button>

          {/* Populaires → tri par meilleure note */}
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

          {/* Tarifs : résumé (édition dans le panneau de filtres) */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] text-gray-800 shadow-sm transition hover:border-black hover:bg-gray-50"
          >
            Tarifs
            {minPrice || maxPrice ? (
              <span className="ml-1 text-[11px] text-gray-500">
                {minPrice || "0"} – {maxPrice || "Max"}
              </span>
            ) : (
              <span className="ml-1 text-[11px] text-gray-400">
                (échelle de prix)
              </span>
            )}
          </button>

          {/* Pièces & espaces (placeholder) */}
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-400 shadow-sm"
          >
            Pièces et espaces (bientôt)
          </button>

          {/* Trier par : capsule avec select customisé */}
          <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 shadow-sm">
            <span className="hidden text-[13px] text-gray-600 sm:inline">
              Trier par
            </span>
            <div className="relative">
              <select
                name="sort"
                defaultValue={sort}
                className="h-7 appearance-none rounded-full border border-gray-200 bg-gray-50 pl-3 pr-6 text-[11px] font-medium text-gray-800 focus:border-black focus:outline-none"
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating_desc">Meilleures notes</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-gray-400">
                ▾
              </span>
            </div>
          </div>
        </div>

        {/* ====== POP-UP DE FILTRES (GRAND MODAL TYPE AIRBNB) ====== */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-100"
                >
                  ✕
                </button>
                <h2 className="text-sm font-semibold">Filtres</h2>
                <div className="w-8" />
              </div>

              {/* Contenu scrollable */}
              <div className="max-h-[70vh] space-y-8 overflow-y-auto px-6 py-5 text-sm text-gray-800">
                {/* Échelle de prix */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Échelle de prix</h3>
                  <p className="text-xs text-gray-500">
                    Prix du séjour, tous frais compris (placeholder pour un
                    futur graphique).
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-500">
                        Minimum
                      </span>
                      <input
                        type="number"
                        name="minPrice"
                        min={0}
                        defaultValue={minPrice}
                        placeholder="Min"
                        className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-500">
                        Maximum
                      </span>
                      <input
                        type="number"
                        name="maxPrice"
                        min={0}
                        defaultValue={maxPrice}
                        placeholder="Max"
                        className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Note minimale */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Note minimale</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "", label: "Toutes les notes" },
                      { value: "3", label: "3★ et plus" },
                      { value: "4", label: "4★ et plus" },
                      { value: "5", label: "5★ uniquement" },
                    ].map((opt) => (
                      <label
                        key={opt.value || "all"}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${
                          (minRating || "") === opt.value
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="minRating"
                          value={opt.value}
                          defaultChecked={(minRating || "") === opt.value}
                          className="hidden"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      name="hasPhoto"
                      value="1"
                      defaultChecked={hasPhoto}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span>Uniquement les annonces avec photos</span>
                  </label>
                </section>

                {/* Chambres et lits (placeholder, côté UX) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Chambres et lits</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {["chambres", "lits", "sallesDeBain"].map((key) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">
                          {key === "chambres"
                            ? "Chambres"
                            : key === "lits"
                            ? "Lits"
                            : "Salles de bain"}
                        </span>
                        <input
                          type="number"
                          min={0}
                          name={key}
                          className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                          placeholder="Tout"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Commodités (checkbox "chips" – backend pourra les gérer plus tard) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Commodités</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Wifi",
                      "Stationnement gratuit",
                      "Arrivée autonome",
                      "Climatisation",
                      "Chauffage",
                      "Télévision",
                    ].map((label) => {
                      const value = label.toLowerCase().replace(/\s+/g, "_");
                      return (
                        <label
                          key={value}
                          className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:border-black"
                        >
                          <input
                            type="checkbox"
                            name="amenities"
                            value={value}
                            className="hidden"
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </section>

                {/* Options de réservation (placeholder) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">
                    Options de réservation
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["Réservation instantanée", "Arrivée autonome"].map(
                      (label) => {
                        const value = label.toLowerCase().replace(/\s+/g, "_");
                        return (
                          <label
                            key={value}
                            className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:border-black"
                          >
                            <input
                              type="checkbox"
                              name="bookingOptions"
                              value={value}
                              className="hidden"
                            />
                            {label}
                          </label>
                        );
                      },
                    )}
                  </div>
                </section>

                {/* Type de logement (chips) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">Type de logement</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Maison", "Appartement", "Bureau", "Parking"].map(
                      (label) => {
                        const value = label.toLowerCase();
                        return (
                          <label
                            key={value}
                            className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:border-black"
                          >
                            <input
                              type="checkbox"
                              name="spaceType"
                              value={value}
                              className="hidden"
                            />
                            {label}
                          </label>
                        );
                      },
                    )}
                  </div>
                </section>
              </div>

              {/* Footer du modal */}
              <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
                <button
                  type="reset"
                  className="text-xs font-medium text-gray-600 hover:underline"
                  onClick={() => {
                    // On laisse le reset du form faire son job, on ferme juste le panneau
                    setIsFilterOpen(false);
                  }}
                >
                  Tout effacer
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-gray-900"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Afficher les résultats
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
