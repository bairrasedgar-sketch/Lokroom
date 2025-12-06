"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentsPage from "./payments/page";
import useTranslation from "@/hooks/useTranslation";
import { SUPPORTED_LANGS, type SupportedLang } from "@/locales";
import type { Currency } from "@/lib/currency";

// Heroicons outline (icônes propres style Airbnb)
import {
  UserIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  BellIcon,
  DocumentTextIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PhoneIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XMarkIcon,
  EnvelopeIcon,
  HomeIcon,
  MapPinIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const ONE_YEAR = 60 * 60 * 24 * 365;

const LANG_LABELS: Record<SupportedLang, { label: string; code: string }> = {
  fr: { label: "Français", code: "FR" },
  en: { label: "English", code: "EN" },
  es: { label: "Español", code: "ES" },
  de: { label: "Deutsch", code: "DE" },
  it: { label: "Italiano", code: "IT" },
  pt: { label: "Português", code: "PT" },
  zh: { label: "中文", code: "ZH" },
};

type CurrencyOption = {
  value: Currency;
  label: string;
  code: string;
  symbol: string;
};

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "EUR", label: "Euro", code: "EUR", symbol: "€" },
  { value: "USD", label: "Dollar américain", code: "USD", symbol: "$" },
  { value: "CAD", label: "Dollar canadien", code: "CAD", symbol: "$" },
  { value: "CNY", label: "Yuan chinois", code: "CNY", symbol: "¥" },
  { value: "GBP", label: "Livre sterling", code: "GBP", symbol: "£" },
];

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

