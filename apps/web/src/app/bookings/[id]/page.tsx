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

type Currency = "EUR" | "CAD";

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
 * Formulaire interne qui affiche le PaymentElement
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Pas de redirection Stripe : on gère tout dans l’app
          return_url: undefined,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error(error);
        toast.error(
          error.message ?? "Le paiement n’a pas pu être confirmé."
        );
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        toast.success(
          "Paiement confirmé, ta réservation est validée ✅"
        );
        router.push("/bookings?paid=1");
        return;
      }

      if (paymentIntent?.status === "processing") {
        toast("Paiement en cours de traitement…");
        router.push("/bookings?processing=1");
        return;
      }

      toast.error("Le paiement n’a pas pu être confirmé.");
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur inattendue lors du paiement.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Paiement en cours…"
          : `Payer ${formatMoney(amountCents, currency)}`}
      </button>

      <p className="text-[11px] text-gray-500">
        Le paiement est sécurisé par Stripe. Lok&apos;Room ne stocke
        jamais tes informations de carte.
      </p>
    </form>
  );
}

/**
 * Page de paiement d’une réservation
 */
export default function BookingPaymentPage({
  params,
}: {
  params: { id: string };
}) {
  const bookingId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<CreateIntentResponse | null>(null);

  // Récupère clientSecret + montant via l’endpoint /api/bookings/[id]/pay
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
          const msg =
            (data as any)?.error ??
            "Impossible d’initialiser le paiement pour cette réservation.";
          setError(msg);
          setLoading(false);
          return;
        }

        setIntent(data as CreateIntentResponse);
      } catch (err) {
        console.error(err);
        setError(
          "Erreur inattendue lors du chargement des informations de paiement."
        );
        setLoading(false);
      }
    }

    void loadIntent();
  }, [bookingId]);

  const options: StripeElementsOptions | undefined = useMemo(() => {
    if (!intent?.clientSecret) return undefined;

    return {
      clientSecret: intent.clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#000000",
          colorPrimaryText: "#ffffff",
          borderRadius: "9999px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        },
        rules: {
          ".Input": {
            borderRadius: "9999px",
          },
          ".Tab": {
            borderRadius: "9999px",
          },
        },
      },
    };
  }, [intent?.clientSecret]);

  if (!publishableKey || !stripePromise) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-red-600">
          Clé Stripe publique manquante (
          <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>).
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-gray-600">
          Initialisation du paiement…
        </p>
      </main>
    );
  }

  if (error || !intent || !options) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-red-600">
          {error ?? "Impossible de charger les informations de paiement."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Finalise ton paiement</h1>
        <p className="text-sm text-gray-600">
          Montant total de la réservation :{" "}
          <span className="font-medium text-gray-900">
            {formatMoney(intent.amountCents, intent.currency)}
          </span>
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr,1.4fr]">
        <div>
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentForm
              bookingId={intent.bookingId}
              clientSecret={intent.clientSecret}
              amountCents={intent.amountCents}
              currency={intent.currency}
            />
          </Elements>
        </div>

        {/* Petit résumé des frais façon Airbnb */}
        <aside className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-700 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            Détail Lok&apos;Room
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Frais de service hôte</span>
              <span>
                {formatMoney(intent.fees.hostFeeCents, intent.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Frais de service voyageur</span>
              <span>
                {formatMoney(intent.fees.guestFeeCents, intent.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (part voyageur)</span>
              <span>
                {formatMoney(intent.fees.taxOnGuestFeeCents, intent.currency)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Frais Stripe estimés</span>
              <span>
                {formatMoney(
                  intent.fees.stripeFeeEstimateCents,
                  intent.currency
                )}
              </span>
            </div>

            <div className="mt-2 border-t border-gray-200 pt-2">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Marge plateforme (estimée)</span>
                <span>
                  {formatMoney(intent.fees.platformNetCents, intent.currency)}
                </span>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-gray-500">
              Région fiscale estimée :{" "}
              <span className="font-medium">{intent.fees.region}</span>
            </p>

            <p className="mt-2 text-[11px] text-gray-500">
              Le montant inclut les frais de service Lok&apos;Room et les
              éventuelles taxes applicables.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
