// apps/web/src/components/recommendations/RecommendedListings.tsx
"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/home/ListingCard";
import { Sparkles, TrendingUp, Heart, MapPin, DollarSign, Star } from "lucide-react";
import { logger } from "@/lib/logger";


interface RecommendedListing {
  id: string;
  userId: string;
  listingId: string;
  score: number;
  reason: string;
  createdAt: Date;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    type: string;
    price: number;
    currency: string;
    createdAt: Date;
    images: { id: string; url: string }[];
    reviews: { rating: number }[];
    owner: { name: string | null } | null;
    maxGuests: number | null;
    beds: number | null;
    isInstantBook: boolean;
  };
}

const REASON_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  similar_to_favorites: {
    label: "Similaire à vos favoris",
    icon: <Heart className="h-4 w-4" />,
  },
  similar_to_bookings: {
    label: "Basé sur vos réservations",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  popular: {
    label: "Populaire",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  near_you: {
    label: "Près de chez vous",
    icon: <MapPin className="h-4 w-4" />,
  },
  good_value: {
    label: "Bon rapport qualité-prix",
    icon: <DollarSign className="h-4 w-4" />,
  },
  highly_rated: {
    label: "Très bien noté",
    icon: <Star className="h-4 w-4" />,
  },
  recommended_for_you: {
    label: "Recommandé pour vous",
    icon: <Sparkles className="h-4 w-4" />,
  },
};

function getReasonBadge(reason: string): { label: string; icon: React.ReactNode } {
  return REASON_LABELS[reason] || REASON_LABELS.recommended_for_you;
}

function formatPrice(price: number, currency: string): string {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(price);
}

export function RecommendedListings() {
  const [recommendations, setRecommendations] = useState<RecommendedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch recommendations");
        }
        return res.json();
      })
      .then((data) => {
        setRecommendations(data.recommendations || []);
        setLoading(false);
      })
      .catch((err) => {
        logger.error("Error fetching recommendations:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Recommandé pour vous</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-900">Recommandé pour vous</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Des espaces sélectionnés selon vos préférences et votre historique
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((rec, index) => {
            const badge = getReasonBadge(rec.reason);
            const card = {
              id: rec.listing.id,
              title: rec.listing.title,
              city: rec.listing.city,
              country: rec.listing.country,
              type: rec.listing.type,
              createdAt: rec.listing.createdAt,
              images: rec.listing.images,
              priceFormatted: formatPrice(rec.listing.price, rec.listing.currency),
              ownerName: rec.listing.owner?.name || null,
              maxGuests: rec.listing.maxGuests,
              beds: rec.listing.beds,
              isInstantBook: rec.listing.isInstantBook,
            };

            return (
              <div key={rec.id} className="relative">
                {/* Badge de raison */}
                <div className="absolute -top-2 left-2 z-10 flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
                <ListingCard card={card} index={index} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
