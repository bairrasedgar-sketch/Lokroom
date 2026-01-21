"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import WishlistModal from "./WishlistModal";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function FavoriteButton({
  listingId,
  size = 24,
  className = "",
  showModal = true,
  variant = "default",
}: {
  listingId: string;
  size?: number;
  className?: string;
  showModal?: boolean;
  variant?: "default" | "map" | "card";
}) {
  const { status } = useSession();
  const { isFavorited, addFavorite, removeFavorite, openModalForListing, setOpenModalForListing } = useFavorites();
  const [isPending, startTransition] = useTransition();
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup du timeout d'animation au démontage
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Utiliser l'état du context pour savoir si ce modal est ouvert
  const isModalOpen = openModalForListing === listingId;

  // Utiliser l'état du context
  const favorited = isFavorited(listingId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      toast.message("Connectez-vous pour ajouter en favoris");
      return signIn();
    }

    // Si déjà en favoris, on retire
    if (favorited) {
      startTransition(async () => {
        // Optimistic update
        removeFavorite(listingId);

        const res = await fetch(`/api/favorites/${listingId}`, { method: "DELETE" });
        if (!res.ok) {
          // Rollback en cas d'erreur
          addFavorite(listingId);

          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || "Impossible de retirer le favori");
        } else {
          toast.success("Retiré des favoris");
        }
      });
      return;
    }

    // Si pas encore en favoris, on ouvre le modal pour choisir la liste
    if (showModal) {
      setOpenModalForListing(listingId);
    } else {
      // Mode simple sans modal
      triggerAnimation();
      startTransition(async () => {
        // Optimistic update
        addFavorite(listingId);

        const res = await fetch(`/api/favorites/${listingId}`, { method: "POST" });
        if (!res.ok) {
          // Rollback en cas d'erreur
          removeFavorite(listingId);

          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || "Impossible d'ajouter aux favoris");
        } else {
          toast.success("Ajouté aux favoris");
        }
      });
    }
  }

  function triggerAnimation() {
    setIsAnimating(true);
    setParticles([1, 2, 3, 4, 5, 6]);
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 700);
  }

  function handleSaved() {
    // Mettre à jour le context
    addFavorite(listingId);
    triggerAnimation();
    toast.success("Ajouté aux favoris");
  }

  // Style du bouton selon la variante
  const buttonStyles = {
    default: "p-1.5",
    map: "p-1",
    card: "p-1.5",
  };

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={favorited}
        disabled={isPending}
        className={`lokroom-heart-btn relative rounded-full transition-all duration-200 ${buttonStyles[variant]} ${className}`}
        title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        {/* Particules de burst */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map((p) => (
            <span
              key={p}
              className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-[#FF385C]"
              style={{
                animation: `particle-burst-${p} 0.6s ease-out forwards`,
              }}
            />
          ))}
        </div>

        {/* Ring effect */}
        {isAnimating && (
          <span
            className="absolute inset-0 rounded-full border-2 border-[#FF385C] animate-ping-once"
          />
        )}

        {/* Icône cœur style Airbnb - contour blanc, rempli rouge quand favori */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          className={`relative z-10 transition-all duration-200 ease-out
            ${isAnimating ? "scale-125" : "scale-100"}
            ${!favorited ? "hover:scale-110" : ""}
          `}
        >
          <path
            d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
            className={`transition-all duration-200 ${
              favorited
                ? "fill-[#FF385C] stroke-[#FF385C]"
                : "fill-black/40 stroke-white hover:fill-black/30"
            }`}
            strokeWidth="2"
          />
        </svg>

        {/* Styles pour les animations */}
        <style jsx>{`
          @keyframes particle-burst-1 {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(calc(-50% + 12px), calc(-50% - 14px)) scale(1); opacity: 0; }
          }
          @keyframes particle-burst-2 {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(calc(-50% - 14px), calc(-50% - 8px)) scale(1); opacity: 0; }
          }
          @keyframes particle-burst-3 {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(calc(-50% + 14px), calc(-50% + 6px)) scale(1); opacity: 0; }
          }
          @keyframes particle-burst-4 {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(calc(-50% - 10px), calc(-50% + 12px)) scale(1); opacity: 0; }
          }
          @keyframes particle-burst-5 {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(calc(-50% + 4px), calc(-50% - 16px)) scale(1); opacity: 0; }
          }
          @keyframes particle-burst-6 {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(calc(-50% - 6px), calc(-50% - 14px)) scale(1); opacity: 0; }
          }
          .animate-ping-once {
            animation: ping-once 0.5s ease-out forwards;
          }
          @keyframes ping-once {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.8); opacity: 0; }
          }
        `}</style>
      </button>

      {/* Modal wishlist */}
      <WishlistModal
        isOpen={isModalOpen}
        onClose={() => setOpenModalForListing(null)}
        listingId={listingId}
        onSaved={handleSaved}
      />
    </>
  );
}
