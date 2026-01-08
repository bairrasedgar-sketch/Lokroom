// apps/web/src/app/host/listings/[id]/security-deposit/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

type DepositPolicy = {
  enabled: boolean;
  amountCents: number;
  currency: string;
  description: string | null;
  refundDays: number;
};

export default function SecurityDepositSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState("200");
  const [description, setDescription] = useState("");
  const [refundDays, setRefundDays] = useState("7");

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch(`/api/host/listings/${listingId}/security-deposit`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/host/listings");
          return;
        }
        throw new Error("Erreur de chargement");
      }

      const data = await res.json();
      const policy: DepositPolicy = data.policy;

      setEnabled(policy.enabled);
      setAmount((policy.amountCents / 100).toString());
      setDescription(policy.description || "");
      setRefundDays(policy.refundDays.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [listingId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/host/listings");
      return;
    }

    if (status === "authenticated") {
      fetchPolicy();
    }
  }, [status, router, fetchPolicy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/host/listings/${listingId}/security-deposit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          amount: parseFloat(amount),
          description: description.trim() || null,
          refundDays: parseInt(refundDays),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de sauvegarde");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/listings/${listingId}/edit`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour a l&apos;annonce
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheckIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Depot de garantie
            </h1>
            <p className="text-sm text-gray-500">
              Configurez la caution pour cette annonce
            </p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-500" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Comment fonctionne la caution ?</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Le montant est autorise sur la carte du voyageur (pas debite)
              </li>
              <li>
                Apres le sejour, vous avez X jours pour signaler des dommages
              </li>
              <li>
                Sans reclamation, la caution est automatiquement liberee
              </li>
              <li>
                En cas de dommages, vous pouvez reclamer tout ou partie du montant
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle activation */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <p className="font-medium text-gray-900">Activer la caution</p>
            <p className="text-sm text-gray-500">
              Demander une caution aux voyageurs
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
              enabled ? "bg-amber-600" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Champs conditionnels */}
        {enabled && (
          <>
            {/* Montant */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Montant de la caution
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="50"
                  max="5000"
                  step="10"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:border-amber-500 focus:ring-amber-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  EUR
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Montant recommande: entre 100 et 500 EUR selon la valeur de votre bien
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description (optionnel)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Expliquez aux voyageurs pourquoi vous demandez une caution..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-amber-500 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Cette description sera visible par les voyageurs
              </p>
            </div>

            {/* Delai de remboursement */}
            <div>
              <label
                htmlFor="refundDays"
                className="block text-sm font-medium text-gray-700"
              >
                Delai pour signaler des dommages
              </label>
              <select
                id="refundDays"
                value={refundDays}
                onChange={(e) => setRefundDays(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-amber-500 focus:ring-amber-500"
              >
                <option value="3">3 jours apres le depart</option>
                <option value="5">5 jours apres le depart</option>
                <option value="7">7 jours apres le depart</option>
                <option value="14">14 jours apres le depart</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Passe ce delai, la caution sera automatiquement liberee
              </p>
            </div>
          </>
        )}

        {/* Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            Parametres sauvegardes avec succes !
          </div>
        )}

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <Link
            href={`/listings/${listingId}/edit`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
}
