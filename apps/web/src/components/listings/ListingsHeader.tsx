import Link from "next/link";
import CurrencyNotice from "../CurrencyNotice";

type SortOption = "recent" | "price_asc" | "price_desc";

type ListingsHeaderProps = {
  total: number;
  sortParam: SortOption;
  onSortChange: (value: SortOption) => void;
  showMobileMapButton?: boolean;
  onShowMobileMap?: () => void;
};

export function ListingsHeader({
  total,
  sortParam,
  onSortChange,
  showMobileMapButton = false,
  onShowMobileMap,
}: ListingsHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Annonces</h1>
          <p className="text-xs text-gray-500">
            {total === 0
              ? "Aucune annonce pour ces filtres."
              : `${total} annonce${total > 1 ? "s" : ""} trouvée${
                  total > 1 ? "s" : ""
                }`}
          </p>
        </div>

        <Link
          href="/listings/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {/* Barre tri + filtres + bouton carte mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CurrencyNotice />

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {showMobileMapButton && onShowMobileMap && (
            <button
              type="button"
              onClick={onShowMobileMap}
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/60 sm:hidden"
            >
              <span>Voir la carte</span>
            </button>
          )}

          <span className="hidden text-xs text-gray-500 sm:inline">
            Trier par
          </span>
          <select
            value={sortParam}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/60"
          >
            <option value="recent">Plus récentes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>
    </>
  );
}
