"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, StarIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import confetti from "canvas-confetti";

export default function ReviewSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Lancer les confettis
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 mb-3">
          Merci pour votre avis !
        </h1>

        <p className="text-gray-600 mb-8">
          Votre avis a été publié et aidera d'autres utilisateurs à faire leur choix.
          Les avis sont essentiels pour notre communauté.
        </p>

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <StarIcon className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-medium">Vous contribuez à la communauté</span>
          </div>
          <p className="text-sm text-gray-500">
            Les avis permettent aux hôtes d'améliorer leurs espaces et aux voyageurs
            de trouver l'espace parfait.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/bookings"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition"
          >
            Voir mes réservations
            <ArrowRightIcon className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="block w-full py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
