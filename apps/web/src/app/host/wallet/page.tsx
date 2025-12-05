// apps/web/src/app/host/wallet/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type LedgerEntry = {
  id: string;
  deltaCents: number;
  reason: string;
  createdAt: string;
};

type WalletData = {
  balanceCents: number;
  ledger: LedgerEntry[];
};

// Labels pour les types de transactions
const REASON_LABELS: Record<string, string> = {
  BOOKING_PAYMENT: "Paiement réservation",
  PAYOUT: "Virement bancaire",
  REFUND: "Remboursement",
  COMMISSION: "Commission Lok'Room",
  ADJUSTMENT: "Ajustement",
};

export default function WalletPage() {
  const router = useRouter();
  const { status } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/host/wallet");
      if (!res.ok) {
        const data = await res.json();
        if (data.error === "forbidden") {
          router.push("/become-host");
          return;
        }
        throw new Error(data.error || "Erreur de chargement");
      }
      const data = await res.json();
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/host/wallet");
      return;
    }

    if (status === "authenticated") {
      fetchWallet();
    }
  }, [status, router, fetchWallet]);

  async function handlePayout() {
    if (payoutLoading) return;
    setPayoutLoading(true);

    try {
      const res = await fetch("/api/host/stripe/payout-link", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la demande de virement");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPayoutLoading(false);
    }
  }

  function formatAmount(cents: number): string {
    const euros = cents / 100;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(euros);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const balance = wallet?.balanceCents ?? 0;
  const ledger = wallet?.ledger ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Portefeuille</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ton solde et l&apos;historique de tes transactions
        </p>
      </div>

      {/* Carte solde */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">Solde disponible</p>
            <p className="mt-2 text-4xl font-bold">{formatAmount(balance)}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handlePayout}
            disabled={payoutLoading || balance <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {payoutLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-900" />
                Chargement...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Retirer vers mon compte
              </>
            )}
          </button>
          <Link
            href="/account/payments?tab=payouts"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Paramètres versements
          </Link>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Comment fonctionne le portefeuille ?</p>
            <p className="mt-1 text-blue-700">
              Quand un voyageur réserve ton espace, le paiement est sécurisé par Lok&apos;Room.
              Les fonds sont libérés sur ton portefeuille 24h après le check-in.
              Tu peux ensuite les transférer vers ton compte bancaire à tout moment.
            </p>
          </div>
        </div>
      </div>

      {/* Historique des transactions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Historique des transactions</h2>

        {ledger.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Aucune transaction pour le moment.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Les transactions apparaîtront ici après ta première réservation.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    entry.deltaCents >= 0 ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {entry.deltaCents >= 0 ? (
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {REASON_LABELS[entry.reason] || entry.reason}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  entry.deltaCents >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {entry.deltaCents >= 0 ? "+" : ""}{formatAmount(entry.deltaCents)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lien retour */}
      <div className="mt-8">
        <Link
          href="/host"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour au tableau de bord hôte
        </Link>
      </div>
    </div>
  );
}
