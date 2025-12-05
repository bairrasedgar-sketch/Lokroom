"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentsPage from "./payments/page";
import useTranslation from "@/hooks/useTranslation";

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

type AccountTranslations = typeof import("@/locales/fr").default.account;

// Couleurs d'icône : tout neutre (gris)
const iconColorByTab: Record<TabId, string> = {
  personal: "text-gray-500",
  security: "text-gray-500",
  privacy: "text-gray-500",
  notifications: "text-gray-500",
  taxes: "text-gray-500",
  payments: "text-gray-500",
  language: "text-gray-500",
};

// ---------- Types pour la vérification d'identité ----------
type IdentityStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

type IdentityStatusResponse = {
  identityStatus: IdentityStatus;
  identityLastVerifiedAt?: string | null;
};

function formatIdentityStatusLabel(
  status: IdentityStatus | null,
  t: AccountTranslations["securitySection"]
): string {
  switch (status) {
    case "PENDING":
      return t.statusPending;
    case "VERIFIED":
      return t.statusVerified;
    case "REJECTED":
      return t.statusRejected;
    case "UNVERIFIED":
    default:
      return t.statusUnverified;
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

// ---------- Carte "Connexion & sécurité" ----------
function SecurityTabContent({ t }: { t: AccountTranslations }) {
  const secT = t.securitySection;
  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [startingIdentity, setStartingIdentity] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Charger le statut et synchroniser si nécessaire
  useEffect(() => {
    const loadAndSyncStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/account/security/status");
        if (!res.ok) return;
        const data = (await res.json()) as IdentityStatusResponse;
        const currentStatus = data.identityStatus ?? "UNVERIFIED";
        setStatus(currentStatus);
        setLastVerifiedAt(
          data.identityLastVerifiedAt ? data.identityLastVerifiedAt : null
        );

        // Si le statut est PENDING, essayer de synchroniser avec Stripe
        if (currentStatus === "PENDING") {
          setSyncing(true);
          try {
            const syncRes = await fetch("/api/account/security/refresh-identity", {
              method: "POST",
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.identityStatus && syncData.identityStatus !== currentStatus) {
                setStatus(syncData.identityStatus);
                if (syncData.identityLastVerifiedAt) {
                  setLastVerifiedAt(syncData.identityLastVerifiedAt);
                }
              }
            }
          } catch (e) {
            console.error("Erreur sync status:", e);
          } finally {
            setSyncing(false);
          }
        }
      } catch (e) {
        console.error("Erreur chargement statut identité:", e);
      } finally {
        setLoadingStatus(false);
      }
    };

    void loadAndSyncStatus();
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

  const label = formatIdentityStatusLabel(status, secT);

  let buttonLabel = secT.verifyIdentity;
  let buttonDisabled = false;

  if (syncing) {
    buttonLabel = secT.syncing || "Synchronisation...";
    buttonDisabled = true;
  } else if (status === "PENDING") {
    buttonLabel = secT.continueVerification;
  } else if (status === "VERIFIED") {
    buttonLabel = secT.identityVerified;
    buttonDisabled = true;
  } else if (status === "REJECTED") {
    buttonLabel = secT.restartVerification;
  }

  if (startingIdentity) {
    buttonDisabled = true;
  }

  // Message descriptif selon le statut
  const getStatusDescription = () => {
    if (syncing) return secT.syncingDesc || "Vérification de ton statut auprès de Stripe...";
    if (status === "VERIFIED") return secT.verifiedDesc || "Tes documents ont été vérifiés avec succès. Tu peux utiliser toutes les fonctionnalités de Lok'Room.";
    if (status === "PENDING") return secT.pendingDesc || "Ta vérification est en cours de traitement. Cela peut prendre quelques minutes.";
    if (status === "REJECTED") return secT.rejectedDesc || "La vérification a échoué. Cela peut arriver si les documents ne sont pas lisibles ou si le consentement a été refusé. Tu peux réessayer.";
    return secT.identityDesc;
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{secT.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{secT.subtitle}</p>
      </div>

      <div className={`rounded-2xl border bg-white p-6 shadow-sm ${
        status === "VERIFIED" ? "border-emerald-200" :
        status === "REJECTED" ? "border-rose-200" :
        status === "PENDING" ? "border-amber-200" :
        "border-gray-200"
      }`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {secT.identityTitle}
              </h2>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${identityStatusClasses(
                  status
                )}`}
              >
                {loadingStatus ? secT.loading : syncing ? (secT.syncing || "Sync...") : label}
              </span>
            </div>

            <p className="text-sm text-gray-600">{getStatusDescription()}</p>

            {status === "VERIFIED" && (
              <div className="flex items-center gap-2 text-emerald-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">{secT.allDocumentsValid || "Tous tes documents sont en règle"}</span>
              </div>
            )}

            {status !== "VERIFIED" && (
              <p className="text-xs text-gray-400">{secT.identityNote}</p>
            )}

            {lastVerifiedAt && status === "VERIFIED" && (
              <p className="pt-1 text-xs text-gray-400">
                {secT.lastVerification}{" "}
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
                buttonDisabled && status === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                  : buttonDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : status === "REJECTED"
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-gray-900 text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40",
              ].join(" ")}
            >
              {startingIdentity ? secT.redirecting : buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Contenu Taxes ----------
type TaxesSubTab = "contributors" | "documents";

function TaxesTabContent({ t }: { t: AccountTranslations }) {
  const taxT = t.taxes;
  const currentYear = new Date().getFullYear();
  const years = [currentYear];

  const [subTab, setSubTab] = useState<TaxesSubTab>("contributors");
  const [showTaxInfoModal, setShowTaxInfoModal] = useState(false);

  return (
    <>
      <section className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{taxT.title}</h1>
          <p className="text-sm text-gray-500">{taxT.subtitle}</p>
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
              {taxT.contributors}
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
              {taxT.documents}
            </button>
          </nav>
        </div>

        {subTab === "contributors" ? (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {taxT.taxInfoTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {taxT.taxInfoDesc}{" "}
                <span className="block text-xs text-gray-500">
                  {taxT.taxInfoNote}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowTaxInfoModal(true)}
                className="mt-4 inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black"
              >
                {taxT.addTaxInfo}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {taxT.needHelp}
              </h2>
              <p className="mt-1">{taxT.needHelpDesc}</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center text-sm font-medium text-gray-900 underline underline-offset-2"
              >
                {taxT.helpCenter}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {taxT.documentsTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{taxT.documentsDesc}</p>

              <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
                {years.map((year) => (
                  <div
                    key={year}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-gray-900">{year}</span>
                    <span className="text-xs text-gray-500">
                      {taxT.noDocuments}
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
              aria-label={taxT.close}
            >
              ×
            </button>

            <div className="mt-4 space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                {taxT.modalTitle}
              </h2>
              <p className="text-sm text-gray-600">{taxT.modalDesc}</p>
              <p className="text-sm text-gray-600">
                {taxT.modalNote}{" "}
                <button
                  type="button"
                  className="text-sm font-medium text-gray-900 underline underline-offset-2"
                >
                  {taxT.learnMore}
                </button>
              </p>
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTaxInfoModal(false)}
                className="rounded-full bg-gray-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-black"
              >
                {taxT.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- TabContent global ----------
function TabContent({
  active,
  t,
  tabLabels,
}: {
  active: TabId;
  t: AccountTranslations;
  tabLabels: Record<TabId, string>;
}) {
  switch (active) {
    case "personal":
      return (
        <section className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">{t.personal.title}</h1>
            <p className="text-sm text-gray-500">{t.personal.subtitle}</p>
          </header>

          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.personal.legalName}
                </p>
                <p className="text-xs text-gray-500">
                  {t.personal.legalNameDesc}
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                {t.personal.modify}
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.personal.emailAddress}
                </p>
                <p className="text-xs text-gray-500">
                  {t.personal.emailAddressDesc}
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                {t.personal.modify}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.personal.phoneNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {t.personal.phoneNumberDesc}
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                {t.personal.modify}
              </button>
            </div>
          </div>
        </section>
      );

    case "security":
      return <SecurityTabContent t={t} />;

    case "taxes":
      return <TaxesTabContent t={t} />;

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
            <h1 className="text-2xl font-semibold">{t.comingSoon.title}</h1>
            <p className="text-sm text-gray-500">
              {t.comingSoon.subtitle.replace("{section}", tabLabels[active])}
            </p>
          </header>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            {t.comingSoon.placeholder}
          </div>
        </section>
      );
  }
}

export default function AccountSettingsPage() {
  const { dict } = useTranslation();
  const t = dict.account;

  const searchParams = useSearchParams();
  const router = useRouter();

  // 🔹 chaque tab a une icône React
  const tabs: { id: TabId; label: string; icon: ReactNode }[] = [
    {
      id: "personal",
      label: t.tabs.personal,
      icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: "security",
      label: t.tabs.security,
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      id: "privacy",
      label: t.tabs.privacy,
      icon: <LockClosedIcon className="h-5 w-5" />,
    },
    {
      id: "notifications",
      label: t.tabs.notifications,
      icon: <BellIcon className="h-5 w-5" />,
    },
    {
      id: "taxes",
      label: t.tabs.taxes,
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: "payments",
      label: t.tabs.payments,
      icon: <CreditCardIcon className="h-5 w-5" />,
    },
    {
      id: "language",
      label: t.tabs.language,
      icon: <GlobeAltIcon className="h-5 w-5" />,
    },
  ];

  const tabLabels: Record<TabId, string> = {
    personal: t.tabs.personal,
    security: t.tabs.security,
    privacy: t.tabs.privacy,
    notifications: t.tabs.notifications,
    taxes: t.tabs.taxes,
    payments: t.tabs.payments,
    language: t.tabs.language,
  };

  const urlTab = searchParams.get("tab") as TabId | null;
  const initialTab: TabId = tabs.some((tab) => tab.id === urlTab)
    ? (urlTab as TabId)
    : "personal";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    const currentUrlTab = searchParams.get("tab") as TabId | null;
    if (currentUrlTab && tabs.some((tab) => tab.id === currentUrlTab)) {
      setActiveTab(currentUrlTab);
    }
  }, [searchParams, tabs]);

  const handleChangeTab = (id: TabId) => {
    setActiveTab(id);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    router.push(`/account?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="mx-auto flex max-w-6xl gap-8 px-4 py-10 lg:px-8">
      <aside className="hidden w-72 flex-shrink-0 border-r border-gray-200 pr-6 md:block">
        <h2 className="mb-6 text-lg font-semibold">{t.settingsTitle}</h2>
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
        <h2 className="mb-3 text-lg font-semibold">{t.settingsTitle}</h2>
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
        <TabContent active={activeTab} t={t} tabLabels={tabLabels} />
      </section>
    </main>
  );
}
