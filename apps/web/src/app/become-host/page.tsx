"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Icônes SVG pour les types d'espaces (style Airbnb)
const SpaceIcons = {
  APARTMENT: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="4" y="8" width="24" height="20" rx="2" />
      <path d="M4 14h24" />
      <path d="M12 14v14" />
      <rect x="7" y="17" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="15" y="17" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="22" y="17" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="15" y="23" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="22" y="23" width="3" height="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  HOUSE: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M5 16L16 6l11 10" />
      <path d="M7 15v11a2 2 0 002 2h14a2 2 0 002-2V15" />
      <rect x="12" y="20" width="8" height="8" />
    </svg>
  ),
  ROOM: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="4" y="14" width="24" height="12" rx="2" />
      <path d="M4 20h24" />
      <rect x="6" y="8" width="8" height="6" rx="1" />
      <circle cx="10" cy="11" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  STUDIO: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <circle cx="16" cy="16" r="10" />
      <circle cx="16" cy="16" r="4" />
      <path d="M16 6v2" />
      <path d="M16 24v2" />
      <path d="M6 16h2" />
      <path d="M24 16h2" />
    </svg>
  ),
  OFFICE: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="6" y="8" width="20" height="16" rx="2" />
      <path d="M6 12h20" />
      <path d="M10 16h4" />
      <path d="M10 20h8" />
    </svg>
  ),
  COWORKING: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <circle cx="10" cy="10" r="4" />
      <circle cx="22" cy="10" r="4" />
      <path d="M6 28v-4a4 4 0 014-4h4" />
      <path d="M26 28v-4a4 4 0 00-4-4h-4" />
      <path d="M16 16v12" />
    </svg>
  ),
  MEETING_ROOM: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="4" y="10" width="24" height="14" rx="2" />
      <path d="M8 10V8a2 2 0 012-2h12a2 2 0 012 2v2" />
      <circle cx="10" cy="17" r="2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r="2" fill="currentColor" stroke="none" />
      <circle cx="22" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  PARKING: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="4" y="4" width="24" height="24" rx="4" />
      <path d="M12 22V10h5a4 4 0 010 8h-5" strokeWidth="3" />
    </svg>
  ),
  GARAGE: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M4 14l12-8 12 8" />
      <path d="M6 13v13h20V13" />
      <rect x="10" y="18" width="12" height="8" />
      <path d="M10 22h12" />
    </svg>
  ),
  STORAGE: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="4" y="6" width="24" height="8" rx="1" />
      <rect x="4" y="18" width="24" height="8" rx="1" />
      <circle cx="22" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="22" cy="22" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  EVENT_SPACE: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <path d="M16 4l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" />
    </svg>
  ),
  RECORDING_STUDIO: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
      <rect x="12" y="4" width="8" height="14" rx="4" />
      <path d="M8 14v2a8 8 0 0016 0v-2" />
      <path d="M16 24v4" />
      <path d="M10 28h12" />
    </svg>
  ),
};

// Types d'espaces disponibles sur Lok'Room
const SPACE_TYPES = [
  {
    id: "APARTMENT",
    icon: SpaceIcons.APARTMENT,
    title: "Appartement",
    description: "Logement complet ou chambre privée",
  },
  {
    id: "HOUSE",
    icon: SpaceIcons.HOUSE,
    title: "Maison",
    description: "Maison entière ou partie de maison",
  },
  {
    id: "ROOM",
    icon: SpaceIcons.ROOM,
    title: "Chambre",
    description: "Chambre privée chez l'habitant",
  },
  {
    id: "STUDIO",
    icon: SpaceIcons.STUDIO,
    title: "Studio créatif",
    description: "Studio photo, vidéo ou d'enregistrement",
  },
  {
    id: "OFFICE",
    icon: SpaceIcons.OFFICE,
    title: "Bureau",
    description: "Espace de travail privé",
  },
  {
    id: "COWORKING",
    icon: SpaceIcons.COWORKING,
    title: "Coworking",
    description: "Espace de travail partagé",
  },
  {
    id: "MEETING_ROOM",
    icon: SpaceIcons.MEETING_ROOM,
    title: "Salle de réunion",
    description: "Pour vos meetings et présentations",
  },
  {
    id: "PARKING",
    icon: SpaceIcons.PARKING,
    title: "Parking",
    description: "Place de stationnement",
  },
  {
    id: "GARAGE",
    icon: SpaceIcons.GARAGE,
    title: "Garage",
    description: "Pour bricolage, mécanique ou stockage",
  },
  {
    id: "STORAGE",
    icon: SpaceIcons.STORAGE,
    title: "Stockage",
    description: "Espace de rangement sécurisé",
  },
  {
    id: "EVENT_SPACE",
    icon: SpaceIcons.EVENT_SPACE,
    title: "Espace événementiel",
    description: "Pour fêtes, séminaires, shootings",
  },
  {
    id: "RECORDING_STUDIO",
    icon: SpaceIcons.RECORDING_STUDIO,
    title: "Studio d'enregistrement",
    description: "Pour musique, podcast, voix-off",
  },
];

