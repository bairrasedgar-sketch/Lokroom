"use client";

type SearchGuestsProps = {
  adults: number;
  children: number;
  pets: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onPetsChange: (value: number) => void;
};

export function SearchGuests({
  adults,
  children,
  pets,
  onAdultsChange,
  onChildrenChange,
  onPetsChange,
}: SearchGuestsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Qui voyage ?
        </h3>

        {/* Adultes */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Adultes</p>
            <p className="text-sm text-gray-500">13 ans et plus</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onAdultsChange(Math.max(1, adults - 1))}
              disabled={adults <= 1}
              aria-label="Diminuer le nombre d'adultes"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center text-lg font-semibold text-gray-900">
              {adults}
            </span>
            <button
              onClick={() => onAdultsChange(Math.min(16, adults + 1))}
              disabled={adults >= 16}
              aria-label="Augmenter le nombre d'adultes"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Enfants */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Enfants</p>
            <p className="text-sm text-gray-500">Jusqu'à 12 ans</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onChildrenChange(Math.max(0, children - 1))}
              disabled={children <= 0}
              aria-label="Diminuer le nombre d'enfants"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center text-lg font-semibold text-gray-900">
              {children}
            </span>
            <button
              onClick={() => onChildrenChange(Math.min(10, children + 1))}
              disabled={children >= 10}
              aria-label="Augmenter le nombre d'enfants"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animaux de compagnie */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-gray-900">Animaux de compagnie</p>
            <p className="text-sm text-gray-500">Chiens, chats...</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onPetsChange(Math.max(0, pets - 1))}
              disabled={pets <= 0}
              aria-label="Diminuer le nombre d'animaux"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-8 text-center text-lg font-semibold text-gray-900">
              {pets}
            </span>
            <button
              onClick={() => onPetsChange(Math.min(5, pets + 1))}
              disabled={pets >= 5}
              aria-label="Augmenter le nombre d'animaux"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
