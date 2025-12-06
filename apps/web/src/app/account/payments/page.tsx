"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CreditCardIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";

type Tab = "wallet" | "payments" | "payouts";

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-gray-100" />
          <div className="h-10 w-64 rounded-full bg-gray-100" />
          <div className="h-32 rounded-2xl border border-gray-200 bg-white" />
        </div>
      }
    >
      <PaymentsPageContent />
    </Suspense>
  );
}

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const currentTab: Tab =
    (searchParams.get("paymentsTab") as Tab) ?? "wallet";

  function setTab(tab: Tab) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("paymentsTab", tab);
    sp.delete("step");
    router.replace(`?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">{t.paymentsPage?.title || "Paiements et portefeuille"}</h2>
        <p className="text-sm text-gray-600">
          {t.paymentsPage?.subtitle || "Gérez votre portefeuille, vos paiements et vos versements"}
        </p>

        <div className="mt-4 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("wallet")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition ${
              currentTab === "wallet"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/60"
            }`}
          >
            <WalletIcon className="h-4 w-4" />
            Portefeuille
          </button>
          <button
            type="button"
            onClick={() => setTab("payments")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition ${
              currentTab === "payments"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/60"
            }`}
          >
            <CreditCardIcon className="h-4 w-4" />
            {t.paymentsPage?.paymentsTab || "Paiements"}
          </button>
          <button
            type="button"
            onClick={() => setTab("payouts")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition ${
              currentTab === "payouts"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/60"
            }`}
          >
            <BanknotesIcon className="h-4 w-4" />
            {t.paymentsPage?.payoutsTab || "Versements"}
          </button>
        </div>
      </header>

      {currentTab === "wallet" && <MiniWallet />}
      {currentTab === "payments" && <PaymentsHistory />}
      {currentTab === "payouts" && <PayoutStripeCard />}
    </div>
  );
}

// ---------- Mini Portefeuille ----------
function MiniWallet() {
  const [balance] = useState(0);
  const [pendingBalance] = useState(0);

  return (
    <div className="space-y-6">
      {/* Carte solde principal */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-300">Solde disponible</p>
            <p className="mt-1 text-3xl font-bold">{balance.toFixed(2)} €</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <WalletIcon className="h-6 w-6 text-white" />
          </div>
        </div>

        {pendingBalance > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <ClockIcon className="h-4 w-4 text-amber-300" />
            <span className="text-sm text-gray-300">
              {pendingBalance.toFixed(2)} € en attente
            </span>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
          >
            Retirer
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Historique
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <ArrowDownIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total reçu</p>
              <p className="text-lg font-semibold text-gray-900">0.00 €</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
              <ArrowUpIcon className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total retiré</p>
              <p className="text-lg font-semibold text-gray-900">0.00 €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Transactions récentes</h3>
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <BanknotesIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="mt-3 text-sm text-gray-500">Aucune transaction pour le moment</p>
          <p className="mt-1 text-xs text-gray-400">
            Vos transactions apparaîtront ici une fois que vous aurez reçu des paiements
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Historique des paiements ----------
type Payment = {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  date: string;
  description: string;
};

function PaymentsHistory() {
  const [filter, setFilter] = useState<"all" | "past" | "upcoming">("all");

  // Données simulées
  const [payments] = useState<Payment[]>([]);

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    const paymentDate = new Date(p.date);
    const now = new Date();
    if (filter === "past") return paymentDate < now;
    if (filter === "upcoming") return paymentDate >= now;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-2">
        {(["all", "past", "upcoming"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Tous" : f === "past" ? "Passés" : "À venir"}
          </button>
        ))}
      </div>

      {/* Liste des paiements */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <CreditCardIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">Aucun paiement</p>
            <p className="mt-1 text-xs text-gray-500">
              {filter === "upcoming"
                ? "Aucun paiement à venir"
                : filter === "past"
                ? "Aucun paiement passé"
                : "Vos paiements apparaîtront ici"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      payment.type === "incoming" ? "bg-emerald-100" : "bg-rose-100"
                    }`}
                  >
                    {payment.type === "incoming" ? (
                      <ArrowDownIcon className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowUpIcon className="h-5 w-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      payment.type === "incoming" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {payment.type === "incoming" ? "+" : "-"}
                    {payment.amount.toFixed(2)} {payment.currency}
                  </p>
                  <div className="mt-0.5 flex items-center justify-end gap-1">
                    {payment.status === "completed" ? (
                      <>
                        <CheckCircleIcon className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600">Complété</span>
                      </>
                    ) : payment.status === "pending" ? (
                      <>
                        <ClockIcon className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-600">En attente</span>
                      </>
                    ) : (
                      <span className="text-xs text-rose-600">Échoué</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Versements Stripe ----------
function PayoutStripeCard() {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleConfigure() {
    try {
      setLoading(true);
      const res = await fetch("/api/host/stripe/payout-link", {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(
          json.error ?? t.paymentsPage?.errorStartingPayouts ?? "Erreur",
        );
      }

      window.location.href = json.url;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : t.paymentsPage?.errorRedirectStripe ?? "Erreur de redirection",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Carte configuration Stripe */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              {t.paymentsPage?.stripePayouts || "Versements Stripe"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t.paymentsPage?.stripePayoutsDesc || "Configurez votre compte Stripe pour recevoir vos paiements directement sur votre compte bancaire."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfigure}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 transition"
        >
          {loading ? (t.paymentsPage?.redirectingToStripe || "Redirection...") : (t.paymentsPage?.configurePayouts || "Configurer les versements")}
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">
          {t.paymentsPage?.stripeRedirectNote || "Vous serez redirigé vers Stripe pour compléter la configuration."}
        </p>
      </div>

      {/* Infos sur les versements */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Comment fonctionnent les versements ?</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Recevez des réservations</p>
              <p className="text-xs text-gray-500">Les paiements des voyageurs sont sécurisés par Stripe</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Fonds disponibles après le check-in</p>
              <p className="text-xs text-gray-500">24h après l&apos;arrivée du voyageur</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Versement automatique</p>
              <p className="text-xs text-gray-500">Reçu sur votre compte bancaire sous 2-7 jours ouvrés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