type Step = "welcome" | "space-type" | "check-kyc";

export default function BecomeHostPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activatingHost, setActivatingHost] = useState(false);

  // Vérifier si l'utilisateur est déjà hôte
  const isHost = (session?.user as { role?: string })?.role === "HOST" ||
                 (session?.user as { role?: string })?.role === "BOTH" ||
                 (session?.user as { isHost?: boolean })?.isHost;

  // Rediriger vers création d'annonce si déjà hôte
  useEffect(() => {
    if (status === "authenticated" && isHost) {
      // Si déjà hôte, passer directement au choix du type
      setStep("space-type");
    }
  }, [status, isHost]);

  const handleContinue = async () => {
    if (step === "welcome") {
      // Si pas connecté, rediriger vers login
      if (status !== "authenticated") {
        router.push("/login?redirect=/become-host");
        return;
      }
      setStep("space-type");
    } else if (step === "space-type" && selectedType) {
      // Stocker le type sélectionné
      sessionStorage.setItem("lokroom_listing_type", selectedType);

      // Activer le mode hôte en arrière-plan si pas déjà hôte
      if (!isHost) {
        setActivatingHost(true);
        try {
          const res = await fetch("/api/host/activate", { method: "POST" });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Erreur activation");
          }

          // Rafraîchir la session pour mettre à jour le token JWT avec le nouveau rôle
          // Attendre un court délai pour s'assurer que la DB est à jour
          await new Promise(resolve => setTimeout(resolve, 500));
          await update();
          // Forcer le rafraîchissement du routeur pour propager la nouvelle session
          router.refresh();
        } catch (err) {
          console.error(err);
          alert(err instanceof Error ? err.message : "Erreur inconnue");
          setActivatingHost(false);
          return;
        }
        setActivatingHost(false);
      }

      // Vérifier le statut KYC
      setStep("check-kyc");
    } else if (step === "check-kyc") {
      // Aller directement créer l'annonce - la vérification KYC se fera à la publication
      setLoading(true);
      router.push("/listings/new");
    }
  };

  const handleBack = () => {
    if (step === "space-type") setStep("welcome");
    else if (step === "check-kyc") setStep("space-type");
  };

  // Afficher un loader pendant le chargement de la session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

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
              {isHost ? "Créer une nouvelle annonce" : "Deviens hôte sur Lok'Room"}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Loue n&apos;importe quel espace : logement, bureau, parking, studio...
              <br />
              Tu fixes les règles, on s&apos;occupe du paiement sécurisé.
            </p>

            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-6">
                <div className="mb-4 text-3xl">💰</div>
                <h3 className="font-semibold text-gray-900">Revenus flexibles</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Loue à l&apos;heure ou à la journée. Tu choisis tes tarifs et tes disponibilités.
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
                  Tous les utilisateurs sont vérifiés avec leur pièce d&apos;identité.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "space-type" && (
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">
              Quel type d&apos;espace veux-tu proposer ?
            </h1>
            <p className="mt-2 text-gray-600">
              Choisis la catégorie qui correspond le mieux à ton espace.
            </p>

            <div className="mt-8 max-h-[50vh] overflow-y-auto pb-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

            {activatingHost && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
                Activation du mode hôte...
              </div>
            )}
          </div>
        )}

        {step === "check-kyc" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
              <span className="text-4xl">
                {SPACE_TYPES.find((t) => t.id === selectedType)?.icon || "🏠"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">
              Prêt à créer ton annonce !
            </h1>
            <p className="mt-4 text-gray-600">
              Tu vas pouvoir créer ton annonce{" "}
              <strong>
                {SPACE_TYPES.find((t) => t.id === selectedType)?.title.toLowerCase()}
              </strong>
              .
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left">
              <h3 className="font-semibold text-gray-900">Rappel :</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-purple-500">📋</span>
                  <span className="text-sm text-gray-600">
                    Tu devras vérifier ton identité (KYC) pour publier ton annonce
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-500">💳</span>
                  <span className="text-sm text-gray-600">
                    Tu pourras configurer tes versements bancaires plus tard dans les paramètres
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-500">📸</span>
                  <span className="text-sm text-gray-600">
                    Prépare des photos de ton espace (minimum 3)
                  </span>
                </li>
              </ul>
            </div>
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
            disabled={loading || activatingHost || (step === "space-type" && !selectedType)}
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading || activatingHost
              ? "Chargement..."
              : step === "check-kyc"
              ? "Créer mon annonce"
              : status !== "authenticated" && step === "welcome"
              ? "Se connecter pour commencer"
              : "Continuer"}
          </button>
        </div>
      </footer>
    </div>
  );
}
