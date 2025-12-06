"use client";

import Link from "next/link";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type ActiveFiltersProps = {
  q: string;
  startDate: string;
  endDate: string;
  guests: string;
  searchParams?: SearchParams;
};

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function buildUrlWithoutParam(
  searchParams: SearchParams | undefined,
  keyToRemove: string
): string {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === keyToRemove) continue;
      if (Array.isArray(v)) {
        for (const vv of v) {
          if (vv != null) params.append(k, vv);
        }
      } else if (v != null && v !== "") {
        params.set(k, v);
      }
    }
  }

  const queryString = params.toString();
  return queryString ? `/listings?${queryString}` : "/listings";
}

function buildUrlWithoutParams(
  searchParams: SearchParams | undefined,
  keysToRemove: string[]
): string {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (keysToRemove.includes(k)) continue;
      if (Array.isArray(v)) {
        for (const vv of v) {
          if (vv != null) params.append(k, vv);
        }
      } else if (v != null && v !== "") {
        params.set(k, v);
      }
    }
  }

  const queryString = params.toString();
  return queryString ? `/listings?${queryString}` : "/listings";
}

export default function ActiveFilters({
  q,
  startDate,
  endDate,
  guests,
  searchParams,
}: ActiveFiltersProps) {
  const hasFilters = q || startDate || endDate || guests;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Filtres actifs :</span>

      {/* Destination */}
      {q && (
        <Link
          href={buildUrlWithoutParam(searchParams, "q")}
          className="group flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {q}
          <svg className="h-3 w-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      )}

      {/* Dates */}
      {(startDate || endDate) && (
        <Link
          href={buildUrlWithoutParams(searchParams, ["startDate", "endDate"])}
          className="group flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {startDate && endDate ? (
            <>
              {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
            </>
          ) : startDate ? (
            <>A partir du {formatDateDisplay(startDate)}</>
          ) : (
            <>Jusqu&apos;au {formatDateDisplay(endDate)}</>
          )}
          <svg className="h-3 w-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      )}

      {/* Voyageurs */}
      {guests && (
        <Link
          href={buildUrlWithoutParam(searchParams, "guests")}
          className="group flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {guests} voyageur{parseInt(guests) > 1 ? "s" : ""}
          <svg className="h-3 w-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      )}

      {/* Effacer tous les filtres */}
      {hasFilters && (
        <Link
          href="/listings"
          className="text-xs text-gray-500 underline hover:text-gray-700"
        >
          Tout effacer
        </Link>
      )}
    </div>
  );
}
