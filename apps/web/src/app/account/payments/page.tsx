// apps/web/src/app/account/payments/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Tab = "payments" | "payouts";

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab: Tab = (searchParams.get("tab") as Tab) ?? "payments";

  function setTab(tab: Tab) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("tab", tab);
    // On peut nettoyer d’éventuels vieux paramètres (step, etc.)
    sp.delete("step");
    router.replace(`/account/payments?${sp.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Titre + tabs Paiements / Versements */}
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">Paiements</h2>
        <p className="text-sm text-gray-600">
          Consulte tes paiements et configure la façon dont Lok&apos;Room
          t&apos;envoie l&apos;argent.
        </p>

        <div className="mt-4 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("payments")}
            className={`rounded-full px-4 py-2 ${
              currentTab === "payments"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/60"
            }`}
          >
            Paiements
          </button>
          <button
            type="button"
            onClick={() => setTab("payouts")}
            className={`rounded-full px-4 py-2 ${
              currentTab === "payouts"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/60"
            }`}
          >
            Versements
          </button>
        </div>
      </header>

      {currentTab === "payments" ? (
        <PaymentsHistoryPlaceholder />
      ) : (
        <PayoutStripeCard />
      )}
    </div>
  );
}

/* ------------ Onglet PAIEMENTS (historique simple pour l'instant) ----------- */

function PaymentsHistoryPlaceholder() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
      <p className="mb-2 font-medium">Vos paiements</p>
      <p className="text-gray-500">
        Ici tu verras toutes les réservations que tu as payées sur Lok&apos;Room
        (date, logement, montant, moyen de paiement, etc.).
      </p>
      <p className="mt-2 text-gray-400">
        Pour l&apos;instant, cette section est un aperçu design. On branchera
        la vraie liste des paiements une fois que le flux de réservation sera
        finalisé.
      </p>
    </div>
  );
}

/* ------------ Onglet VERSEMENTS (Stripe Connect hébergé) ----------- */

function PayoutStripeCard() {
  const [loading, setLoading] = useState(false);

  async function handleConfigure() {
    try {
      setLoading(true);
      const res = await fetch("/api/host/stripe/payout-link", {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(
          json.error ??
            "Impossible de démarrer la configuration des versements."
        );
      }

      // Redirection vers la page d'onboarding / gestion Stripe
      window.location.href = json.url;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la redirection vers Stripe."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
      <p className="mb-1 text-sm font-medium">Versements Stripe</p>
      <p className="text-sm text-gray-500">
        Stripe gère pour toi le KYC (vérification d&apos;identité), ton IBAN et
        la réception des fonds. Clique sur le bouton ci-dessous pour configurer
        ou mettre à jour tes informations de versement sur une page sécurisée
        Stripe, comme sur Airbnb.
      </p>

      <button
        type="button"
        onClick={handleConfigure}
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirection vers Stripe…" : "Configurer les versements"}
      </button>

      <p className="text-xs text-gray-400">
        Tu seras redirigé vers Stripe pour remplir les informations requises
        (pièce d&apos;identité, coordonnées bancaires, etc.). Tu pourras
        ensuite revenir sur Lok&apos;Room.
      </p>
    </div>
  );
}
