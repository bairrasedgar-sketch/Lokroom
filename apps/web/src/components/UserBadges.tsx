"use client";

import { useEffect, useState } from "react";

type Badge = {
  id: string;
  type: string;
  earnedAt: string;
  expiresAt: string | null;
  info: {
    name: string;
    description: string;
    icon: string;
    color: string;
  };
};

type UserBadgesProps = {
  userId: string;
  showAll?: boolean;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
};

export default function UserBadges({
  userId,
  showAll = false,
  maxDisplay = 3,
  size = "md",
}: UserBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const res = await fetch(`/api/badges?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setBadges(data.badges || []);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-full bg-gray-200 ${
              size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6"
            }`}
          />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  const displayBadges = showAll || showMore ? badges : badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          className={`group relative inline-flex items-center gap-1 rounded-full font-medium transition-transform hover:scale-105 ${badge.info.color} ${sizeClasses[size]}`}
          title={badge.info.description}
        >
          <span className={iconSizes[size]}>{badge.info.icon}</span>
          <span>{badge.info.name}</span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
            <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
              <p className="font-medium">{badge.info.name}</p>
              <p className="mt-0.5 text-gray-300">{badge.info.description}</p>
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      ))}

      {!showAll && hasMore && !showMore && (
        <button
          onClick={() => setShowMore(true)}
          className={`inline-flex items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 ${sizeClasses[size]}`}
        >
          +{badges.length - maxDisplay}
        </button>
      )}
    </div>
  );
}

// Composant pour un badge individuel (style compact)
export function BadgeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const badgeInfo: Record<string, { icon: string; color: string; name: string }> = {
    IDENTITY_VERIFIED: { icon: "🛡️", color: "text-blue-600", name: "Identité vérifiée" },
    EMAIL_VERIFIED: { icon: "✉️", color: "text-green-600", name: "Email vérifié" },
    PHONE_VERIFIED: { icon: "📱", color: "text-purple-600", name: "Téléphone vérifié" },
    SUPERHOST: { icon: "🏆", color: "text-amber-600", name: "Superhost" },
    EXPERIENCED_HOST: { icon: "⭐", color: "text-yellow-600", name: "Hôte expérimenté" },
    QUICK_RESPONDER: { icon: "⚡", color: "text-orange-600", name: "Répond rapidement" },
    HIGHLY_RATED: { icon: "🌟", color: "text-rose-600", name: "Très bien noté" },
    TRUSTED_GUEST: { icon: "✅", color: "text-teal-600", name: "Voyageur de confiance" },
    EARLY_ADOPTER: { icon: "🚀", color: "text-indigo-600", name: "Pionnier" },
    TOP_CONTRIBUTOR: { icon: "💎", color: "text-pink-600", name: "Top contributeur" },
  };

  const info = badgeInfo[type];
  if (!info) return null;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <span
      className={`inline-block ${info.color} ${sizeClasses[size]}`}
      title={info.name}
    >
      {info.icon}
    </span>
  );
}
