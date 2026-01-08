"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProfileRes = {
  user?: {
    email: string | null;
    name: string | null;
    profile?: {
      avatarUrl?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };
};

export default function UserAvatar() {
  const [img, setImg] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return; // pas connecté
        const data: ProfileRes = await res.json();
        setEmail(data.user?.email ?? "");
        setImg(data.user?.profile?.avatarUrl ?? null);

        // Utiliser le prénom si disponible, sinon le nom complet, sinon l'email
        const firstName = data.user?.profile?.firstName;
        const name = data.user?.name;
        if (firstName) {
          setDisplayName(firstName);
        } else if (name) {
          setDisplayName(name.split(" ")[0] || name);
        } else {
          setDisplayName(data.user?.email ?? "");
        }
      } catch (err) {
        // Ignorer les erreurs d'abort
        if (err instanceof Error && err.name === "AbortError") return;
        if (process.env.NODE_ENV !== "production") {
          console.debug("UserAvatar: échec fetch /api/profile:", err);
        }
      }
    }

    fetchProfile();
    return () => controller.abort();
  }, []);

  if (!email) {
    return (
      <a href="/login" className="text-sm text-gray-600 hover:underline" aria-label="Se connecter">
        Login
      </a>
    );
  }

  // Obtenir la première lettre du prénom en majuscule
  const initial = displayName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "?";

  return (
    <a href="/profile" className="flex items-center gap-2" aria-label="Accéder à mon profil">
      {img ? (
        <span className="block h-8 w-8 overflow-hidden rounded-full">
          <Image
            src={img}
            alt="avatar"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover border"
          />
        </span>
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
          {initial}
        </div>
      )}
      <span className="text-sm text-gray-700">Mon profil</span>
    </a>
  );
}
