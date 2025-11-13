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
    startTransition(async () => {
      const optimistic = !favorited;
      setFavorited(optimistic);
      const method = optimistic ? "POST" : "DELETE";
      const res = await fetch(`/api/favorites/${listingId}`, { method });
      if (!res.ok) {
        setFavorited(!optimistic);
        toast.error("Impossible de mettre à jour le favori");
      } else {
        toast.success(optimistic ? "Ajouté aux favoris" : "Retiré des favoris");
      }
    });
  }

  // Icône cœur (SVG) – rempli si favori
  return (
    <button
      onClick={toggle}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      disabled={isPending}
      className={`rounded-full bg-white/90 p-1 shadow hover:scale-105 transition ${className}`}
      title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`${favorited ? "fill-red-500 stroke-red-500" : "fill-none stroke-gray-700"}`}
        strokeWidth="1.5"
      >
        <path d="M12 21s-6.716-4.145-9.192-7.07C.749 11.62 1.367 8.5 3.757 7.05A5.002 5.002 0 0 1 12 8.278 5.002 5.002 0 0 1 20.243 7.05c2.39 1.45 3.008 4.57.95 6.88C18.716 16.855 12 21 12 21z" />
      </svg>
    </button>
  );
}