// ---------- Masquer les données sensibles ----------
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const maskedName = name[0] + "***" + name.slice(-1);
  return `${maskedName}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const visible = phone.slice(-4);
  const prefix = phone.slice(0, 3);
  return `${prefix} ** ** ** ${visible.slice(0, 2)} ${visible.slice(2)}`;
}

function maskName(name: string): string {
  if (!name) return "*****";
  const parts = name.split(" ");
  return parts.map(p => p[0] + "****").join(" ");
}

// ---------- Carte "Connexion & sécurité" AMÉLIORÉE ----------
function SecurityTabContent({ t }: { t: AccountTranslations }) {
  const secT = t.securitySection;
  const extT = t.securityExtended || {} as any;
  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [startingIdentity, setStartingIdentity] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // États pour téléphone
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  // États pour mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"email" | "code" | "new">("email");
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Charger le statut et synchroniser si nécessaire
  useEffect(() => {
    const loadAndSyncStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/account/security/status");
        if (!res.ok) return;
        const data = (await res.json()) as IdentityStatusResponse & { phone?: string; phoneVerified?: boolean };
        const currentStatus = data.identityStatus ?? "UNVERIFIED";
        setStatus(currentStatus);
        setLastVerifiedAt(
          data.identityLastVerifiedAt ? data.identityLastVerifiedAt : null
        );
        if (data.phone) {
          setPhone(data.phone);
          setPhoneVerified(data.phoneVerified ?? false);
        }

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

  const handleSendPhoneCode = async () => {
    setSendingCode(true);
    // Simulation - à remplacer par un vrai appel API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSendingCode(false);
    setPhoneStep("verify");
  };

  const handleVerifyPhone = async () => {
    setSendingCode(true);
    // Simulation - à remplacer par un vrai appel API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPhone(phoneInput);
    setPhoneVerified(true);
    setSendingCode(false);
    setShowPhoneModal(false);
    setPhoneStep("input");
    setVerificationCode("");
  };

  const handleSendEmailCode = async () => {
    setUpdatingPassword(true);
    // Simulation - à remplacer par un vrai appel API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUpdatingPassword(false);
    setPasswordStep("code");
  };

  const handleVerifyEmailCode = async () => {
    // Simulation - passer à l'étape nouveau mot de passe
    setPasswordStep("new");
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    setUpdatingPassword(true);
    // Simulation - à remplacer par un vrai appel API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setUpdatingPassword(false);
    setShowPasswordModal(false);
    setPasswordStep("email");
    setEmailCode("");
    setNewPassword("");
    setConfirmPassword("");
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

  // Icon et couleur pour le statut d'identité
  const getStatusIcon = () => {
    if (status === "VERIFIED") return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
    if (status === "PENDING") return <ClockIcon className="h-5 w-5 text-amber-500" />;
    if (status === "REJECTED") return <ExclamationCircleIcon className="h-5 w-5 text-rose-500" />;
    return <ShieldCheckIcon className="h-5 w-5 text-gray-400" />;
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{secT.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{secT.subtitle}</p>
      </div>

      {/* Numéro de téléphone */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <PhoneIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{extT.phoneTitle || "Numéro de téléphone"}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{extT.phoneDesc || "Utilisé pour sécuriser votre compte."}</p>
              {phone ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-700">{maskPhone(phone)}</span>
                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircleIcon className="h-3 w-3" />
                      Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <ClockIcon className="h-3 w-3" />
                      Non vérifié
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400">{extT.phoneNotSet || "Non configuré"}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPhoneModal(true)}
            className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
          >
            {phone ? (extT.changePhone || "Modifier") : (extT.addPhone || "Ajouter")}
          </button>
        </div>
      </div>

      {/* Mot de passe */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <KeyIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{extT.passwordTitle || "Mot de passe"}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{extT.passwordDesc || "Modifiez votre mot de passe."}</p>
              <p className="mt-2 text-sm text-gray-700">••••••••</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
          >
            {extT.changePassword || "Modifier"}
          </button>
        </div>
      </div>

      {/* Vérification d'identité */}
      <div className={`rounded-2xl border bg-white p-6 shadow-sm ${
        status === "VERIFIED" ? "border-emerald-200" :
        status === "REJECTED" ? "border-rose-200" :
        status === "PENDING" ? "border-amber-200" :
        "border-gray-200"
      }`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              status === "VERIFIED" ? "bg-emerald-100" :
              status === "REJECTED" ? "bg-rose-100" :
              status === "PENDING" ? "bg-amber-100" :
              "bg-gray-100"
            }`}>
              {getStatusIcon()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">
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

              <p className="text-xs text-gray-600">{getStatusDescription()}</p>

              {status === "VERIFIED" && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircleIcon className="h-4 w-4" />
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

      {/* Modal Téléphone */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowPhoneModal(false);
                setPhoneStep("input");
                setVerificationCode("");
              }}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {phoneStep === "input" ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">{extT.phoneModalTitle || "Ajouter votre numéro"}</h3>
                <p className="mt-1 text-sm text-gray-500">{extT.phoneModalDesc || "Vous recevrez un code de vérification par SMS."}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{extT.phoneLabel || "Numéro de téléphone"}</label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder={extT.phonePlaceholder || "+33 6 12 34 56 78"}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendPhoneCode}
                    disabled={!phoneInput || sendingCode}
                    className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sendingCode ? (extT.sending || "Envoi...") : (extT.sendCode || "Envoyer le code")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">{extT.verifyModalTitle || "Vérifier votre numéro"}</h3>
                <p className="mt-1 text-sm text-gray-500">{extT.verifyModalDesc || "Entrez le code envoyé au"} {phoneInput}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{extT.codeLabel || "Code de vérification"}</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={extT.codePlaceholder || "123456"}
                      maxLength={6}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    disabled={verificationCode.length !== 6 || sendingCode}
                    className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {sendingCode ? (extT.verifying || "Vérification...") : (extT.verify || "Vérifier")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhoneStep("input")}
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                  >
                    {extT.resendCode || "Renvoyer le code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordStep("email");
                setEmailCode("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900">{extT.passwordModalTitle || "Modifier votre mot de passe"}</h3>

            {passwordStep === "email" && (
              <>
                <p className="mt-1 text-sm text-gray-500">{extT.passwordModalDesc || "Nous allons envoyer un code à votre e-mail."}</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={updatingPassword}
                    className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {updatingPassword ? (extT.sending || "Envoi...") : (extT.sendEmailCode || "Envoyer le code par e-mail")}
                  </button>
                </div>
              </>
            )}

            {passwordStep === "code" && (
              <>
                <p className="mt-1 text-sm text-gray-500">{extT.emailCodeDesc || "Entrez le code reçu par e-mail."}</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{extT.codeLabel || "Code"}</label>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyEmailCode}
                    disabled={emailCode.length !== 6}
                    className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {extT.verify || "Vérifier"}
                  </button>
                </div>
              </>
            )}

            {passwordStep === "new" && (
              <>
                <p className="mt-1 text-sm text-gray-500">Choisissez votre nouveau mot de passe.</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{extT.newPassword || "Nouveau mot de passe"}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={extT.newPasswordPlaceholder || "Votre nouveau mot de passe"}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{extT.confirmPassword || "Confirmer"}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={extT.confirmPasswordPlaceholder || "Confirmez"}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={!newPassword || !confirmPassword || updatingPassword}
                    className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {updatingPassword ? (extT.updating || "Mise à jour...") : (extT.updatePassword || "Mettre à jour")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- Contenu Données personnelles AMÉLIORÉ ----------
function PersonalTabContent({ t }: { t: AccountTranslations }) {
  const pT = t.personal;
  const extT = t.personalExtended || {} as any;

  // Données simulées (à remplacer par des vraies données API)
  const [userData] = useState({
    legalName: "Jean Dupont",
    chosenName: "",
    email: "jean.dupont@gmail.com",
    phone: "+33 6 12 34 74 76",
    phoneVerified: true,
    identityStatus: "VERIFIED" as IdentityStatus,
    residentialAddress: "123 Rue de Paris, 75001 Paris",
    postalAddress: "123 Rue de Paris, 75001 Paris",
    emergencyContact: "Marie Dupont",
  });

  const getIdentityBadge = () => {
    switch (userData.identityStatus) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircleIcon className="h-3 w-3" />
            {extT.verified || "Vérifiée"}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            <ClockIcon className="h-3 w-3" />
            {extT.pending || "En attente"}
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
            <ExclamationCircleIcon className="h-3 w-3" />
            {extT.failed || "Échec"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {extT.notVerified || "Non vérifiée"}
          </span>
        );
    }
  };

  const DataRow = ({
    icon,
    label,
    value,
    maskedValue,
    badge,
    action = "Modifier"
  }: {
    icon: ReactNode;
    label: string;
    value?: string;
    maskedValue?: string;
    badge?: ReactNode;
    action?: string;
  }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-sm text-gray-600">{maskedValue || value || (extT.notProvided || "Non fourni")}</p>
            {badge}
          </div>
        </div>
      </div>
      <button className="text-sm font-medium text-gray-900 underline hover:text-gray-700">
        {value ? action : (extT.add || "Ajouter")}
      </button>
    </div>
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{pT.title}</h1>
        <p className="text-sm text-gray-500">{pT.subtitle}</p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DataRow
          icon={<UserIcon className="h-4 w-4 text-gray-500" />}
          label={extT.legalName || "Nom légal"}
          value={userData.legalName}
          maskedValue={maskName(userData.legalName)}
        />

        <DataRow
          icon={<UserIcon className="h-4 w-4 text-gray-500" />}
          label={extT.chosenName || "Nom choisi"}
          value={userData.chosenName}
        />

        <DataRow
          icon={<EnvelopeIcon className="h-4 w-4 text-gray-500" />}
          label={extT.email || "Adresse courriel"}
          value={userData.email}
          maskedValue={maskEmail(userData.email)}
        />

        <DataRow
          icon={<PhoneIcon className="h-4 w-4 text-gray-500" />}
          label={extT.phoneNumber || "Numéro de téléphone"}
          value={userData.phone}
          maskedValue={maskPhone(userData.phone)}
          badge={userData.phoneVerified && (
            <span className="text-xs text-gray-400">{extT.phoneVerification || "Vérifié"}</span>
          )}
        />

        <DataRow
          icon={<ShieldCheckIcon className="h-4 w-4 text-gray-500" />}
          label={extT.identityVerification || "Vérification de l'identité"}
          badge={getIdentityBadge()}
          value="verified"
        />

        <DataRow
          icon={<HomeIcon className="h-4 w-4 text-gray-500" />}
          label={extT.residentialAddress || "Adresse résidentielle"}
          value={userData.residentialAddress}
          maskedValue={extT.provided || "Fournie"}
        />

        <DataRow
          icon={<MapPinIcon className="h-4 w-4 text-gray-500" />}
          label={extT.postalAddress || "Adresse postale"}
          value={userData.postalAddress}
          maskedValue={extT.provided || "Fournie"}
        />

        <DataRow
          icon={<UserGroupIcon className="h-4 w-4 text-gray-500" />}
          label={extT.emergencyContact || "Contact en cas d'urgence"}
          value={userData.emergencyContact}
          maskedValue={maskName(userData.emergencyContact)}
        />
      </div>
    </section>
  );
}

// ---------- Contenu Notifications style Airbnb ----------
function NotificationsTabContent({ t }: { t: AccountTranslations }) {
  const nT = t.notificationsSection || {} as any;
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);
  const [saved, setSaved] = useState(false);

  type NotificationPref = "email" | "sms" | "push" | "none";

  const [prefs, setPrefs] = useState<Record<string, NotificationPref>>({
    rewardsAchievements: "email",
    tipsAndTricks: "email",
    priceTrends: "email",
    hostBenefits: "email",
    newsAndUpdates: "email",
    localLaws: "email",
    inspirationOffers: "email",
    tripPlanning: "email",
    newsAndPrograms: "email",
    remarks: "email",
    travelRegulations: "email",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const NotificationRow = ({ id, label }: { id: string; label: string }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {prefs[id] === "email" ? (nT.selectedEmail || "Courriels") :
           prefs[id] === "sms" ? (nT.selectedSms || "SMS") :
           prefs[id] === "push" ? (nT.selectedPush || "Push") : "Désactivé"}
        </span>
        <button className="text-xs font-medium text-gray-900 underline hover:text-gray-700">
          {nT.modify || "Modifier"}
        </button>
      </div>
    </div>
  );

  const NotificationSection = ({
    title,
    description,
    items
  }: {
    title: string;
    description: string;
    items: { id: string; label: string }[];
  }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-4 divide-y divide-gray-100">
        {items.map(item => (
          <NotificationRow key={item.id} id={item.id} label={item.label} />
        ))}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{nT.title || "Notifications"}</h1>
        <p className="text-sm text-gray-500">{nT.subtitle || "Gérez vos préférences de notification"}</p>
      </header>

      <NotificationSection
        title={nT.hostInfoTitle || "Informations pour les hôtes"}
        description={nT.hostInfoDesc || "Découvrez les meilleures pratiques d'accueil."}
        items={[
          { id: "rewardsAchievements", label: nT.rewardsAchievements || "Récompenses et réalisations" },
          { id: "tipsAndTricks", label: nT.tipsAndTricks || "Conseils et astuces" },
          { id: "priceTrends", label: nT.priceTrends || "Tendances de prix" },
          { id: "hostBenefits", label: nT.hostBenefits || "Avantages pour les hôtes" },
        ]}
      />

      <NotificationSection
        title={nT.hostingUpdatesTitle || "Mises à jour sur l'accueil"}
        description={nT.hostingUpdatesDesc || "Mises à jour sur les programmes et fonctionnalités."}
        items={[
          { id: "newsAndUpdates", label: nT.newsAndUpdates || "Actualités" },
          { id: "localLaws", label: nT.localLaws || "Lois et réglementations" },
        ]}
      />

      <NotificationSection
        title={nT.travelTipsTitle || "Conseils de voyage"}
        description={nT.travelTipsDesc || "Inspiration pour votre prochain voyage."}
        items={[
          { id: "inspirationOffers", label: nT.inspirationOffers || "Inspirations et offres" },
          { id: "tripPlanning", label: nT.tripPlanning || "Planification" },
        ]}
      />

      <NotificationSection
        title={nT.lokroomUpdatesTitle || "Mises à jour Lok'Room"}
        description={nT.lokroomUpdatesDesc || "Dernières nouvelles de Lok'Room."}
        items={[
          { id: "newsAndPrograms", label: nT.newsAndPrograms || "Actualités et programmes" },
          { id: "remarks", label: nT.remarks || "Remarques" },
          { id: "travelRegulations", label: nT.travelRegulations || "Réglementation voyage" },
        ]}
      />

      {/* Désabonner de tout */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={unsubscribeAll}
            onChange={(e) => setUnsubscribeAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm text-gray-700">{nT.unsubscribeAll || "Se désabonner de tous les courriels promotionnels"}</span>
        </label>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black transition"
        >
          {nT.savePreferences || "Enregistrer les préférences"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" />
            {nT.preferencesSaved || "Préférences enregistrées !"}
          </span>
        )}
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

// ---------- Contenu Langue & Devise (avec rechargement page) ----------
function LanguageTabContent({ t }: { t: AccountTranslations }) {
  const [lang, setLang] = useState<SupportedLang>("fr");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [saved, setSaved] = useState(false);

  // Lecture des cookies au montage
  useEffect(() => {
    const cookieStr = document.cookie;
    const langMatch = cookieStr.match(/(?:^|;\s*)locale=([^;]+)/);
    const curLang = (langMatch?.[1] as SupportedLang | undefined) || "fr";
    if (SUPPORTED_LANGS.includes(curLang)) {
      setLang(curLang);
    }

    const curMatch = cookieStr.match(/(?:^|;\s*)currency=([^;]+)/);
    const cur = (curMatch?.[1] as Currency | undefined) || "EUR";
    setCurrency(cur);
  }, []);

  function handleSave() {
    document.cookie = `locale=${lang}; Path=/; Max-Age=${ONE_YEAR}`;
    document.cookie = `currency=${currency}; Path=/; Max-Age=${ONE_YEAR}`;
    setSaved(true);

    // Recharger la page après un court délai pour appliquer les changements
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.languageSection?.title || "Langue et devise"}</h1>
        <p className="text-sm text-gray-500">{t.languageSection?.subtitle || "Choisissez votre langue et devise préférées"}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Langues */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t.languageSection?.languagesTitle || "Langue"}
          </h2>
          <div className="space-y-2">
            {SUPPORTED_LANGS.map((code) => {
              const meta = LANG_LABELS[code];
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="font-medium">{meta.label}</span>
                  <span className={active ? "opacity-80" : "text-gray-400"}>
                    {meta.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Devises */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t.languageSection?.currenciesTitle || "Devise"}
          </h2>
          <div className="space-y-2">
            {CURRENCY_OPTIONS.map((opt) => {
              const active = currency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCurrency(opt.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="font-medium">
                    {opt.label} ({opt.symbol})
                  </span>
                  <span className={active ? "opacity-80" : "text-gray-400"}>
                    {opt.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black transition"
        >
          {t.languageSection?.save || "Enregistrer les préférences"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" />
            {t.languageSection?.saved || "Préférences enregistrées !"}
          </span>
        )}
      </div>
    </section>
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
      return <PersonalTabContent t={t} />;

    case "security":
      return <SecurityTabContent t={t} />;

    case "notifications":
      return <NotificationsTabContent t={t} />;

    case "taxes":
      return <TaxesTabContent t={t} />;

    case "payments":
      return (
        <section className="space-y-6">
          <PaymentsPage />
        </section>
      );

    case "language":
      return <LanguageTabContent t={t} />;

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
      {/* Sidebar desktop */}
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

      {/* Mobile dropdown */}
      <div className="md:hidden w-full">
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

        <TabContent active={activeTab} t={t} tabLabels={tabLabels} />
      </div>

      {/* Content desktop */}
      <section className="hidden md:block flex-1">
        <TabContent active={activeTab} t={t} tabLabels={tabLabels} />
      </section>
    </main>
  );
}
