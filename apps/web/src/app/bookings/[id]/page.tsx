// apps/web/src/app/bookings/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadStripe,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import PayPalButton from "@/components/PayPalButton";

type Currency = "EUR" | "CAD";
type PaymentMethod = "stripe" | "paypal";

type CreateIntentResponse = {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
  currency: Currency;
  fees: {
    hostFeeCents: number;
    guestFeeCents: number;
    taxOnGuestFeeCents: number;
    stripeFeeEstimateCents: number;
    platformNetCents: number;
    region: string;
  };
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// On prépare la promesse Stripe une seule fois (si la clé est présente)
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function formatMoney(amountCents: number, currency: Currency) {
  const value = amountCents / 100;
  const locale = currency === "EUR" ? "fr-FR" : "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Icône Stripe
 */
function StripeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  );
}

/**
 * Icône PayPal
 */
function PayPalIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
    </svg>
  );
}

/**
 * Sélecteur de méthode de paiement
 */
function PaymentMethodSelector({
  selected,
  onChange,
  stripeAvailable,
  paypalAvailable,
}: {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  stripeAvailable: boolean;
  paypalAvailable: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-900">
        Choisissez votre methode de paiement
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Option Stripe (Carte bancaire) */}
        {stripeAvailable && (
          <button
            type="button"
            onClick={() => onChange("stripe")}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
              selected === "stripe"
                ? "border-black bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selected === "stripe" ? "bg-black text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">
                Carte bancaire
              </p>
              <p className="text-xs text-gray-500">Visa, Mastercard, etc.</p>
            </div>
            {selected === "stripe" && (
              <svg className="ml-auto h-5 w-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}

        {/* Option PayPal */}
        {paypalAvailable && (
          <button
            type="button"
            onClick={() => onChange("paypal")}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
              selected === "paypal"
                ? "border-[#0070ba] bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selected === "paypal" ? "bg-[#0070ba] text-white" : "bg-gray-100 text-[#0070ba]"
              }`}
            >
              <PayPalIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">PayPal</p>
              <p className="text-xs text-gray-500">
                Paiement securise
              </p>
            </div>
            {selected === "paypal" && (
              <svg className="ml-auto h-5 w-5 text-[#0070ba]" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Formulaire interne qui affiche le PaymentElement Stripe
 * et confirme le paiement.
 */
function StripePaymentForm(props: {
  bookingId: string;
  clientSecret: string;
  amountCents: number;
  currency: Currency;
}) {
  const { amountCents, currency } = props;
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: undefined,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error(error);
        toast.error(error.message ?? t.payment.paymentFailed);
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        toast.success(t.payment.paymentConfirmed);
        router.push("/bookings?paid=1");
        return;
      }

      if (paymentIntent?.status === "processing") {
        toast(t.payment.paymentProcessing);
        router.push("/bookings?processing=1");
        return;
      }

      toast.error(t.payment.paymentFailed);
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error(t.payment.unexpectedError);
      setSubmitting(false);
    }
  }

  const payButtonText = t.payment.pay.replace("{amount}", formatMoney(amountCents, currency));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t.payment.paying : payButtonText}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>{t.payment.securePayment}</span>
        <StripeIcon className="ml-1 h-4 w-4 text-gray-400" />
      </div>
    </form>
  );
}

/**
 * Résumé des frais
 */
function FeesSummary({
  fees,
  currency,
}: {
  fees: CreateIntentResponse["fees"];
  currency: Currency;
}) {
  const { t } = useTranslation();

  return (
    <aside className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-700 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{t.payment.lokroomDetail}</p>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>{t.payment.hostServiceFee}</span>
          <span>{formatMoney(fees.hostFeeCents, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.payment.guestServiceFee}</span>
          <span>{formatMoney(fees.guestFeeCents, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.payment.guestTaxes}</span>
          <span>{formatMoney(fees.taxOnGuestFeeCents, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.payment.stripeFeeEstimate}</span>
          <span>{formatMoney(fees.stripeFeeEstimateCents, currency)}</span>
        </div>

        <div className="mt-2 border-t border-gray-200 pt-2">
          <div className="flex justify-between font-semibold text-gray-900">
            <span>{t.payment.platformMargin}</span>
            <span>{formatMoney(fees.platformNetCents, currency)}</span>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-gray-500">
          {t.payment.taxRegion}: <span className="font-medium">{fees.region}</span>
        </p>

        <p className="mt-2 text-[11px] text-gray-500">{t.payment.amountIncludesFees}</p>
      </div>
    </aside>
  );
}

/**
 * Page de paiement d'une réservation
 */
export default function BookingPaymentPage({
  params,
}: {
  params: { id: string };
}) {
  const bookingId = params.id;
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<CreateIntentResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");

  // Déterminer les méthodes de paiement disponibles
  const stripeAvailable = !!publishableKey && !!stripePromise;
  const paypalAvailable = !!paypalClientId;

  // Si une seule méthode est disponible, la sélectionner par défaut
  useEffect(() => {
    if (!stripeAvailable && paypalAvailable) {
      setPaymentMethod("paypal");
    } else if (stripeAvailable && !paypalAvailable) {
      setPaymentMethod("stripe");
    }
  }, [stripeAvailable, paypalAvailable]);

  // Récupère clientSecret + montant via l'endpoint /api/bookings/[id]/pay
  useEffect(() => {
    async function loadIntent() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bookings/${bookingId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = (await res.json().catch(() => null)) as
          | CreateIntentResponse
          | { error?: string }
          | null;

        if (!res.ok || !data || !(data as CreateIntentResponse).clientSecret) {
          const msg = (data as { error?: string })?.error ?? t.payment.initPaymentError;
          setError(msg);
          setLoading(false);
          return;
        }

        setIntent(data as CreateIntentResponse);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(t.payment.unexpectedLoadError);
        setLoading(false);
      }
    }

    void loadIntent();
  }, [bookingId, t.payment.initPaymentError, t.payment.unexpectedLoadError]);

  const options: StripeElementsOptions | undefined = useMemo(() => {
    if (!intent?.clientSecret) return undefined;

    return {
      clientSecret: intent.clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#000000",
          colorPrimaryText: "#ffffff",
          borderRadius: "12px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        },
        rules: {
          ".Input": {
            borderRadius: "12px",
          },
          ".Tab": {
            borderRadius: "12px",
          },
        },
      },
    };
  }, [intent?.clientSecret]);

  // Callback pour le succès PayPal
  const handlePayPalSuccess = (data: { bookingId: string; captureId: string }) => {
    router.push("/bookings?paid=1");
  };

  // Aucune méthode de paiement disponible
  if (!stripeAvailable && !paypalAvailable) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 2xl:max-w-4xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            Aucune methode de paiement n&apos;est configuree. Veuillez contacter le support.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 2xl:max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
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
            <span className="text-sm text-gray-600">{t.payment.initializingPayment}</span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !intent) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 2xl:max-w-4xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error ?? t.payment.loadPaymentError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-red-700 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 2xl:max-w-4xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.payment.completePayment}</h1>
        <p className="text-sm text-gray-600">
          {t.payment.totalAmount}{" "}
          <span className="font-medium text-gray-900">
            {formatMoney(intent.amountCents, intent.currency)}
          </span>
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr,1.4fr]">
        <div className="space-y-6">
          {/* Sélecteur de méthode de paiement */}
          {stripeAvailable && paypalAvailable && (
            <PaymentMethodSelector
              selected={paymentMethod}
              onChange={setPaymentMethod}
              stripeAvailable={stripeAvailable}
              paypalAvailable={paypalAvailable}
            />
          )}

          {/* Formulaire de paiement selon la méthode sélectionnée */}
          <div className="min-h-[200px]">
            {paymentMethod === "stripe" && stripeAvailable && options && (
              <Elements stripe={stripePromise} options={options}>
                <StripePaymentForm
                  bookingId={intent.bookingId}
                  clientSecret={intent.clientSecret}
                  amountCents={intent.amountCents}
                  currency={intent.currency}
                />
              </Elements>
            )}

            {paymentMethod === "paypal" && paypalAvailable && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <PayPalButton
                  bookingId={intent.bookingId}
                  amountCents={intent.amountCents}
                  currency={intent.currency}
                  onSuccess={handlePayPalSuccess}
                />
              </div>
            )}
          </div>
        </div>

        {/* Résumé des frais */}
        <FeesSummary fees={intent.fees} currency={intent.currency} />
      </section>

      {/* Badges de sécurité */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Paiement 100% sécurisé</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Données chiffrées SSL</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <span>Conforme PCI DSS</span>
        </div>
      </div>
    </main>
  );
}
