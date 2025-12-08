"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";

export default function FavoriteButton({
  listingId,
  size = 28,
  className = "",
}: {
  listingId: string;
  size?: number;
  className?: string;
}) {
  const { status } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  // Charger l'état initial
  useEffect(() => {
    let abort = false;
    (async () => {
      const r = await fetch(`/api/favorites/${listingId}`, { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const j = await r.json().catch(() => null);
      if (!abort && j) setFavorited(!!j.favorited);
    })();
    return () => { abort = true; };
  }, [listingId]);

  async function toggle() {
    if (status !== "authenticated") {
      toast.message("Connecte-toi pour ajouter en favoris");
      return signIn();
    }

    const willBeFavorited = !favorited;

    // Déclencher l'animation seulement quand on ajoute aux favoris
    if (willBeFavorited) {
      setIsAnimating(true);
      // Créer des particules pour l'effet de burst
      setParticles([1, 2, 3, 4, 5, 6]);
      setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
      }, 700);
    }

    startTransition(async () => {
      setFavorited(willBeFavorited);
      const method = willBeFavorited ? "POST" : "DELETE";
      const res = await fetch(`/api/favorites/${listingId}`, { method });
      if (!res.ok) {
        setFavorited(!willBeFavorited);
        toast.error("Impossible de mettre à jour le favori");
      } else {
        toast.success(willBeFavorited ? "Ajouté aux favoris" : "Retiré des favoris");
      }
    });
  }

  return (
    <button
      onClick={toggle}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      disabled={isPending}
      className={`relative rounded-full bg-white/90 p-1.5 shadow-md hover:shadow-lg transition-shadow ${className}`}
      title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {/* Particules de burst - rose pastel */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {particles.map((p) => (
          <span
            key={p}
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-rose-300"
            style={{
              animation: `particle-burst-${p} 0.6s ease-out forwards`,
            }}
          />
        ))}
      </div>

      {/* Ring effect - rose pastel */}
      {isAnimating && (
        <span
          className="absolute inset-0 rounded-full border-2 border-rose-300 animate-ping-once"
        />
      )}

      {/* Icône cœur avec animation - rose pastel quand favori */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`relative z-10 transition-all duration-300 ease-out
          ${favorited ? "fill-rose-400 stroke-rose-400" : "fill-none stroke-gray-600 hover:stroke-rose-300"}
          ${isAnimating ? "scale-125" : "scale-100"}
          ${!favorited ? "hover:scale-110" : ""}
        `}
        strokeWidth="1.5"
        style={{
          filter: favorited ? "drop-shadow(0 2px 6px rgba(251, 113, 133, 0.5))" : "none",
        }}
      >
        <path d="M12 21s-6.716-4.145-9.192-7.07C.749 11.62 1.367 8.5 3.757 7.05A5.002 5.002 0 0 1 12 8.278 5.002 5.002 0 0 1 20.243 7.05c2.39 1.45 3.008 4.57.95 6.88C18.716 16.855 12 21 12 21z" />
      </svg>

      {/* Styles pour les animations - rose pastel */}
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
  );
}
