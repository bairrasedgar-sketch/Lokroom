"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Types d'espaces disponibles sur Lok'Room
const SPACE_TYPES = [
  {
    id: "APARTMENT",
    icon: "🏢",
    title: "Appartement",
    description: "Logement complet ou chambre privée",
  },
  {
    id: "HOUSE",
    icon: "🏠",
    title: "Maison",
    description: "Maison entière ou partie de maison",
  },
  {
    id: "ROOM",
    icon: "🛏️",
    title: "Chambre",
    description: "Chambre privée chez l'habitant",
  },
  {
    id: "STUDIO",
    icon: "🎬",
    title: "Studio créatif",
    description: "Studio photo, vidéo ou d'enregistrement",
  },
  {
    id: "OFFICE",
    icon: "💼",
    title: "Bureau",
    description: "Espace de travail privé",
  },
  {
    id: "COWORKING",
    icon: "👥",
    title: "Coworking",
    description: "Espace de travail partagé",
  },
  {
    id: "MEETING_ROOM",
    icon: "📊",
    title: "Salle de réunion",
    description: "Pour vos meetings et présentations",
  },
  {
    id: "PARKING",
    icon: "🚗",
    title: "Parking",
    description: "Place de stationnement",
  },
  {
    id: "GARAGE",
    icon: "🔧",
    title: "Garage",
    description: "Pour bricolage, mécanique ou stockage",
  },
  {
    id: "STORAGE",
    icon: "📦",
    title: "Stockage",
    description: "Espace de rangement sécurisé",
  },
  {
    id: "EVENT_SPACE",
    icon: "🎉",
    title: "Espace événementiel",
    description: "Pour fêtes, séminaires, shootings",
  },
  {
    id: "RECORDING_STUDIO",
    icon: "🎤",
    title: "Studio d'enregistrement",
    description: "Pour musique, podcast, voix-off",
  },
];

type Step = "welcome" | "space-type" | "verify";

export default function BecomeHostPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (step === "welcome") {
      setStep("space-type");
    } else if (step === "space-type" && selectedType) {
      setStep("verify");
    } else if (step === "verify") {
      // Lancer l'onboarding Stripe et rediriger vers création d'annonce
      setLoading(true);
      try {
        const res = await fetch("/api/host/onboard", { method: "POST" });
        const data = await res.json();

        if (data.url) {
          // Stocker le type sélectionné pour la création d'annonce
          sessionStorage.setItem("lokroom_listing_type", selectedType || "OTHER");
          window.location.href = data.url;
        } else if (data.alreadyHost) {
          // Déjà hôte, rediriger vers création d'annonce
          sessionStorage.setItem("lokroom_listing_type", selectedType || "OTHER");
          router.push("/listings/new");
        } else {
          throw new Error(data.error || "Erreur lors de l'activation");
        }
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === "space-type") setStep("welcome");
    else if (step === "verify") setStep("space-type");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold">
            Lokroom
          </Link>
          <Link
            href="/"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Quitter
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-gray-900 transition-all duration-300"
          style={{
            width: step === "welcome" ? "33%" : step === "space-type" ? "66%" : "100%",
          }}
        />
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-12">
        {step === "welcome" && (
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-gray-900 md:text-5xl">
              Deviens hôte sur Lok'Room
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Loue n'importe quel espace : logement, bureau, parking, studio...
              <br />
              Tu fixes les règles, on s'occupe du paiement sécurisé.
            </p>

            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="mb-4 text-3xl">💰</div>
                <h3 className="font-semibold text-gray-900">Revenus flexibles</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Loue à l'heure ou à la journée. Tu choisis tes tarifs et tes disponibilités.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="mb-4 text-3xl">🔒</div>
                <h3 className="font-semibold text-gray-900">Paiement sécurisé</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Stripe gère les paiements. Tu reçois tes revenus directement sur ton compte.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="mb-4 text-3xl">✅</div>
                <h3 className="font-semibold text-gray-900">Voyageurs vérifiés</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tous les utilisateurs sont vérifiés avec leur pièce d'identité.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "space-type" && (
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">
              Quel type d'espace veux-tu proposer ?
            </h1>
            <p className="mt-2 text-gray-600">
              Choisis la catégorie qui correspond le mieux à ton espace.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SPACE_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-gray-400 ${
                    selectedType === type.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{type.title}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
              <span className="text-4xl">
                {SPACE_TYPES.find((t) => t.id === selectedType)?.icon || "🏠"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">
              Dernière étape : configure tes paiements
            </h1>
            <p className="mt-4 text-gray-600">
              Pour recevoir tes revenus, tu dois configurer ton compte de paiement via Stripe.
              <br />
              C'est rapide, sécurisé et ne prend que 2 minutes.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left">
              <h3 className="font-semibold text-gray-900">Ce qu'il te faut :</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Une pièce d'identité valide</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">Tes coordonnées bancaires (IBAN)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-600">2 minutes de ton temps</span>
                </li>
              </ul>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Après la configuration, tu pourras créer ton annonce{" "}
              <strong>
                {SPACE_TYPES.find((t) => t.id === selectedType)?.title.toLowerCase()}
              </strong>{" "}
              et commencer à recevoir des réservations.
            </p>
          </div>
        )}
      </main>

      {/* Footer avec boutons */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          {step !== "welcome" ? (
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-medium text-gray-600 underline hover:text-gray-900"
            >
              Retour
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading || (step === "space-type" && !selectedType)}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Chargement..."
              : step === "verify"
              ? "Configurer mes paiements"
              : "Continuer"}
          </button>
        </div>
      </footer>
    </div>
  );
}
