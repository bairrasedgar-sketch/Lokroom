// apps/web/src/app/account/page.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentsPage from "./payments/page";

// Heroicons outline (icônes propres style Airbnb)
import {
  UserIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  BellIcon,
  DocumentTextIcon,
  CreditCardIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

type TabId =
  | "personal"
  | "security"
  | "privacy"
  | "notifications"
  | "taxes"
  | "payments"
  | "language";

// 🔹 chaque tab a une icône React
const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: "personal",
    label: "Données personnelles",
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    id: "security",
    label: "Connexion et sécurité",
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    id: "privacy",
    label: "Confidentialité",
    icon: <LockClosedIcon className="h-5 w-5" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <BellIcon className="h-5 w-5" />,
  },
  {
    id: "taxes",
    label: "Taxes",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    id: "payments",
    label: "Paiements",
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
  {
    id: "language",
    label: "Langues et devise",
    icon: <GlobeAltIcon className="h-5 w-5" />,
  },
];

// Couleurs d’icône : tout neutre (gris)
const iconColorByTab: Record<TabId, string> = {
  personal: "text-gray-500",
  security: "text-gray-500",
  privacy: "text-gray-500",
  notifications: "text-gray-500",
  taxes: "text-gray-500",
  payments: "text-gray-500",
  language: "text-gray-500",
};

// ---------- Types pour la vérification d’identité ----------
type IdentityStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

type IdentityStatusResponse = {
  identityStatus: IdentityStatus;
  identityLastVerifiedAt?: string | null;
};

function formatIdentityStatusLabel(status: IdentityStatus | null): string {
  switch (status) {
    case "PENDING":
      return "Vérification en cours";
    case "VERIFIED":
      return "Identité vérifiée";
    case "REJECTED":
      return "Vérification refusée";
    case "UNVERIFIED":
    default:
      return "Non vérifiée";
  }
}

function identityStatusClasses(status: IdentityStatus | null): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "UNVERIFIED":
    default:
      return "bg-gray-50 text-gray-600 border border-gray-200";
  }
}

