"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/lib/logger";
import {
  CreditCardIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  WalletIcon,
  ChevronLeftIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type Tab = "wallet" | "payments" | "payouts";
type PaymentProvider = "STRIPE" | "PAYPAL";

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="space-y-4">
            <div className="h-6 w-40 rounded bg-gray-100" />
            <div className="h-10 w-64 rounded-full bg-gray-100" />
            <div className="h-32 rounded-2xl border border-gray-200 bg-white" />
          </div>
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Retour aux parametres
        </Link>
      </div>

      <div className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">{t.paymentsPage?.title || "Paiements et portefeuille"}</h2>
          <p className="text-sm text-gray-600">
            {t.paymentsPage?.subtitle || "Gerez votre portefeuille, vos paiements et vos versements"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("wallet")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                currentTab === "wallet"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <WalletIcon className="h-4 w-4" />
              Portefeuille
            </button>
            <button
              type="button"
              onClick={() => setTab("payments")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                currentTab === "payments"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <CreditCardIcon className="h-4 w-4" />
              {t.paymentsPage?.paymentsTab || "Paiements"}
            </button>
            <button
              type="button"
              onClick={() => setTab("payouts")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                currentTab === "payouts"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
    </div>
  );
}

// ---------- Icones de provider ----------
function StripeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  );
}

function PayPalIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
    </svg>
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
            <p className="mt-1 text-3xl font-bold">{balance.toFixed(2)} EUR</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <WalletIcon className="h-6 w-6 text-white" />
          </div>
        </div>

        {pendingBalance > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <ClockIcon className="h-4 w-4 text-amber-300" />
            <span className="text-sm text-gray-300">
              {pendingBalance.toFixed(2)} EUR en attente
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
              <p className="text-xs text-gray-500">Total recu</p>
              <p className="text-lg font-semibold text-gray-900">0.00 EUR</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
              <ArrowUpIcon className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total retire</p>
              <p className="text-lg font-semibold text-gray-900">0.00 EUR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions recentes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Transactions recentes</h3>
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <BanknotesIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="mt-3 text-sm text-gray-500">Aucune transaction pour le moment</p>
          <p className="mt-1 text-xs text-gray-400">
            Vos transactions apparaitront ici une fois que vous aurez recu des paiements
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
  status: "pending" | "completed" | "failed" | "refunded";
  date: string;
  description: string;
  provider: PaymentProvider;
  bookingId?: string;
};

