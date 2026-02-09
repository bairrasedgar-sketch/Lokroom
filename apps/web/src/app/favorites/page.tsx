"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import FavoritesClient from "./FavoritesClient";

export default function FavoritesPage() {
  const { status } = useSession();

  // Page non connecté
  if (status === "unauthenticated") {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100">
            <HeartSolid className="h-10 w-10 text-[#FF385C]" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Tes favoris t&apos;attendent</h1>
          <p className="mt-3 text-gray-500">
            Connecte-toi pour retrouver tes annonces préférées et créer des listes personnalisées
          </p>
          <Link
            href="/api/auth/signin"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FF385C] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#E31C5F] active:scale-[0.98]"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  return <FavoritesClient />;
}
