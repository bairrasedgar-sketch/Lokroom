// apps/web/src/components/ListingFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ListingFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [country, setCountry] = useState(sp.get("country") || "");
  const [city, setCity] = useState(sp.get("city") || "");
  const [min, setMin] = useState(sp.get("min") || "");
  const [max, setMax] = useState(sp.get("max") || "");

  useEffect(() => {
    // garde les inputs en phase si on navigue avec le navigateur
    setCountry(sp.get("country") || "");
    setCity(sp.get("city") || "");
    setMin(sp.get("min") || "");
    setMax(sp.get("max") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (country.trim()) params.set("country", country.trim());
    if (city.trim()) params.set("city", city.trim());
    if (min.trim()) params.set("min", min.trim());
    if (max.trim()) params.set("max", max.trim());
    const qs = params.toString();
    router.replace(`/listings${qs ? `?${qs}` : ""}`);
    // Laisse la page serveur filtrer
  }

  function reset() {
    setCountry("");
    setCity("");
    setMin("");
    setMax("");
    router.replace(`/listings`);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded border bg-white p-3">
      <div>
        <label className="block text-xs mb-1">Pays</label>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
          placeholder="ex: France / Canada"
        />
      </div>
      <div>
        <label className="block text-xs mb-1">Ville</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
          placeholder="ex: Paris / Montréal"
        />
      </div>
      <div>
        <label className="block text-xs mb-1">Prix min</label>
        <input
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
          placeholder="ex: 50"
          type="number"
          step="0.01"
          min="0"
        />
      </div>
      <div>
        <label className="block text-xs mb-1">Prix max</label>
        <input
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
          placeholder="ex: 300"
          type="number"
          step="0.01"
          min="0"
        />
      </div>

      <div className="flex gap-2 ml-auto">
        <button type="submit" className="rounded bg-black text-white px-3 py-1.5 text-sm">
          Filtrer
        </button>
        <button type="button" onClick={reset} className="rounded border px-3 py-1.5 text-sm">
          Réinitialiser
        </button>
      </div>

      <p className="w-full text-xs text-gray-500 mt-1">
        Le filtre prix s’applique à la devise **d’origine** des annonces (pas la devise d’affichage).
      </p>
    </form>
  );
}
