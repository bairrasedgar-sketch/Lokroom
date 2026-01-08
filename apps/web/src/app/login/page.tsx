"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";
import Link from "next/link";

type LoginStep = "email" | "password" | "magic-link-sent";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // États du formulaire - pré-remplir l'email si passé en paramètre
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // États de chargement et erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dictionnaire i18n
  const [dict, setDict] = useState(getDictionaryForLocale("fr"));

  // Si déjà connecté, rediriger vers la page demandée ou l'accueil
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      router.push(callbackUrl);
    }
  }, [status, router, searchParams]);

  // Charger le dictionnaire selon la locale du cookie
  useEffect(() => {
    if (typeof document === "undefined") return;
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const locale = (m?.[1] || "fr") as SupportedLocale;
    setDict(getDictionaryForLocale(locale));
  }, []);

  const t = dict.auth;

  // Afficher un loader pendant la vérification de session
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Étape 1: Vérifier l'email
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
      // Vérifier si l'email existe et a un mot de passe
      const res = await fetch(`/api/auth/login?email=${encodeURIComponent(trimmedEmail)}`);
      const data = await res.json();

      if (data.exists && data.hasPassword) {
        // L'utilisateur a un compte avec mot de passe
        setStep("password");
      } else {
        // Nouvel utilisateur ou compte sans mot de passe - envoyer magic link
        const signInRes = await signIn("email", {
          email: trimmedEmail,
          callbackUrl: "/onboarding",
          redirect: false,
        });

        if (signInRes?.error) {
          setError(t.sendError);
        } else {
          setStep("magic-link-sent");
        }
      }
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  // Étape 2: Connexion avec mot de passe
  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Le mot de passe est requis");
      return;
    }

    setLoading(true);

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/";

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Email ou mot de passe incorrect");
      } else if (res?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  // Envoyer un magic link (option de secours)
  async function handleSendMagicLink() {
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("email", {
        email: email.trim().toLowerCase(),
        callbackUrl: searchParams.get("callbackUrl") || "/",
        redirect: false,
      });

      if (res?.error) {
        setError(t.sendError);
      } else {
        setStep("magic-link-sent");
      }
    } catch {
      setError(t.genericError);
    } finally {
      setLoading(false);
    }
  }

  // Revenir à l'étape email
  function handleBack() {
    setStep("email");
    setPassword("");
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="w-full max-w-md 2xl:max-w-lg rounded-3xl bg-white shadow-lg p-6 sm:p-8">
        {/* Bouton retour */}
        <button
          type="button"
          onClick={() => step === "email" ? router.push("/") : handleBack()}
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
          {step === "email" ? t.backToHome : "Retour"}
        </button>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          {t.loginTitle}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {step === "password"
            ? "Entre ton mot de passe pour te connecter."
            : t.linkSentDesc.split(".")[0] + "."
          }
        </p>

        {/* ========== ÉTAPE 1: EMAIL ========== */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700"
              >
                {t.emailLabel}
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
                placeholder={t.emailPlaceholder}
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
                  Vérification...
                </span>
              ) : (
                "Continuer"
              )}
            </button>
          </form>
        )}

        {/* ========== ÉTAPE 2: MOT DE PASSE ========== */}
        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            {/* Email affiché (read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                readOnly
                tabIndex={-1}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
              />
            </div>

            {/* Champ mot de passe */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Ton mot de passe"
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
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
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>

            {/* Liens secondaires */}
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-center text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline"
              >
                Mot de passe oublié ?
              </Link>

              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loading}
                className="text-center text-xs font-medium text-gray-500 hover:text-gray-900 hover:underline disabled:opacity-50"
              >
                Me connecter avec un lien par email
              </button>
            </div>
          </form>
        )}

        {/* ========== ÉTAPE 3: MAGIC LINK ENVOYÉ ========== */}
        {step === "magic-link-sent" && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-100">
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
                <p className="font-semibold">{t.linkSent}</p>
                <p className="mt-1 text-emerald-700">
                  {t.linkSentDesc.replace("{email}", email)}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-gray-500">
          {t.legalText.split(t.terms)[0]}
          <a href="/legal/terms" className="underline hover:text-gray-900">
            {t.terms}
          </a>{" "}
          {dict.common.and}{" "}
          <a href="/legal/privacy" className="underline hover:text-gray-900">
            {t.privacy}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
