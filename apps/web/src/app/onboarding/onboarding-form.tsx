// apps/web/src/app/onboarding/OnboardingForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  email: string;
};

export default function OnboardingForm({ email }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Merci de renseigner ton prénom et ton nom.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!res.ok) {
        setError("Impossible d’enregistrer tes informations.");
        return;
      }

      // On renvoie vers l’accueil (ou une autre page si tu veux)
      router.push("/");
    } catch {
      setError("Une erreur est survenue. Réessaie plus tard.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-700">
          Adresse e-mail
        </label>
        <input
          value={email}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-700">
          Prénom
        </label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
          placeholder="Prénom sur ta pièce d’identité"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-700">
          Nom
        </label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
          placeholder="Nom sur ta pièce d’identité"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
      >
        {saving ? "Enregistrement..." : "Accepter et continuer"}
      </button>

      <p className="mt-3 text-[11px] leading-snug text-gray-500">
        Tu pourras ajouter plus d’informations (adresse, téléphone,
        vérification KYC, etc.) plus tard dans les paramètres de ton compte.
      </p>
    </form>
  );
}
