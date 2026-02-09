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
    title: "Studios",
    description: "Pour musique, podcast, voix-off",
  },
];

type Step = "welcome" | "space-type" | "check-kyc";

export default function BecomeHostPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
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
    } else if (step === "space-type" && selectedTypes.length > 0) {
      // Stocker les types sélectionnés
      sessionStorage.setItem("lokroom_listing_types", JSON.stringify(selectedTypes));

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
        <div className="mx-auto flex max-w-5xl 2xl:max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
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
      <main className="mx-auto max-w-3xl 2xl:max-w-4xl px-4 sm:px-6 py-12">
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

            {/* Calculateur de revenus */}
            <div className="mx-auto mt-12 max-w-md rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
              <h3 className="text-lg font-semibold text-gray-900">💰 Calcule tes revenus potentiels</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Prix par nuit</label>
                  <input
                    type="number"
                    defaultValue="100"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                    id="calc-price"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Jours loués par mois</label>
                  <input
                    type="number"
                    defaultValue="15"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                    id="calc-days"
                  />
                </div>
                <div className="rounded-lg bg-white p-4 text-center">
                  <div className="text-sm text-gray-600">Revenus mensuels estimés</div>
                  <div className="mt-1 text-3xl font-bold text-purple-600">
                    <span id="calc-result">1 500</span> €
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Avant frais de service Lok&apos;Room (5%)</div>
                </div>
              </div>
            </div>

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

            {/* Comment ça marche */}
            <div className="mt-16 text-left">
              <h2 className="text-center text-2xl font-semibold text-gray-900">Comment ça marche ?</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-4">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">1</div>
                  <h3 className="mt-4 font-semibold text-gray-900">Crée ton annonce</h3>
                  <p className="mt-2 text-sm text-gray-600">Décris ton espace, ajoute des photos et fixe ton prix</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">2</div>
                  <h3 className="mt-4 font-semibold text-gray-900">Reçois des demandes</h3>
                  <p className="mt-2 text-sm text-gray-600">Les voyageurs découvrent ton espace et réservent</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">3</div>
                  <h3 className="mt-4 font-semibold text-gray-900">Accueille tes invités</h3>
                  <p className="mt-2 text-sm text-gray-600">Communique facilement et partage ton espace</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">4</div>
                  <h3 className="mt-4 font-semibold text-gray-900">Reçois tes revenus</h3>
                  <p className="mt-2 text-sm text-gray-600">Paiement sécurisé directement sur ton compte</p>
                </div>
              </div>
            </div>

            {/* Témoignages */}
            <div className="mt-16">
              <h2 className="text-center text-2xl font-semibold text-gray-900">Ce que disent nos hôtes</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {"★★★★★".split("").map((star, i) => <span key={i}>{star}</span>)}
                  </div>
                  <p className="mt-4 text-sm text-gray-700">
                    &quot;Lok&apos;Room m&apos;a permis de rentabiliser mon studio photo les jours où je ne l&apos;utilise pas. Interface simple et paiements rapides !&quot;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Sophie L.</div>
                      <div className="text-xs text-gray-500">Photographe à Paris</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {"★★★★★".split("").map((star, i) => <span key={i}>{star}</span>)}
                  </div>
                  <p className="mt-4 text-sm text-gray-700">
                    &quot;Je loue mon parking en journée pendant que je suis au travail. 300€ de revenus passifs par mois, c&apos;est génial !&quot;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Marc D.</div>
                      <div className="text-xs text-gray-500">Consultant à Lyon</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {"★★★★★".split("").map((star, i) => <span key={i}>{star}</span>)}
                  </div>
                  <p className="mt-4 text-sm text-gray-700">
                    &quot;Plateforme sécurisée et support réactif. J&apos;ai loué mon appartement pendant mes vacances sans aucun souci.&quot;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Julie M.</div>
                      <div className="text-xs text-gray-500">Propriétaire à Bordeaux</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-16 text-left">
              <h2 className="text-center text-2xl font-semibold text-gray-900">Questions fréquentes</h2>
              <div className="mx-auto mt-8 max-w-3xl space-y-4">
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Combien coûte Lok&apos;Room pour les hôtes ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Lok&apos;Room prélève une commission de 5% sur chaque réservation. Pas de frais d&apos;inscription ni d&apos;abonnement mensuel.</p>
                </details>
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Quand suis-je payé ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Le paiement est transféré sur votre compte bancaire 24h après l&apos;arrivée du voyageur, via Stripe Connect.</p>
                </details>
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Mon espace est-il assuré ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Oui, chaque réservation inclut une protection contre les dommages jusqu&apos;à 1 000 000€ via notre partenaire d&apos;assurance.</p>
                </details>
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Puis-je annuler une réservation ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Oui, mais selon votre politique d&apos;annulation. Nous recommandons une politique flexible pour attirer plus de voyageurs.</p>
                </details>
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Comment les voyageurs sont-ils vérifiés ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Tous les voyageurs doivent vérifier leur identité avec une pièce officielle et un selfie via Stripe Identity avant de réserver.</p>
                </details>
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Puis-je louer plusieurs espaces ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Absolument ! Vous pouvez créer autant d&apos;annonces que vous le souhaitez et gérer tous vos espaces depuis un seul compte.</p>
                </details>
                <details className="rounded-lg border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">Le support est-il disponible 7j/7 ?</summary>
                  <p className="mt-2 text-sm text-gray-600">Oui, notre équipe support est disponible 7 jours sur 7 par email, chat et téléphone pour vous accompagner.</p>
                </details>
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
              Choisis entre 1 et 5 espaces que ton annonce peut proposer.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {selectedTypes.length}/5 sélectionné{selectedTypes.length > 1 ? "s" : ""}
            </p>

            <div className="mt-8 max-h-[50vh] overflow-y-auto pb-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SPACE_TYPES.map((type) => {
                  const isSelected = selectedTypes.includes(type.id);
                  const isDisabled = !isSelected && selectedTypes.length >= 5;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTypes(selectedTypes.filter((t) => t !== type.id));
                        } else if (selectedTypes.length < 5) {
                          setSelectedTypes([...selectedTypes, type.id]);
                        }
                      }}
                      disabled={isDisabled}
                      className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-gray-900 bg-gray-50"
                          : isDisabled
                          ? "border-gray-100 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{type.title}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                      {isSelected && (
                        <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
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
                {SPACE_TYPES.find((t) => t.id === selectedTypes[0])?.icon || "🏠"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 md:text-4xl">
              Prêt à créer ton annonce !
            </h1>
            <p className="mt-4 text-gray-600">
              Tu vas pouvoir créer ton annonce avec {selectedTypes.length} type{selectedTypes.length > 1 ? "s" : ""} d&apos;espace :{" "}
              <strong>
                {selectedTypes.map((t) => SPACE_TYPES.find((s) => s.id === t)?.title.toLowerCase()).join(", ")}
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
            disabled={loading || activatingHost || (step === "space-type" && selectedTypes.length === 0)}
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

      {/* Script pour le calculateur */}
      <script dangerouslySetInnerHTML={{__html: `
        if (typeof document !== 'undefined') {
          const priceInput = document.getElementById('calc-price');
          const daysInput = document.getElementById('calc-days');
          const resultSpan = document.getElementById('calc-result');

          function updateCalc() {
            const price = parseFloat(priceInput?.value || 100);
            const days = parseFloat(daysInput?.value || 15);
            const total = Math.round(price * days);
            if (resultSpan) resultSpan.textContent = total.toLocaleString('fr-FR');
          }

          priceInput?.addEventListener('input', updateCalc);
          daysInput?.addEventListener('input', updateCalc);
        }
      `}} />
    </div>
  );
}
