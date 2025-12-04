"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

type Tab = "payments" | "payouts";

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

  // 🔹 on lit paymentsTab (et plus tab)
  const currentTab: Tab =
    (searchParams.get("paymentsTab") as Tab) ?? "payments";

  function setTab(tab: Tab) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("paymentsTab", tab);
    sp.delete("step");

    // 🔹 important : on ne change PAS le pathname, juste la query
    router.replace(`?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">{t.paymentsPage.title}</h2>
        <p className="text-sm text-gray-600">
          {t.paymentsPage.subtitle}
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
            {t.paymentsPage.paymentsTab}
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
            {t.paymentsPage.payoutsTab}
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

function PaymentsHistoryPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
      <p className="mb-2 font-medium">{t.paymentsPage.yourPayments}</p>
      <p className="text-gray-500">
        {t.paymentsPage.paymentsDescription}
      </p>
      <p className="mt-2 text-gray-400">
        {t.paymentsPage.paymentsPlaceholder}
      </p>
    </div>
  );
}

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
          json.error ?? t.paymentsPage.errorStartingPayouts,
        );
      }

      window.location.href = json.url;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : t.paymentsPage.errorRedirectStripe,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
      <p className="mb-1 text-sm font-medium">{t.paymentsPage.stripePayouts}</p>
      <p className="text-sm text-gray-500">
        {t.paymentsPage.stripePayoutsDesc}
      </p>

      <button
        type="button"
        onClick={handleConfigure}
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? t.paymentsPage.redirectingToStripe : t.paymentsPage.configurePayouts}
      </button>

      <p className="text-xs text-gray-400">
        {t.paymentsPage.stripeRedirectNote}
      </p>
    </div>
  );
}
