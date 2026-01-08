"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Recuperer le token temporaire depuis l'URL
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Si pas de token, rediriger vers login
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!code.trim()) {
      setError("Veuillez entrer un code");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Verifier le code 2FA
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code invalide");
        setLoading(false);
        return;
      }

      // Si verification reussie, finaliser la connexion avec NextAuth
      // On utilise un token special pour indiquer que le 2FA est valide
      const signInRes = await signIn("credentials", {
        email: data.email,
        twoFactorVerified: "true",
        twoFactorToken: token,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Erreur lors de la connexion");
        setLoading(false);
        return;
      }

      // Afficher un message si un code de secours a ete utilise
      if (data.method === "BACKUP_CODE" && data.remainingBackupCodes !== undefined) {
        if (data.remainingBackupCodes <= 3) {
          alert(
            `Attention : il vous reste ${data.remainingBackupCodes} code(s) de secours. Pensez a en regenerer dans les parametres de securite.`
          );
        }
      }

      // Rediriger vers la page demandee
      router.push(callbackUrl);
    } catch {
      setError("Erreur de connexion");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-6 sm:p-8">
        {/* Bouton retour */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour a la connexion
        </Link>

        {/* Header */}
        <div className="mt-6 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-xl">
            <ShieldCheckIcon className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Verification en deux etapes
            </h1>
            <p className="text-sm text-gray-500">
              {useBackupCode
                ? "Entrez un code de secours"
                : "Entrez le code de votre application"}
            </p>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              {useBackupCode ? "Code de secours" : "Code a 6 chiffres"}
            </label>
            <input
              id="code"
              type="text"
              inputMode={useBackupCode ? "text" : "numeric"}
              pattern={useBackupCode ? undefined : "[0-9]*"}
              maxLength={useBackupCode ? 9 : 6}
              value={code}
              onChange={(e) => {
                if (useBackupCode) {
                  // Format: XXXX-XXXX
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                  setCode(value);
                } else {
                  // Seulement des chiffres
                  setCode(e.target.value.replace(/\D/g, ""));
                }
              }}
              placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
              className="w-full text-center text-2xl font-mono tracking-widest py-4 border border-gray-300 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!useBackupCode && code.length !== 6)}
            className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Verification...
              </span>
            ) : (
              "Verifier"
            )}
          </button>
        </form>

        {/* Toggle code de secours */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
              setError(null);
            }}
            className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
          >
            {useBackupCode
              ? "Utiliser mon application d'authentification"
              : "Utiliser un code de secours"}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500">
            {useBackupCode ? (
              <>
                Les codes de secours sont des codes a usage unique que vous avez
                recus lors de l&apos;activation du 2FA. Chaque code ne peut etre
                utilise qu&apos;une seule fois.
              </>
            ) : (
              <>
                Ouvrez votre application d&apos;authentification (Google Authenticator,
                Authy, etc.) et entrez le code a 6 chiffres affiche pour
                Lok&apos;Room.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
