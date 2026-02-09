"use client";

type SearchBarSectionProps = {
  isScrolled: boolean;
  onOpenModal: () => void;
};

export function SearchBarSection({ isScrolled, onOpenModal }: SearchBarSectionProps) {
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isScrolled
          ? "opacity-0 max-h-0 overflow-hidden py-0"
          : "opacity-100 max-h-40 bg-white py-6"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          {/* Barre de recherche grande - Desktop */}
          <div className="hidden sm:block w-full max-w-3xl">
            <button
              type="button"
              onClick={onOpenModal}
              className="flex items-center rounded-full border border-gray-300 bg-white shadow-lg hover:shadow-xl transition-all py-2 px-2 w-full"
            >
              {/* Section Destination */}
              <div className="flex-1 px-6 py-3 border-r border-gray-200 text-left">
                <p className="text-xs font-medium text-gray-900">Destination</p>
                <p className="text-sm text-gray-500 mt-0.5">Rechercher une destination</p>
              </div>

              {/* Section Dates */}
              <div className="flex-1 px-6 py-3 border-r border-gray-200 text-left">
                <p className="text-xs font-medium text-gray-900">Quand</p>
                <p className="text-sm text-gray-500 mt-0.5">Ajouter des dates</p>
              </div>

              {/* Section Voyageurs */}
              <div className="flex-1 px-6 py-3 text-left">
                <p className="text-xs font-medium text-gray-900">Voyageurs</p>
                <p className="text-sm text-gray-500 mt-0.5">Ajouter des voyageurs</p>
              </div>

              {/* Bouton recherche */}
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-900 hover:bg-black transition-colors flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </button>
          </div>

          {/* Barre de recherche - Mobile */}
          <div className="sm:hidden w-full">
            <button
              type="button"
              onClick={onOpenModal}
              className="flex items-center gap-3 w-full rounded-full border border-gray-300 bg-white shadow-lg hover:shadow-xl transition-all py-3 px-4"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 flex-shrink-0">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">Rechercher</p>
                <p className="text-xs text-gray-500">Destination, dates, voyageurs</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
