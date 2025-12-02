"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Merci d’entrer une adresse e-mail.");
      return;
    }

    setSending(true);

    try {
      const res = await signIn("email", {
        email: email.trim(),
        callbackUrl: "/onboarding", // après validation du mail
        redirect: false,            // on reste sur la page
      });

      if (res?.error) {
        setError(
          "Impossible d’envoyer l’e-mail. Réessaie dans un instant."
        );
      } else {
        setSent(true);
      }
    } catch {
      setError("Une erreur est survenue. Réessaie plus tard.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Retour à l’accueil
        </button>

        <h1 className="mt-4 text-2xl font-semibold">
          Connexion ou inscription par e-mail
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Entre ton adresse e-mail, nous t’enverrons un lien sécurisé pour
          confirmer que c’est bien toi.
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
                placeholder="exemple@domaine.com"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {sending ? "Envoi du lien..." : "Envoyer le lien de connexion"}
            </button>
          </form>
        )}

        {sent && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            <p className="font-semibold">Lien envoyé !</p>
            <p className="mt-1">
              Vérifie ta boîte mail (<strong>{email}</strong>) et clique sur
              le bouton de confirmation. Tu seras automatiquement redirigé vers
              la page d’inscription pour compléter ton profil.
            </p>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-snug text-gray-500">
          En continuant, tu confirmes que tu as lu et accepté les Conditions
          générales et la Politique de confidentialité de Lok’Room.
        </p>
      </div>
    </div>
  );
}
