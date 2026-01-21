"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";
import PasswordInput, { validatePassword } from "@/components/PasswordInput";

type Step = "email" | "code" | "new-password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // États du flow
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // États de chargement et erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dictionnaire i18n
  const [dict, setDict] = useState(getDictionaryForLocale("fr"));

  // Charger le dictionnaire selon la locale du cookie
  useEffect(() => {
    if (typeof document === "undefined") return;
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const locale = (m?.[1] || "fr") as SupportedLocale;
    setDict(getDictionaryForLocale(locale));
  }, []);

  const t = dict.auth;

  // Validation mot de passe
  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  // Étape 1: Demander l'email
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError(t.emailRequired);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t.emailInvalid);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
        return;
      }

      // Toujours passer à l'étape code (même si l'email n'existe pas, pour des raisons de sécurité)
      setStep("code");
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  // Étape 2: Vérifier le code et saisir le nouveau mot de passe
  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    // Passer à l'étape mot de passe
    setStep("new-password");
  }

  // Étape 3: Réinitialiser le mot de passe
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordError(null);

    if (!passwordValidation.isValid) {
      setPasswordError("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }

    if (!passwordsMatch) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "INVALID_CODE") {
          setError("Code invalide. Vérifie le code reçu par email.");
          setStep("code");
        } else if (data.code === "CODE_EXPIRED") {
          setError("Ce code a expiré. Demande un nouveau code.");
          setStep("email");
        } else {
          setError(data.error || "Une erreur est survenue");
        }
        return;
      }

      setStep("success");
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  // Renvoyer le code
  async function handleResendCode() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        setCode("");
        setError(null);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="w-full max-w-md 2xl:max-w-lg rounded-3xl bg-white shadow-lg p-6 sm:p-8">
        {/* Bouton retour */}
        <button
          type="button"
          onClick={() => {
            if (step === "email") {
              router.push("/login");
            } else if (step === "code") {
              setStep("email");
            } else if (step === "new-password") {
              setStep("code");
            } else {
              router.push("/login");
            }
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour
        </button>

        {/* Titre */}
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          {step === "success" ? "Mot de passe réinitialisé" : "Mot de passe oublié"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {step === "email" && "Entrez votre adresse email pour recevoir un code de réinitialisation."}
          {step === "code" && `Entrez le code à 6 chiffres envoyé à ${email}. Pensez à vérifier vos spams.`}
          {step === "new-password" && "Choisissez votre nouveau mot de passe."}
          {step === "success" && "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."}
        </p>

        {/* ========== ÉTAPE 1: EMAIL ========== */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="votre@email.com"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Envoi en cours...
                </span>
              ) : (
                "Envoyer le code"
              )}
            </button>
          </form>
        )}

        {/* ========== ÉTAPE 2: CODE ========== */}
        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="code"
                className="block text-xs font-semibold text-gray-700"
              >
                Code de vérification
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="text-[11px] text-gray-500">
                Le code expire dans 15 minutes.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Vérifier le code
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="w-full text-center text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Renvoyer le code"}
            </button>
          </form>
        )}

        {/* ========== ÉTAPE 3: NOUVEAU MOT DE PASSE ========== */}
        {step === "new-password" && (
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              label="Nouveau mot de passe"
              placeholder="Votre nouveau mot de passe"
              showValidation={true}
              confirmValue={confirmPassword}
              confirmLabel="Confirmez votre nouveau mot de passe"
              onConfirmChange={setConfirmPassword}
              error={passwordError}
              autoFocus
            />

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || !passwordsMatch}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Réinitialisation...
                </span>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>
        )}

        {/* ========== ÉTAPE 4: SUCCÈS ========== */}
        {step === "success" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-100">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Mot de passe mis à jour !</p>
                  <p className="mt-1 text-emerald-700">
                    Ton mot de passe a été réinitialisé avec succès.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/login?email=${encodeURIComponent(email.trim().toLowerCase())}`)}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-black"
            >
              Se connecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
