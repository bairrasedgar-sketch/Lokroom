"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Si authentifié, ne rien afficher (la redirection est en cours)
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    // Validation email côté client
    if (!trimmedEmail) {
      setError(t.emailRequired);
      return;
    }

    // Regex email robuste
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t.emailInvalid);
      return;
    }

    setSending(true);

    try {
      const res = await signIn("email", {
        email: trimmedEmail,
        callbackUrl: "/onboarding",
        redirect: false,
      });

      if (res?.error) {
        setError(t.sendError);
      } else {
        setSent(true);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-6 sm:p-8">
        <button
          type="button"
          onClick={() => router.push("/")}
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
          {t.backToHome}
        </button>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          {t.loginTitle}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t.linkSentDesc.split(".")[0]}.
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t.sendingLink}
                </span>
              ) : (
                t.sendLoginLink
              )}
            </button>
          </form>
        )}

        {sent && (
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