// ---------- Carte “Connexion & sécurité” ----------
function SecurityTabContent() {
  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [startingIdentity, setStartingIdentity] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/account/security/status");
        if (!res.ok) return;
        const data = (await res.json()) as IdentityStatusResponse;
        setStatus(data.identityStatus ?? "UNVERIFIED");
        setLastVerifiedAt(
          data.identityLastVerifiedAt ? data.identityLastVerifiedAt : null,
        );
      } catch (e) {
        console.error("Erreur chargement statut identité:", e);
      } finally {
        setLoadingStatus(false);
      }
    };

    void loadStatus();
  }, []);

  const handleStartIdentity = async () => {
    try {
      setStartingIdentity(true);
      const res = await fetch("/api/identity/start", {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Erreur création session Identity:", await res.text());
        setStartingIdentity(false);
        return;
      }

      const data = (await res.json()) as { url: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStartingIdentity(false);
      }
    } catch (e) {
      console.error("Erreur Identity:", e);
      setStartingIdentity(false);
    }
  };

  const label = formatIdentityStatusLabel(status);

  let buttonLabel = "Vérifier mon identité";
  let buttonDisabled = false;

  if (status === "PENDING") {
    buttonLabel = "Continuer la vérification";
  } else if (status === "VERIFIED") {
    buttonLabel = "Identité vérifiée";
    buttonDisabled = true;
  } else if (status === "REJECTED") {
    buttonLabel = "Recommencer la vérification";
  }

  if (startingIdentity) {
    buttonDisabled = true;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Sécurité du compte
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Cette section accueillera plus tard les paramètres de mot de passe,
          méthodes de connexion, etc.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Vérification d&apos;identité
              </h2>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${identityStatusClasses(
                  status,
                )}`}
              >
                {loadingStatus ? "Chargement..." : label}
              </span>
            </div>

            <p className="text-sm text-gray-600">
              Lok&apos;Room utilise Stripe Identity pour vérifier votre pièce
              d&apos;identité (carte d&apos;identité, passeport, permis de
              conduire) et un selfie. Cela renforce la sécurité autant pour les
              voyageurs que pour les hôtes.
            </p>
            <p className="text-xs text-gray-400">
              La vérification est réalisée sur une page sécurisée Stripe. Vos
              documents sont traités et stockés par Stripe, pas par Lok&apos;Room.
            </p>

            {lastVerifiedAt && (
              <p className="pt-1 text-xs text-gray-400">
                Dernière vérification :{" "}
                {new Date(lastVerifiedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-start">
            <button
              type="button"
              onClick={handleStartIdentity}
              disabled={buttonDisabled}
              className={[
                "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition shadow-sm",
                buttonDisabled
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                  : "bg-gray-900 text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40",
              ].join(" ")}
            >
              {startingIdentity ? "Redirection..." : buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Contenu Taxes ----------
type TaxesSubTab = "contributors" | "documents";

function TaxesTabContent() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear];

  const [subTab, setSubTab] = useState<TaxesSubTab>("contributors");
  const [showTaxInfoModal, setShowTaxInfoModal] = useState(false);

  return (
    <>
      <section className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Taxes</h1>
          <p className="text-sm text-gray-500">
            Gérez vos informations fiscales et vos documents liés à votre
            activité sur Lok&apos;Room.
          </p>
        </header>

        <div className="border-b border-gray-200">
          <nav className="flex gap-6 text-sm">
            <button
              type="button"
              onClick={() => setSubTab("contributors")}
              className={[
                "pb-3",
                subTab === "contributors"
                  ? "border-b-2 border-gray-900 font-medium text-gray-900"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-900",
              ].join(" ")}
            >
              Contribuables
            </button>
            <button
              type="button"
              onClick={() => setSubTab("documents")}
              className={[
                "pb-3",
                subTab === "documents"
                  ? "border-b-2 border-gray-900 font-medium text-gray-900"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-900",
              ].join(" ")}
            >
              Documents fiscaux
            </button>
          </nav>
        </div>

        {subTab === "contributors" ? (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Informations fiscales
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Selon les lois de votre pays, Lok&apos;Room peut être amené à
                vous demander des informations fiscales.{" "}
                <span className="block text-xs text-gray-500">
                  Pour le moment, aucune information fiscale supplémentaire
                  n&apos;est requise pour votre compte. Si la réglementation
                  change, nous vous en informerons.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowTaxInfoModal(true)}
                className="mt-4 inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black"
              >
                Ajouter des infos fiscales
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Besoin d&apos;aide ?
              </h2>
              <p className="mt-1">
                Obtenez des réponses à vos questions sur la fiscalité dans le
                centre d&apos;aide Lok&apos;Room.
              </p>
              <button
                type="button"
                className="mt-3 inline-flex items-center text-sm font-medium text-gray-900 underline underline-offset-2"
              >
                Accéder au Centre d&apos;aide
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Documents fiscaux
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Consultez et téléchargez les documents fiscaux requis pour vos
                déclarations d&apos;impôts. Vous pouvez également utiliser le
                récapitulatif détaillé de vos revenus.
              </p>

              <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
                {years.map((year) => (
                  <div
                    key={year}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-gray-900">{year}</span>
                    <span className="text-xs text-gray-500">
                      Aucun document fiscal n&apos;a été produit.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {showTaxInfoModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-10 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowTaxInfoModal(false)}
              className="absolute left-6 top-6 text-2xl leading-none text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              ×
            </button>

            <div className="mt-4 space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Vous n&apos;avez pas besoin d&apos;ajouter des infos fiscales
              </h2>
              <p className="text-sm text-gray-600">
                Vous n&apos;avez pas besoin d&apos;ajouter des infos fiscales
                pour le moment. Si nous avons besoin de quelque chose, nous
                communiquerons avec vous.
              </p>
              <p className="text-sm text-gray-600">
                Pour modifier un numéro d&apos;identification fiscale, vous
                devrez le supprimer et l&apos;ajouter à nouveau.{" "}
                <button
                  type="button"
                  className="text-sm font-medium text-gray-900 underline underline-offset-2"
                >
                  En savoir plus
                </button>
              </p>
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTaxInfoModal(false)}
                className="rounded-full bg-gray-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-black"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- TabContent global ----------
function TabContent({ active }: { active: TabId }) {
  switch (active) {
    case "personal":
      return (
        <section className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">Données personnelles</h1>
            <p className="text-sm text-gray-500">
              Gérez votre nom, votre adresse e-mail et vos informations de
              contact.
            </p>
          </header>

          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Nom légal</p>
                <p className="text-xs text-gray-500">
                  Le nom figurant sur votre pièce d’identité et vos
                  justificatifs.
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Adresse e-mail
                </p>
                <p className="text-xs text-gray-500">
                  Utilisée pour vos confirmations de réservation et les
                  notifications.
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Numéro de téléphone
                </p>
                <p className="text-xs text-gray-500">
                  Sert à sécuriser votre compte et à vous contacter si
                  nécessaire.
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                Modifier
              </button>
            </div>
          </div>
        </section>
      );

    case "security":
      return <SecurityTabContent />;

    case "taxes":
      return <TaxesTabContent />;

    case "payments":
      return (
        <section className="space-y-6">
          <PaymentsPage />
        </section>
      );

    default:
      return (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-semibold">Section à venir</h1>
            <p className="text-sm text-gray-500">
              On préparera le contenu détaillé de «{" "}
              {tabs.find((t) => t.id === active)?.label} » plus tard.
            </p>
          </header>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Pour l’instant, cette section est une maquette. On y ajoutera les
            formulaires et paramètres quand on s’attaquera à cette partie.
          </div>
        </section>
      );
  }
}

export default function AccountSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlTab = searchParams.get("tab") as TabId | null;
  const initialTab: TabId = tabs.some((t) => t.id === urlTab)
    ? (urlTab as TabId)
    : "personal";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    const currentUrlTab = searchParams.get("tab") as TabId | null;
    if (currentUrlTab && tabs.some((t) => t.id === currentUrlTab)) {
      setActiveTab(currentUrlTab);
    }
  }, [searchParams]);

  const handleChangeTab = (id: TabId) => {
    setActiveTab(id);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    router.push(`/account?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="mx-auto flex max-w-6xl gap-8 px-4 py-10 lg:px-8">
      <aside className="hidden w-72 flex-shrink-0 border-r border-gray-200 pr-6 md:block">
        <h2 className="mb-6 text-lg font-semibold">Paramètres du compte</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleChangeTab(tab.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full border text-base",
                    isActive
                      ? "border-transparent bg-white/10 text-white"
                      : `border-gray-200 bg-white shadow-sm ${
                          iconColorByTab[tab.id]
                        }`,
                  ].join(" ")}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="md:hidden">
        <h2 className="mb-3 text-lg font-semibold">Paramètres du compte</h2>
        <select
          value={activeTab}
          onChange={(e) => handleChangeTab(e.target.value as TabId)}
          className="mb-6 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      <section className="flex-1">
        <TabContent active={activeTab} />
      </section>
    </main>
  );
}
