// apps/web/src/lib/stripe.ts
import Stripe from "stripe";

// On lit la clé une fois, on la valide, et on la réutilise
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  throw new Error("STRIPE_SECRET_KEY manquant dans .env.local");
}

// Si ton TS chipote sur apiVersion (littéral de string),
// on le type comme le champ de config attendu.
type ApiVersion = Stripe.StripeConfig["apiVersion"];

export const stripe = new Stripe(STRIPE_KEY, {
  // tu peux mettre à jour la date si tu changes de version dans Stripe
  apiVersion: "2024-06-20" as ApiVersion,
});
