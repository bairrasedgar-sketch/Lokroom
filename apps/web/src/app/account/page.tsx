"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentsPage from "./payments/page";
import useTranslation from "@/hooks/useTranslation";
import { SUPPORTED_LANGS, type SupportedLang } from "@/locales";
import type { Currency } from "@/lib/currency";
import PasswordInput, { validatePassword } from "@/components/PasswordInput";

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
  LanguageIcon,
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
  | "language"
  | "translation";

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
  translation: "text-gray-500",
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
function SecurityTabContent({ t, router }: { t: AccountTranslations; router: ReturnType<typeof useRouter> }) {
  const secT = t.securitySection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Charger le statut et synchroniser si nécessaire
  useEffect(() => {
    const controller = new AbortController();
    const loadAndSyncStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/account/security/status", { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as IdentityStatusResponse & { phone?: string; phoneVerified?: boolean; email?: string };
        const currentStatus = data.identityStatus ?? "UNVERIFIED";
        setStatus(currentStatus);
        setLastVerifiedAt(
          data.identityLastVerifiedAt ? data.identityLastVerifiedAt : null
        );
        if (data.phone) {
          setPhone(data.phone);
          setPhoneVerified(data.phoneVerified ?? false);
        }
        if (data.email) {
          setUserEmail(data.email);
        }

        // Si le statut est PENDING, essayer de synchroniser avec Stripe
        if (currentStatus === "PENDING") {
          setSyncing(true);
          try {
            const syncRes = await fetch("/api/account/security/refresh-identity", {
              method: "POST",
              signal: controller.signal,
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
            if ((e as Error).name !== 'AbortError') {
              console.error("Erreur sync status:", e);
            }
          } finally {
            setSyncing(false);
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error("Erreur chargement statut identité:", e);
        }
      } finally {
        setLoadingStatus(false);
      }
    };

    void loadAndSyncStatus();
    return () => controller.abort();
  }, []);

  const handleStartIdentity = useCallback(async () => {
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
        router.push(data.url);
      } else {
        setStartingIdentity(false);
      }
    } catch (e) {
      console.error("Erreur Identity:", e);
      setStartingIdentity(false);
    }
  }, [router]);

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
    if (!userEmail) {
      setPasswordError("Email non disponible");
      return;
    }
    setUpdatingPassword(true);
    setPasswordError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordStep("code");
      } else {
        setPasswordError(data.error || "Erreur lors de l'envoi du code");
      }
    } catch (e) {
      console.error("Erreur envoi code:", e);
      setPasswordError("Erreur réseau");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    // Passer à l'étape nouveau mot de passe (la vérification se fait au moment de la mise à jour)
    setPasswordStep("new");
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    if (!userEmail) {
      setPasswordError("Email non disponible");
      return;
    }
    setUpdatingPassword(true);
    setPasswordError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          code: emailCode,
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPasswordModal(false);
        setPasswordStep("email");
        setEmailCode("");
        setNewPassword("");
        setConfirmPassword("");
        alert("Mot de passe mis à jour avec succès !");
      } else {
        setPasswordError(data.error || "Erreur lors de la mise à jour");
      }
    } catch (e) {
      console.error("Erreur mise à jour mot de passe:", e);
      setPasswordError("Erreur réseau");
    } finally {
      setUpdatingPassword(false);
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

          <div className="flex shrink-0 flex-col items-end gap-2">
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

            {/* Bouton de synchronisation manuelle pour PENDING */}
            {status === "PENDING" && !syncing && (
              <button
                type="button"
                onClick={async () => {
                  setSyncing(true);
                  try {
                    const syncRes = await fetch("/api/account/security/refresh-identity", {
                      method: "POST",
                    });
                    if (syncRes.ok) {
                      const syncData = await syncRes.json();
                      if (syncData.identityStatus) {
                        setStatus(syncData.identityStatus);
                        if (syncData.identityLastVerifiedAt) {
                          setLastVerifiedAt(syncData.identityLastVerifiedAt);
                        }
                      }
                    }
                  } catch (e) {
                    console.error("Erreur sync:", e);
                  } finally {
                    setSyncing(false);
                  }
                }}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                {secT.refreshStatus || "Actualiser le statut"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Téléphone */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="phone-modal-title">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowPhoneModal(false);
                setPhoneStep("input");
                setVerificationCode("");
              }}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Fermer la modale"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {phoneStep === "input" ? (
              <>
                <h3 id="phone-modal-title" className="text-lg font-semibold text-gray-900">{extT.phoneModalTitle || "Ajouter votre numéro"}</h3>
                <p className="mt-1 text-sm text-gray-500">{extT.phoneModalDesc || "Vous recevrez un code de vérification par SMS."}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700">{extT.phoneLabel || "Numéro de téléphone"}</label>
                    <input
                      id="phone-input"
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => {
                        // N'accepter que les chiffres et le + (pour l'indicatif international)
                        const value = e.target.value.replace(/[^0-9+]/g, '');
                        // Le + ne peut être qu'au début
                        const sanitized = value.charAt(0) === '+'
                          ? '+' + value.slice(1).replace(/\+/g, '')
                          : value.replace(/\+/g, '');
                        setPhoneInput(sanitized);
                      }}
                      onKeyDown={(e) => {
                        // Bloquer les lettres et caractères spéciaux (sauf + au début)
                        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                        if (allowedKeys.includes(e.key)) return;
                        if (e.key === '+' && e.currentTarget.selectionStart === 0 && !phoneInput.includes('+')) return;
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder={extT.phonePlaceholder || "+33 6 12 34 56 78"}
                      aria-label="Numéro de téléphone"
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
                <h3 id="phone-modal-title" className="text-lg font-semibold text-gray-900">{extT.verifyModalTitle || "Vérifier votre numéro"}</h3>
                <p className="mt-1 text-sm text-gray-500">{extT.verifyModalDesc || "Entrez le code envoyé au"} {phoneInput}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">{extT.codeLabel || "Code de vérification"}</label>
                    <input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={extT.codePlaceholder || "123456"}
                      maxLength={6}
                      aria-label="Code de vérification"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
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
              aria-label="Fermer la modale"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 id="password-modal-title" className="text-lg font-semibold text-gray-900">{extT.passwordModalTitle || "Modifier votre mot de passe"}</h3>

            {passwordError && (
              <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {passwordError}
              </div>
            )}

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
                    <label htmlFor="email-code" className="block text-sm font-medium text-gray-700">{extT.codeLabel || "Code"}</label>
                    <input
                      id="email-code"
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      aria-label="Code de vérification par e-mail"
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
                  <PasswordInput
                    value={newPassword}
                    onChange={setNewPassword}
                    label={extT.newPassword || "Nouveau mot de passe"}
                    placeholder={extT.newPasswordPlaceholder || "Votre nouveau mot de passe"}
                    showValidation={true}
                    confirmValue={confirmPassword}
                    confirmLabel={extT.confirmPassword || "Confirmer le mot de passe"}
                    onConfirmChange={setConfirmPassword}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || !validatePassword(newPassword).isValid || updatingPassword}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extT = t.personalExtended || {} as any;

  // Données réelles chargées depuis l'API
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    legalName: "",
    firstName: "",
    lastName: "",
    chosenName: "",
    email: "",
    phone: "",
    phoneVerified: false,
    identityStatus: "UNVERIFIED" as IdentityStatus,
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
    province: "",
    // Adresse postale
    postalAddressLine1: "",
    postalAddressLine2: "",
    postalAddressCity: "",
    postalAddressPostalCode: "",
    postalAddressCountry: "",
    postalAddressProvince: "",
    postalAddressSameAsResidential: true,
    // Contact d'urgence
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  // États d'édition
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  // Charger les données depuis l'API
  useEffect(() => {
    const controller = new AbortController();
    const fetchProfile = async () => {
      try {
        // Charger le profil et le statut d'identité en parallèle
        const [profileRes, identityRes] = await Promise.all([
          fetch("/api/profile", { cache: "no-store", signal: controller.signal }),
          fetch("/api/account/security/status", { cache: "no-store", signal: controller.signal }),
        ]);

        let identityStatus: IdentityStatus = "UNVERIFIED";
        if (identityRes.ok) {
          const identityData = await identityRes.json();
          identityStatus = identityData.identityStatus ?? "UNVERIFIED";
        }

        if (!profileRes.ok) {
          setLoading(false);
          return;
        }
        const data = await profileRes.json();
        const user = data.user;
        const profile = user?.profile || {};

        setUserData({
          legalName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || user?.name || "",
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          chosenName: user?.name || "",
          email: user?.email || "",
          phone: profile.phone || "",
          phoneVerified: false,
          identityStatus: user?.identityStatus || identityStatus,
          addressLine1: profile.addressLine1 || "",
          addressLine2: profile.addressLine2 || "",
          city: profile.city || "",
          postalCode: profile.postalCode || "",
          country: profile.country || "",
          province: profile.province || "",
          // Adresse postale
          postalAddressLine1: profile.postalAddressLine1 || "",
          postalAddressLine2: profile.postalAddressLine2 || "",
          postalAddressCity: profile.postalAddressCity || "",
          postalAddressPostalCode: profile.postalAddressPostalCode || "",
          postalAddressCountry: profile.postalAddressCountry || "",
          postalAddressProvince: profile.postalAddressProvince || "",
          postalAddressSameAsResidential: profile.postalAddressSameAsResidential ?? true,
          // Contact d'urgence
          emergencyContactName: profile.emergencyContactName || "",
          emergencyContactPhone: profile.emergencyContactPhone || "",
          emergencyContactRelation: profile.emergencyContactRelation || "",
        });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error("Erreur chargement profil:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
    return () => controller.abort();
  }, []);

  const startEditing = (field: string, currentValue: string | boolean) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field: string) => {
    setSaving(true);
    try {
      const payload: Record<string, string | boolean> = {};

      // Mapper les champs au format API
      switch (field) {
        case "legalName": {
          // Utiliser firstName et lastName directement depuis editValues
          payload.firstName = (editValues.firstName as string) ?? userData.firstName ?? "";
          payload.lastName = (editValues.lastName as string) ?? userData.lastName ?? "";
          break;
        }
        case "chosenName":
          payload.name = (editValues.chosenName as string) ?? (editValues[field] as string) ?? "";
          break;
        case "phone":
          payload.phone = (editValues.phone as string) ?? (editValues[field] as string) ?? "";
          break;
        case "address":
          payload.addressLine1 = (editValues.addressLine1 as string) || "";
          payload.addressLine2 = (editValues.addressLine2 as string) || "";
          payload.city = (editValues.city as string) || "";
          payload.postalCode = (editValues.postalCode as string) || "";
          payload.country = (editValues.country as string) || "";
          payload.province = (editValues.province as string) || "";
          break;
        case "postalAddress":
          payload.postalAddressLine1 = (editValues.postalAddressLine1 as string) || "";
          payload.postalAddressLine2 = (editValues.postalAddressLine2 as string) || "";
          payload.postalAddressCity = (editValues.postalAddressCity as string) || "";
          payload.postalAddressPostalCode = (editValues.postalAddressPostalCode as string) || "";
          payload.postalAddressCountry = (editValues.postalAddressCountry as string) || "";
          payload.postalAddressProvince = (editValues.postalAddressProvince as string) || "";
          payload.postalAddressSameAsResidential = editValues.postalAddressSameAsResidential as boolean ?? false;
          break;
        case "emergencyContact":
          payload.emergencyContactName = (editValues.emergencyContactName as string) || "";
          payload.emergencyContactPhone = (editValues.emergencyContactPhone as string) || "";
          payload.emergencyContactRelation = (editValues.emergencyContactRelation as string) || "";
          break;
        default:
          break;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Mettre à jour l'état local
        setUserData((prev) => {
          const updated = { ...prev };
          if (field === "legalName") {
            updated.firstName = (editValues.firstName as string) ?? prev.firstName;
            updated.lastName = (editValues.lastName as string) ?? prev.lastName;
            updated.legalName = `${updated.firstName} ${updated.lastName}`.trim();
          } else if (field === "chosenName") {
            updated.chosenName = (editValues.chosenName as string) ?? (editValues[field] as string) ?? "";
          } else if (field === "phone") {
            updated.phone = (editValues.phone as string) ?? (editValues[field] as string) ?? "";
          } else if (field === "address") {
            updated.addressLine1 = (editValues.addressLine1 as string) || "";
            updated.addressLine2 = (editValues.addressLine2 as string) || "";
            updated.city = (editValues.city as string) || "";
            updated.postalCode = (editValues.postalCode as string) || "";
            updated.country = (editValues.country as string) || "";
            updated.province = (editValues.province as string) || "";
          } else if (field === "postalAddress") {
            updated.postalAddressLine1 = (editValues.postalAddressLine1 as string) || "";
            updated.postalAddressLine2 = (editValues.postalAddressLine2 as string) || "";
            updated.postalAddressCity = (editValues.postalAddressCity as string) || "";
            updated.postalAddressPostalCode = (editValues.postalAddressPostalCode as string) || "";
            updated.postalAddressCountry = (editValues.postalAddressCountry as string) || "";
            updated.postalAddressProvince = (editValues.postalAddressProvince as string) || "";
            updated.postalAddressSameAsResidential = editValues.postalAddressSameAsResidential as boolean ?? false;
          } else if (field === "emergencyContact") {
            updated.emergencyContactName = (editValues.emergencyContactName as string) || "";
            updated.emergencyContactPhone = (editValues.emergencyContactPhone as string) || "";
            updated.emergencyContactRelation = (editValues.emergencyContactRelation as string) || "";
          }
          return updated;
        });
        setEditingField(null);
        setEditValues({});
      }
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
    } finally {
      setSaving(false);
    }
  };

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

  const residentialAddress = userData.addressLine1
    ? `${userData.addressLine1}${userData.city ? `, ${userData.city}` : ""}${userData.postalCode ? ` ${userData.postalCode}` : ""}${userData.country ? `, ${userData.country}` : ""}`
    : "";

  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">{pT.title}</h1>
          <p className="text-sm text-gray-500">{pT.subtitle}</p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{pT.title}</h1>
        <p className="text-sm text-gray-500">{pT.subtitle}</p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Nom légal */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <UserIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.legalName || "Nom légal"}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {userData.legalName ? maskName(userData.legalName) : (extT.notProvided || "Non fourni")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startEditing("legalName", userData.legalName)}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {userData.legalName ? (extT.modify || "Modifier") : (extT.add || "Ajouter")}
            </button>
          </div>
          {editingField === "legalName" && (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={(editValues.firstName as string) ?? userData.firstName}
                  onChange={(e) => setEditValues({ ...editValues, firstName: e.target.value, legalName: `${e.target.value} ${(editValues.lastName as string) ?? userData.lastName}`.trim() })}
                  placeholder={extT.firstNamePlaceholder || "Prénom"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
                <input
                  type="text"
                  value={(editValues.lastName as string) ?? userData.lastName}
                  onChange={(e) => setEditValues({ ...editValues, lastName: e.target.value, legalName: `${(editValues.firstName as string) ?? userData.firstName} ${e.target.value}`.trim() })}
                  placeholder={extT.lastNamePlaceholder || "Nom"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveField("legalName")}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "..." : (extT.save || "Enregistrer")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {extT.cancel || "Annuler"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nom choisi */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <UserIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.chosenName || "Nom choisi"}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {userData.chosenName || (extT.notProvided || "Non fourni")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startEditing("chosenName", userData.chosenName)}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {userData.chosenName ? (extT.modify || "Modifier") : (extT.add || "Ajouter")}
            </button>
          </div>
          {editingField === "chosenName" && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={(editValues.chosenName as string) ?? userData.chosenName}
                onChange={(e) => setEditValues({ ...editValues, chosenName: e.target.value })}
                placeholder={extT.displayNamePlaceholder || "Nom d'affichage"}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveField("chosenName")}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "..." : (extT.save || "Enregistrer")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {extT.cancel || "Annuler"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email (non modifiable directement) */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <EnvelopeIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.email || "Adresse courriel"}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {userData.email ? maskEmail(userData.email) : (extT.notProvided || "Non fourni")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/messages?support=true&autoMessage=changement%20d%27adresse%20mail";
              }}
              className="text-xs font-medium text-gray-700 hover:text-gray-900 hover:underline"
            >
              {extT.contactSupport || "Contacter le support"}
            </button>
          </div>
        </div>

        {/* Téléphone */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <PhoneIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.phoneNumber || "Numéro de téléphone"}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    {userData.phone ? maskPhone(userData.phone) : (extT.notProvided || "Non fourni")}
                  </p>
                  {userData.phoneVerified && (
                    <span className="text-xs text-gray-400">{extT.phoneVerification || "Vérifié"}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startEditing("phone", userData.phone)}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {userData.phone ? (extT.modify || "Modifier") : (extT.add || "Ajouter")}
            </button>
          </div>
          {editingField === "phone" && (
            <div className="mt-4 space-y-3">
              <input
                type="tel"
                value={(editValues.phone as string) ?? userData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9+]/g, '');
                  const sanitized = value.charAt(0) === '+' ? '+' + value.slice(1).replace(/\+/g, '') : value.replace(/\+/g, '');
                  setEditValues({ ...editValues, phone: sanitized });
                }}
                placeholder="+33 6 12 34 56 78"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveField("phone")}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "..." : (extT.save || "Enregistrer")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {extT.cancel || "Annuler"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vérification d'identité */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <ShieldCheckIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.identityVerification || "Vérification de l'identité"}</p>
                <div className="mt-0.5">{getIdentityBadge()}</div>
              </div>
            </div>
            <a
              href="/account?tab=security"
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {extT.goToSecurity || "Gérer"}
            </a>
          </div>
        </div>

        {/* Adresse résidentielle */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <HomeIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.residentialAddress || "Adresse résidentielle"}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {residentialAddress ? (extT.provided || "Fournie") : (extT.notProvided || "Non fourni")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingField("address");
                setEditValues({
                  addressLine1: userData.addressLine1,
                  addressLine2: userData.addressLine2,
                  city: userData.city,
                  postalCode: userData.postalCode,
                  country: userData.country,
                  province: userData.province,
                });
              }}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {residentialAddress ? (extT.modify || "Modifier") : (extT.add || "Ajouter")}
            </button>
          </div>
          {editingField === "address" && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={(editValues.addressLine1 as string) ?? ""}
                onChange={(e) => setEditValues({ ...editValues, addressLine1: e.target.value })}
                placeholder={extT.streetPlaceholder || "Numéro et rue"}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <input
                type="text"
                value={(editValues.addressLine2 as string) ?? ""}
                onChange={(e) => setEditValues({ ...editValues, addressLine2: e.target.value })}
                placeholder={extT.addressLine2Placeholder || "Complément (optionnel)"}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={(editValues.postalCode as string) ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, postalCode: e.target.value })}
                  placeholder={extT.postalCodePlaceholder || "Code postal"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
                <input
                  type="text"
                  value={(editValues.city as string) ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
                  placeholder={extT.cityPlaceholder || "Ville"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={(editValues.country as string) ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, country: e.target.value })}
                  placeholder={extT.countryPlaceholder || "Pays"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
                <input
                  type="text"
                  value={(editValues.province as string) ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, province: e.target.value })}
                  placeholder={extT.provincePlaceholder || "Province/Région"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveField("address")}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "..." : (extT.save || "Enregistrer")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {extT.cancel || "Annuler"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Adresse postale */}
        <div className="border-b border-gray-100 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <MapPinIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.postalAddress || "Adresse postale"}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {userData.postalAddressSameAsResidential
                    ? (extT.sameAsResidential || "Identique à l'adresse résidentielle")
                    : userData.postalAddressLine1
                      ? `${userData.postalAddressLine1}${userData.postalAddressCity ? `, ${userData.postalAddressCity}` : ""}`
                      : (extT.notProvided || "Non fourni")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingField("postalAddress");
                setEditValues({
                  postalAddressLine1: userData.postalAddressLine1,
                  postalAddressLine2: userData.postalAddressLine2,
                  postalAddressCity: userData.postalAddressCity,
                  postalAddressPostalCode: userData.postalAddressPostalCode,
                  postalAddressCountry: userData.postalAddressCountry,
                  postalAddressProvince: userData.postalAddressProvince,
                  postalAddressSameAsResidential: userData.postalAddressSameAsResidential,
                });
              }}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {userData.postalAddressLine1 || !userData.postalAddressSameAsResidential ? (extT.modify || "Modifier") : (extT.add || "Ajouter")}
            </button>
          </div>
          {editingField === "postalAddress" && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editValues.postalAddressSameAsResidential as boolean ?? userData.postalAddressSameAsResidential}
                  onChange={(e) => setEditValues({ ...editValues, postalAddressSameAsResidential: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">{extT.sameAsResidential || "Identique à l'adresse résidentielle"}</span>
              </label>
              {!(editValues.postalAddressSameAsResidential as boolean ?? userData.postalAddressSameAsResidential) && (
                <>
                  <input
                    type="text"
                    value={(editValues.postalAddressLine1 as string) ?? ""}
                    onChange={(e) => setEditValues({ ...editValues, postalAddressLine1: e.target.value })}
                    placeholder={extT.streetPlaceholder || "Numéro et rue"}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={(editValues.postalAddressLine2 as string) ?? ""}
                    onChange={(e) => setEditValues({ ...editValues, postalAddressLine2: e.target.value })}
                    placeholder={extT.addressLine2Placeholder || "Complément (optionnel)"}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={(editValues.postalAddressPostalCode as string) ?? ""}
                      onChange={(e) => setEditValues({ ...editValues, postalAddressPostalCode: e.target.value })}
                      placeholder={extT.postalCodePlaceholder || "Code postal"}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={(editValues.postalAddressCity as string) ?? ""}
                      onChange={(e) => setEditValues({ ...editValues, postalAddressCity: e.target.value })}
                      placeholder={extT.cityPlaceholder || "Ville"}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={(editValues.postalAddressCountry as string) ?? ""}
                      onChange={(e) => setEditValues({ ...editValues, postalAddressCountry: e.target.value })}
                      placeholder={extT.countryPlaceholder || "Pays"}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={(editValues.postalAddressProvince as string) ?? ""}
                      onChange={(e) => setEditValues({ ...editValues, postalAddressProvince: e.target.value })}
                      placeholder={extT.provincePlaceholder || "Province/Région"}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveField("postalAddress")}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "..." : (extT.save || "Enregistrer")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {extT.cancel || "Annuler"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contact d'urgence */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <UserGroupIcon className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{extT.emergencyContact || "Contact en cas d'urgence"}</p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {userData.emergencyContactName
                    ? `${maskName(userData.emergencyContactName)}${userData.emergencyContactRelation ? ` (${userData.emergencyContactRelation})` : ""}`
                    : (extT.notProvided || "Non fourni")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingField("emergencyContact");
                setEditValues({
                  emergencyContactName: userData.emergencyContactName,
                  emergencyContactPhone: userData.emergencyContactPhone,
                  emergencyContactRelation: userData.emergencyContactRelation,
                });
              }}
              className="text-sm font-medium text-gray-900 underline hover:text-gray-700"
            >
              {userData.emergencyContactName ? (extT.modify || "Modifier") : (extT.add || "Ajouter")}
            </button>
          </div>
          {editingField === "emergencyContact" && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={(editValues.emergencyContactName as string) ?? ""}
                onChange={(e) => setEditValues({ ...editValues, emergencyContactName: e.target.value })}
                placeholder="Nom complet"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="tel"
                  value={(editValues.emergencyContactPhone as string) ?? ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9+]/g, '');
                    const sanitized = value.charAt(0) === '+' ? '+' + value.slice(1).replace(/\+/g, '') : value.replace(/\+/g, '');
                    setEditValues({ ...editValues, emergencyContactPhone: sanitized });
                  }}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                />
                <select
                  value={(editValues.emergencyContactRelation as string) ?? ""}
                  onChange={(e) => setEditValues({ ...editValues, emergencyContactRelation: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="">Relation</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Conjoint(e)</option>
                  <option value="sibling">Frère/Sœur</option>
                  <option value="child">Enfant</option>
                  <option value="friend">Ami(e)</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveField("emergencyContact")}
                  disabled={saving}
                  className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "..." : (extT.save || "Enregistrer")}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {extT.cancel || "Annuler"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Contenu Confidentialité ----------
function PrivacyTabContent({ t }: { t: AccountTranslations }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const privT = (t as any).privacySection || {};
  const [saved, setSaved] = useState(false);

  // États des paramètres de confidentialité
  const [settings, setSettings] = useState({
    showProfileToGuests: true,
    showProfileToHosts: true,
    shareActivityWithPartners: false,
    allowSearchEngines: false,
    showReviewsPublicly: true,
    shareLocationData: false,
    allowPersonalizedAds: false,
    shareDataForResearch: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const PrivacyToggle = ({
    id,
    title,
    description,
    checked,
    onChange,
  }: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
          checked ? "bg-gray-900" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{privT.title || "Confidentialité et partage"}</h1>
        <p className="text-sm text-gray-500">{privT.subtitle || "Gérez vos paramètres de confidentialité et de partage de données"}</p>
      </header>

      {/* Visibilité du profil */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">{privT.profileVisibilityTitle || "Visibilité du profil"}</h3>
        <p className="mt-1 text-sm text-gray-500">{privT.profileVisibilityDesc || "Contrôlez qui peut voir votre profil et vos informations"}</p>
        <div className="mt-4 divide-y divide-gray-100">
          <PrivacyToggle
            id="showProfileToGuests"
            title={privT.showToGuests || "Afficher mon profil aux voyageurs"}
            description={privT.showToGuestsDesc || "Les voyageurs peuvent voir votre profil lorsqu'ils consultent vos annonces"}
            checked={settings.showProfileToGuests}
            onChange={() => handleToggle("showProfileToGuests")}
          />
          <PrivacyToggle
            id="showProfileToHosts"
            title={privT.showToHosts || "Afficher mon profil aux hôtes"}
            description={privT.showToHostsDesc || "Les hôtes peuvent voir votre profil lorsque vous faites une demande de réservation"}
            checked={settings.showProfileToHosts}
            onChange={() => handleToggle("showProfileToHosts")}
          />
          <PrivacyToggle
            id="showReviewsPublicly"
            title={privT.showReviews || "Afficher mes avis publiquement"}
            description={privT.showReviewsDesc || "Vos avis seront visibles sur votre profil public"}
            checked={settings.showReviewsPublicly}
            onChange={() => handleToggle("showReviewsPublicly")}
          />
          <PrivacyToggle
            id="allowSearchEngines"
            title={privT.allowSearchEngines || "Autoriser l'indexation par les moteurs de recherche"}
            description={privT.allowSearchEnginesDesc || "Votre profil peut apparaître dans les résultats de recherche Google, Bing, etc."}
            checked={settings.allowSearchEngines}
            onChange={() => handleToggle("allowSearchEngines")}
          />
        </div>
      </div>

      {/* Partage de données */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">{privT.dataSharingTitle || "Partage de données"}</h3>
        <p className="mt-1 text-sm text-gray-500">{privT.dataSharingDesc || "Contrôlez comment vos données sont partagées"}</p>
        <div className="mt-4 divide-y divide-gray-100">
          <PrivacyToggle
            id="shareActivityWithPartners"
            title={privT.shareWithPartners || "Partager mon activité avec les partenaires"}
            description={privT.shareWithPartnersDesc || "Permet à nos partenaires de vous proposer des services personnalisés"}
            checked={settings.shareActivityWithPartners}
            onChange={() => handleToggle("shareActivityWithPartners")}
          />
          <PrivacyToggle
            id="shareLocationData"
            title={privT.shareLocation || "Partager mes données de localisation"}
            description={privT.shareLocationDesc || "Utilisé pour améliorer les recommandations et la recherche"}
            checked={settings.shareLocationData}
            onChange={() => handleToggle("shareLocationData")}
          />
          <PrivacyToggle
            id="shareDataForResearch"
            title={privT.shareForResearch || "Participer à la recherche"}
            description={privT.shareForResearchDesc || "Vos données anonymisées peuvent être utilisées pour améliorer nos services"}
            checked={settings.shareDataForResearch}
            onChange={() => handleToggle("shareDataForResearch")}
          />
        </div>
      </div>

      {/* Publicité */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">{privT.advertisingTitle || "Publicité"}</h3>
        <p className="mt-1 text-sm text-gray-500">{privT.advertisingDesc || "Gérez vos préférences publicitaires"}</p>
        <div className="mt-4 divide-y divide-gray-100">
          <PrivacyToggle
            id="allowPersonalizedAds"
            title={privT.personalizedAds || "Publicités personnalisées"}
            description={privT.personalizedAdsDesc || "Recevoir des publicités basées sur votre activité sur Lok'Room"}
            checked={settings.allowPersonalizedAds}
            onChange={() => handleToggle("allowPersonalizedAds")}
          />
        </div>
      </div>

      {/* Télécharger / Supprimer données */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">{privT.yourDataTitle || "Vos données"}</h3>
        <p className="mt-1 text-sm text-gray-500">{privT.yourDataDesc || "Gérez vos données personnelles"}</p>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{privT.downloadData || "Télécharger mes données"}</p>
                <p className="mt-0.5 text-xs text-gray-500">{privT.downloadDataDesc || "Obtenez une copie de toutes vos données personnelles"}</p>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700 hover:bg-red-100 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{privT.deleteAccount || "Supprimer mon compte"}</p>
                <p className="mt-0.5 text-xs text-red-600">{privT.deleteAccountDesc || "Cette action est irréversible"}</p>
              </div>
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black transition"
        >
          {privT.savePreferences || "Enregistrer les préférences"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" />
            {privT.preferencesSaved || "Préférences enregistrées !"}
          </span>
        )}
      </div>
    </section>
  );
}

// ---------- Contenu Notifications style Airbnb ----------
function NotificationsTabContent({ t }: { t: AccountTranslations }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nT = t.notificationsSection || {} as any;
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);
  const [saved, setSaved] = useState(false);

  type NotificationPref = "email" | "sms" | "push" | "none";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="tax-modal-title">
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
              <h2 id="tax-modal-title" className="text-2xl font-semibold text-gray-900">
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
function LanguageTabContent({ t, router }: { t: AccountTranslations; router: ReturnType<typeof useRouter> }) {
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
      router.refresh();
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

// ---------- Contenu Traduction des messages ----------
function TranslationTabContent() {
  const [preferredLanguage, setPreferredLanguage] = useState("fr");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Liste des langues supportees
  const languages = [
    { code: "fr", name: "Francais", nativeName: "Francais" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Espanol" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "pt", name: "Portuguese", nativeName: "Portugues" },
    { code: "zh", name: "Chinese", nativeName: "Zhongwen" },
    { code: "ar", name: "Arabic", nativeName: "Arabi" },
    { code: "ja", name: "Japanese", nativeName: "Nihongo" },
  ];

  // Charger les preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch("/api/account/preferences/translation");
        if (res.ok) {
          const data = await res.json();
          setPreferredLanguage(data.preferredLanguage || "fr");
          setAutoTranslate(data.autoTranslate ?? true);
        }
      } catch (e) {
        console.error("Erreur chargement preferences:", e);
      } finally {
        setLoading(false);
      }
    };
    void loadPrefs();
  }, []);

  // Sauvegarder les preferences
  const savePreferences = async (newLang?: string, newAuto?: boolean) => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/account/preferences/translation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredLanguage: newLang ?? preferredLanguage,
          autoTranslate: newAuto ?? autoTranslate,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (code: string) => {
    setPreferredLanguage(code);
    void savePreferences(code, undefined);
  };

  const handleAutoTranslateToggle = () => {
    const newValue = !autoTranslate;
    setAutoTranslate(newValue);
    void savePreferences(undefined, newValue);
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Traduction des messages</h1>
          <p className="text-sm text-gray-500">Chargement...</p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Traduction des messages</h1>
        <p className="text-sm text-gray-500">
          Configurez la traduction automatique de vos messages
        </p>
      </header>

      {/* Toggle traduction automatique */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <GlobeAltIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Traduction automatique
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Traduire automatiquement les messages recus dans une langue differente
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {autoTranslate
                  ? "Les messages seront traduits automatiquement"
                  : "Vous devrez cliquer pour traduire chaque message"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoTranslate}
            onClick={handleAutoTranslateToggle}
            disabled={saving}
            className={[
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
              autoTranslate ? "bg-gray-900" : "bg-gray-200",
              saving ? "opacity-50 cursor-wait" : "",
            ].join(" ")}
          >
            <span
              className={[
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                autoTranslate ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* Selecteur de langue preferee */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Langue preferee
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Les messages seront traduits dans cette langue
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((lang) => {
            const isSelected = lang.code === preferredLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                disabled={saving}
                className={[
                  "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                  isSelected
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white hover:border-gray-400",
                  saving ? "opacity-50 cursor-wait" : "",
                ].join(" ")}
              >
                <span className="font-medium">{lang.nativeName}</span>
                {isSelected && <CheckCircleIcon className="h-5 w-5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Information sur le fonctionnement */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Comment ca fonctionne
        </h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
              1
            </div>
            <p>
              Quand vous recevez un message, la langue est automatiquement detectee.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
              2
            </div>
            <p>
              Si le message est dans une langue differente de votre langue preferee,
              il sera traduit {autoTranslate ? "automatiquement" : "sur demande"}.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
              3
            </div>
            <p>
              Vous pouvez toujours voir le message original en cliquant sur
              &quot;Voir l&apos;original&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Indicateur de sauvegarde */}
      {saved && (
        <div className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Preferences enregistrees</span>
        </div>
      )}
    </section>
  );
}

// ---------- TabContent global ----------
function TabContent({
  active,
  t,
  tabLabels,
  router,
}: {
  active: TabId;
  t: AccountTranslations;
  tabLabels: Record<TabId, string>;
  router: ReturnType<typeof useRouter>;
}) {
  switch (active) {
    case "personal":
      return <PersonalTabContent t={t} />;

    case "security":
      return <SecurityTabContent t={t} router={router} />;

    case "privacy":
      return <PrivacyTabContent t={t} />;

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
      return <LanguageTabContent t={t} router={router} />;

    case "translation":
      return <TranslationTabContent />;

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

  // 🔹 chaque tab a une icône React - mémorisé pour éviter les re-renders
  const tabs = useMemo(() => [
    {
      id: "personal" as TabId,
      label: t.tabs.personal,
      icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: "security" as TabId,
      label: t.tabs.security,
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      id: "privacy" as TabId,
      label: t.tabs.privacy,
      icon: <LockClosedIcon className="h-5 w-5" />,
    },
    {
      id: "notifications" as TabId,
      label: t.tabs.notifications,
      icon: <BellIcon className="h-5 w-5" />,
    },
    {
      id: "taxes" as TabId,
      label: t.tabs.taxes,
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: "payments" as TabId,
      label: t.tabs.payments,
      icon: <CreditCardIcon className="h-5 w-5" />,
    },
    {
      id: "language" as TabId,
      label: t.tabs.language,
      icon: <GlobeAltIcon className="h-5 w-5" />,
    },
    {
      id: "translation" as TabId,
      label: "Traduction",
      icon: <LanguageIcon className="h-5 w-5" />,
    },
  ], [t.tabs]);

  const tabLabels: Record<TabId, string> = {
    personal: t.tabs.personal,
    security: t.tabs.security,
    privacy: t.tabs.privacy,
    notifications: t.tabs.notifications,
    taxes: t.tabs.taxes,
    payments: t.tabs.payments,
    language: t.tabs.language,
    translation: "Traduction",
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
    <main className="mx-auto flex max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] flex-col md:flex-row gap-6 md:gap-8 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-10">
      {/* Sidebar desktop */}
      <aside className="hidden w-full md:w-64 lg:w-72 xl:w-80 flex-shrink-0 md:border-r border-gray-200 md:pr-6 md:block">
        <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold">{t.settingsTitle}</h2>
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

      {/* Mobile - Liste style Airbnb */}
      <div className="md:hidden w-full bg-gray-50 min-h-screen -mx-4 -my-6 px-4 py-6">
        {activeTab === "personal" && !searchParams.get("tab") ? (
          /* Vue principale mobile - Liste des paramètres */
          <div className="space-y-6">
            {/* Header */}
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-gray-900">{t.settingsTitle}</h1>
            </div>

            {/* Liste des options */}
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleChangeTab(tab.id)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm active:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 ${iconColorByTab[tab.id]}`}>
                      {tab.icon}
                    </div>
                    <span className="text-base font-medium text-gray-900">{tab.label}</span>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Vue détail mobile - Contenu de l'onglet sélectionné */
          <div className="space-y-4">
            {/* Header avec bouton retour */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("personal");
                router.push("/account", { scroll: false });
              }}
              className="flex items-center gap-2 text-gray-600 -ml-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Retour</span>
            </button>

            {/* Contenu */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <TabContent active={activeTab} t={t} tabLabels={tabLabels} router={router} />
            </div>
          </div>
        )}
      </div>

      {/* Content desktop */}
      <section className="hidden md:block flex-1">
        <TabContent active={activeTab} t={t} tabLabels={tabLabels} router={router} />
      </section>
    </main>
  );
}