function PaymentsHistory() {
  const [filter, setFilter] = useState<"all" | "stripe" | "paypal">("all");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Charger les paiements depuis l'API
  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const res = await fetch("/api/account/payments");
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (error) {
        logger.error("Failed to load payments:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    if (filter === "stripe") return p.provider === "STRIPE";
    if (filter === "paypal") return p.provider === "PAYPAL";
    return true;
  });

  const getStatusBadge = (status: Payment["status"]) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-600">Complete</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-amber-600">En attente</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1">
            <XCircleIcon className="h-3 w-3 text-rose-500" />
            <span className="text-xs text-rose-600">Echoue</span>
          </div>
        );
      case "refunded":
        return (
          <div className="flex items-center gap-1">
            <ArrowUpIcon className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-blue-600">Rembourse</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getProviderIcon = (provider: PaymentProvider) => {
    if (provider === "PAYPAL") {
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0070ba]/10">
          <PayPalIcon className="h-3.5 w-3.5 text-[#0070ba]" />
        </div>
      );
    }
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100">
        <StripeIcon className="h-3.5 w-3.5 text-indigo-600" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtres par provider */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setFilter("stripe")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === "stripe"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <StripeIcon className="h-3.5 w-3.5" />
          Carte
        </button>
        <button
          type="button"
          onClick={() => setFilter("paypal")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === "paypal"
              ? "bg-[#0070ba] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <PayPalIcon className="h-3.5 w-3.5" />
          PayPal
        </button>
      </div>

      {/* Liste des paiements */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-gray-500">Chargement...</span>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <CreditCardIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">Aucun paiement</p>
            <p className="mt-1 text-xs text-gray-500">
              {filter === "stripe"
                ? "Aucun paiement par carte"
                : filter === "paypal"
                ? "Aucun paiement PayPal"
                : "Vos paiements apparaitront ici"}
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                      {getProviderIcon(payment.provider)}
                    </div>
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
                  <div className="mt-0.5 flex items-center justify-end">
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legende des providers */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100">
            <StripeIcon className="h-3 w-3 text-indigo-600" />
          </div>
          <span>Carte bancaire (Stripe)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#0070ba]/10">
            <PayPalIcon className="h-3 w-3 text-[#0070ba]" />
          </div>
          <span>PayPal</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Versements Stripe ----------
type StripeStatus = {
  configured: boolean;
  payoutsEnabled: boolean;
  kycStatus: string | null;
  bankAccount: {
    last4: string;
    bankName: string;
    country: string;
    currency: string;
  } | null;
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirements?: {
    currentlyDue: string[];
    pendingVerification: string[];
  };
};

function PayoutStripeCard() {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const { t } = useTranslation();

  // Charger le statut au montage
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/host/stripe/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (error) {
        logger.error("Failed to load Stripe status:", error);
      } finally {
        setStatusLoading(false);
      }
    }

    void loadStatus();
  }, []);

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

      // Redirection vers Stripe
      window.location.href = json.url;
    } catch (err) {
      logger.error("Failed to redirect to Stripe", { error: err instanceof Error ? err.message : String(err) });
      toast.error(
        err instanceof Error
          ? err.message
          : t.paymentsPage?.errorRedirectStripe ?? "Erreur de redirection",
      );
    } finally {
      setLoading(false);
    }
  }

  const isConfigured = status?.configured && status?.payoutsEnabled && status?.bankAccount;

  return (
    <div className="space-y-6">
      {/* Carte configuration Stripe */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isConfigured ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
            {isConfigured ? (
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
            ) : (
              <StripeIcon className="h-6 w-6 text-indigo-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              {t.paymentsPage?.stripePayouts || "Versements Stripe"}
            </h3>
            {statusLoading ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                <span className="text-sm text-gray-500">Chargement...</span>
              </div>
            ) : isConfigured && status?.bankAccount ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 font-medium">Versements configurés</span>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-1">Compte bancaire</p>
                  <p className="text-sm font-medium text-gray-900">
                    {status.bankAccount.bankName} •••• {status.bankAccount.last4}
                  </p>
                  {status.bankAccount.country && (
                    <p className="text-xs text-gray-500 mt-1">
                      {status.bankAccount.country} - {status.bankAccount.currency}
                    </p>
                  )}
                </div>
              </div>
            ) : status?.configured && !status?.payoutsEnabled ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600 font-medium">Configuration incomplète</span>
                </div>
                <p className="text-sm text-gray-500">
                  Veuillez compléter la configuration de votre compte Stripe pour recevoir vos versements.
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                {t.paymentsPage?.stripePayoutsDesc || "Configurez votre compte Stripe pour recevoir vos paiements directement sur votre compte bancaire."}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfigure}
          disabled={loading || statusLoading}
          className={`mt-6 w-full rounded-xl px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isConfigured
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-900 text-white hover:bg-black"
          }`}
        >
          {loading
            ? (t.paymentsPage?.redirectingToStripe || "Redirection...")
            : isConfigured
            ? "Modifier les informations bancaires"
            : (t.paymentsPage?.configurePayouts || "Configurer les versements")}
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">
          {t.paymentsPage?.stripeRedirectNote || "Vous serez redirige vers Stripe pour completer la configuration."}
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
              <p className="text-sm font-medium text-gray-900">Recevez des reservations</p>
              <p className="text-xs text-gray-500">Les paiements des voyageurs sont securises par Stripe ou PayPal</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Fonds disponibles apres le check-in</p>
              <p className="text-xs text-gray-500">24h apres l&apos;arrivee du voyageur</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Versement automatique</p>
              <p className="text-xs text-gray-500">Recu sur votre compte bancaire sous 2-7 jours ouvres</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info PayPal */}
      <div className="rounded-2xl border border-[#0070ba]/20 bg-[#0070ba]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0070ba]/10">
            <PayPalIcon className="h-5 w-5 text-[#0070ba]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Paiements PayPal</p>
            <p className="mt-1 text-xs text-gray-600">
              Les paiements recus via PayPal sont automatiquement credites sur votre portefeuille Lok&apos;Room.
              Vous pouvez ensuite les retirer vers votre compte bancaire via Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
