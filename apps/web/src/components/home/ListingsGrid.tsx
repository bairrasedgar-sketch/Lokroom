"use client";

import Link from "next/link";
import { ListingCard } from "./ListingCard";

type ListingCardType = {
  id: string;
  title: string;
  city: string | null;
  country: string;
  type: string;
  createdAt: Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  ownerName: string | null;
  maxGuests: number | null;
  beds: number | null;
  isInstantBook: boolean;
};

type Category = {
  key: string;
  label: string;
  icon: string;
  count: number;
};

type ListingsGridProps = {
  cards: ListingCardType[];
  categories: Category[];
  activeCategory: string | null;
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studios",
  OTHER: "Autre",
};

function getCategoryEmoji(key: string): string {
  const emojis: Record<string, string> = {
    APARTMENT: "🏢",
    HOUSE: "🏠",
    ROOM: "🛏️",
    STUDIO: "🎨",
    OFFICE: "💼",
    COWORKING: "👥",
    MEETING_ROOM: "📊",
    PARKING: "🚗",
    GARAGE: "🚙",
    STORAGE: "📦",
    EVENT_SPACE: "🎉",
    RECORDING_STUDIO: "🎤",
    OTHER: "✨",
  };
  return emojis[key] || "🏠";
}

export function ListingsGrid({ cards, categories, activeCategory }: ListingsGridProps) {
  const filteredCards = activeCategory
    ? cards.filter((card) => card.type === activeCategory)
    : cards;

  return (
    <section className="mx-auto max-w-[1800px] 3xl:max-w-[2200px] 4xl:max-w-[2800px] px-4 py-6 sm:py-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
      {/* Desktop: Titre + Grille classique */}
      <div className="hidden sm:block">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 line-clamp-1">
              {activeCategory ? categories.find(c => c.key === activeCategory)?.label : "Découvrez nos espaces"}
            </h2>
          </div>
          <Link
            href="/listings"
            className="group flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 flex-shrink-0"
          >
            Voir tout
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {filteredCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900">Aucun espace dans cette catégorie</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez une autre catégorie ou explorez tous nos espaces</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {filteredCards.map((card, i) => (
              <ListingCard key={card.id} card={card} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Sections par catégorie avec scroll horizontal */}
      <div className="sm:hidden space-y-8">
        {(() => {
          // Grouper les annonces par catégorie
          const cardsByCategory: Record<string, typeof cards> = {};
          cards.forEach(card => {
            if (!cardsByCategory[card.type]) {
              cardsByCategory[card.type] = [];
            }
            cardsByCategory[card.type].push(card);
          });

          // Ordre des catégories à afficher
          const categoryOrder = ["HOUSE", "APARTMENT", "PARKING", "ROOM", "GARAGE", "STORAGE", "OFFICE", "MEETING_ROOM", "COWORKING", "EVENT_SPACE", "RECORDING_STUDIO", "OTHER"];

          return categoryOrder
            .filter(catKey => cardsByCategory[catKey] && cardsByCategory[catKey].length > 0)
            .map(catKey => {
              const catCards = cardsByCategory[catKey];
              const catLabel = LISTING_TYPE_LABELS[catKey] || catKey;
              const catEmoji = getCategoryEmoji(catKey);

              return (
                <div key={catKey}>
                  {/* Titre de la catégorie */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catEmoji}</span>
                      <h3 className="text-base font-semibold text-gray-900">{catLabel}s</h3>
                      <span className="text-xs text-gray-400">({catCards.length})</span>
                    </div>
                    <Link
                      href={`/listings?type=${catKey}`}
                      className="text-xs font-medium text-gray-500 hover:text-gray-900"
                    >
                      Voir tout
                    </Link>
                  </div>

                  {/* Scroll horizontal des annonces */}
                  <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3" style={{ width: 'max-content' }}>
                      {catCards.slice(0, 10).map((card, i) => (
                        <div key={card.id} className="w-[230px] flex-shrink-0">
                          <ListingCard card={card} index={i} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            });
        })()}
      </div>
    </section>
  );
}
