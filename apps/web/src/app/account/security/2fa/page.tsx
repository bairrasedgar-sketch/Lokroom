"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/logger";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  KeyIcon,
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

type TwoFactorStatus = {
  enabled: boolean;
  hasPassword: boolean;
  backupCodesRemaining: number;
  setupDate: string | null;
  lastUpdated: string | null;
  recentActivity: Array<{
    method: string;
    success: boolean;
    createdAt: string;
    ipAddress: string | null;
  }>;
};

type SetupStep = "idle" | "qr" | "verify" | "backup" | "complete";

export default function TwoFactorSettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Etats
  const [loading, setLoading] = useState(true);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pour la desactivation
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Pour la regeneration des codes
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");

  // Copie dans le presse-papier
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Charger le statut 2FA
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setTwoFactorStatus(data);
      }
    } catch (err) {
      logger.error("Erreur chargement statut 2FA:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/account/security/2fa");
      return;
    }

    if (sessionStatus === "authenticated") {
      fetchStatus();
    }
  }, [sessionStatus, router, fetchStatus]);

  // Initialiser la configuration 2FA
  async function handleSetup() {
    setError(null);
    setActionLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'initialisation");
        return;
      }

      setQrCode(data.qrCode);
      setManualSecret(data.secret);
      setSetupStep("qr");
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(false);
    }
  }

  // Verifier le code et activer le 2FA
  async function handleVerifySetup() {
    if (verificationCode.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    setError(null);
    setActionLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code invalide");
        return;
      }

      setBackupCodes(data.backupCodes);
      setSetupStep("backup");
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(false);
    }
  }

  // Terminer la configuration
  function handleComplete() {
    setSetupStep("complete");
    setSuccessMessage("L'authentification a deux facteurs est maintenant activee !");
    fetchStatus();
    // Reset
    setQrCode(null);
    setManualSecret(null);
    setVerificationCode("");
    setBackupCodes([]);
    setTimeout(() => {
      setSetupStep("idle");
      setSuccessMessage(null);
    }, 3000);
  }

  // Desactiver le 2FA
  async function handleDisable() {
    if (!disablePassword) {
      setError("Mot de passe requis");
      return;
    }

    setError(null);
    setActionLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la desactivation");
        return;
      }

      setShowDisableModal(false);
      setDisablePassword("");
      setSuccessMessage("L'authentification a deux facteurs a ete desactivee");
      fetchStatus();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(false);
    }
  }

  // Regenerer les codes de secours
  async function handleRegenerateBackupCodes() {
    if (regenerateCode.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    setError(null);
    setActionLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/backup-codes/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: regenerateCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la regeneration");
        return;
      }

      setBackupCodes(data.backupCodes);
      setShowRegenerateModal(false);
      setRegenerateCode("");
      setSetupStep("backup");
    } catch {
      setError("Erreur de connexion");
    } finally {
      setActionLoading(false);
    }
  }

  // Copier un code
  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // Copier tous les codes
  function copyAllCodes() {
    const allCodes = backupCodes.join("\n");
    navigator.clipboard.writeText(allCodes);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Retour aux parametres
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Titre */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <ShieldCheckIcon className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Authentification a deux facteurs
                </h1>
                <p className="text-sm text-gray-500">
                  Ajoutez une couche de securite supplementaire a votre compte
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 flex items-center gap-2">
              <CheckIcon className="h-5 w-5 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Contenu principal */}
          <div className="p-6">
            {/* Etape: Idle - Afficher le statut */}
            {setupStep === "idle" && (
              <>
                {/* Statut actuel */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    {twoFactorStatus?.enabled ? (
                      <>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">2FA active</p>
                          <p className="text-sm text-gray-500">
                            Votre compte est protege
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <ShieldExclamationIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">2FA desactive</p>
                          <p className="text-sm text-gray-500">
                            Activez-le pour plus de securite
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!twoFactorStatus?.enabled ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      L&apos;authentification a deux facteurs ajoute une couche de securite
                      supplementaire en demandant un code genere par une application
                      d&apos;authentification (Google Authenticator, Authy, etc.) lors de la
                      connexion.
                    </p>

                    {!twoFactorStatus?.hasPassword && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
                        <p className="font-medium">Mot de passe requis</p>
                        <p className="mt-1">
                          Vous devez d&apos;abord{" "}
                          <Link href="/account/security" className="underline">
                            definir un mot de passe
                          </Link>{" "}
                          avant d&apos;activer le 2FA.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSetup}
                      disabled={actionLoading || !twoFactorStatus?.hasPassword}
                      className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? "Chargement..." : "Activer le 2FA"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Codes de secours restants */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <KeyIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Codes de secours
                            </p>
                            <p className="text-sm text-gray-500">
                              {twoFactorStatus.backupCodesRemaining} codes restants
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowRegenerateModal(true)}
                          className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                          Regenerer
                        </button>
                      </div>
                      {twoFactorStatus.backupCodesRemaining <= 3 && (
                        <p className="mt-2 text-sm text-amber-600">
                          Attention : il vous reste peu de codes de secours.
                          Pensez a en regenerer.
                        </p>
                      )}
                    </div>

                    {/* Bouton desactiver */}
                    <button
                      onClick={() => setShowDisableModal(true)}
                      className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Desactiver le 2FA
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Etape: QR Code */}
            {setupStep === "qr" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Scannez le QR code
                  </h2>
                  <p className="text-sm text-gray-500">
                    Utilisez une application d&apos;authentification comme Google
                    Authenticator ou Authy
                  </p>
                </div>

                {qrCode && (
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                    </div>
                  </div>
                )}

                {manualSecret && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-2">
                      Ou entrez ce code manuellement :
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm font-mono">
                        {manualSecret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(manualSecret, -2)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {copiedIndex === -2 ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSetupStep("verify")}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                  Continuer
                </button>
              </div>
            )}

            {/* Etape: Verification */}
            {setupStep === "verify" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Verifiez la configuration
                  </h2>
                  <p className="text-sm text-gray-500">
                    Entrez le code a 6 chiffres affiche dans votre application
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono tracking-widest py-4 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep("qr")}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleVerifySetup}
                    disabled={actionLoading || verificationCode.length !== 6}
                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "Verification..." : "Verifier"}
                  </button>
                </div>
              </div>
            )}

            {/* Etape: Codes de secours */}
            {setupStep === "backup" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Codes de secours
                  </h2>
                  <p className="text-sm text-gray-500">
                    Conservez ces codes en lieu sur. Ils vous permettront de vous
                    connecter si vous perdez acces a votre application
                    d&apos;authentification.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      <strong>Important :</strong> Ces codes ne seront affiches
                      qu&apos;une seule fois. Notez-les ou telechargez-les maintenant.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <code className="font-mono text-sm">{code}</code>
                      <button
                        onClick={() => copyToClipboard(code, index)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {copiedIndex === index ? (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={copyAllCodes}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedIndex === -1 ? (
                    <>
                      <CheckIcon className="h-5 w-5 text-green-500" />
                      Codes copies !
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-5 w-5" />
                      Copier tous les codes
                    </>
                  )}
                </button>

                <button
                  onClick={handleComplete}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                  J&apos;ai sauvegarde mes codes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activite recente */}
        {twoFactorStatus?.enabled && twoFactorStatus.recentActivity.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Activite recente</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {twoFactorStatus.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.success ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm text-gray-900">
                        {activity.method === "TOTP" && "Verification TOTP"}
                        {activity.method === "BACKUP_CODE" && "Code de secours utilise"}
                        {activity.method === "SETUP_COMPLETED" && "2FA active"}
                        {activity.method === "DISABLED" && "2FA desactive"}
                        {activity.method === "BACKUP_REGENERATED" && "Codes regeneres"}
                        {!["TOTP", "BACKUP_CODE", "SETUP_COMPLETED", "DISABLED", "BACKUP_REGENERATED"].includes(activity.method) && activity.method}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString("fr-FR")}
                        {activity.ipAddress && ` - ${activity.ipAddress}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      activity.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {activity.success ? "Succes" : "Echec"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Desactiver */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Desactiver le 2FA
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Entrez votre mot de passe pour confirmer la desactivation de
              l&apos;authentification a deux facteurs.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full py-3 px-4 pr-12 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablePassword("");
                  setError(null);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDisable}
                disabled={actionLoading || !disablePassword}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "..." : "Desactiver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Regenerer codes */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Regenerer les codes de secours
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Entrez un code TOTP de votre application pour generer de nouveaux
              codes de secours. Les anciens codes seront invalides.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={regenerateCode}
              onChange={(e) =>
                setRegenerateCode(e.target.value.replace(/\D/g, ""))
              }
              placeholder="000000"
              className="w-full text-center text-xl font-mono tracking-widest py-3 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setRegenerateCode("");
                  setError(null);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={actionLoading || regenerateCode.length !== 6}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "..." : "Regenerer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
