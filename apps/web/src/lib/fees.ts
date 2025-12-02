// apps/web/src/lib/fees.ts
// Moteur de frais Lok'Room — version ULTRA PRO
//
// - Support EUR (FR) + CAD (Canada par provinces)
// - Barèmes dynamiques par région + tranches de prix
// - Ajustement par type de booking (séjour, parking, cowork, meeting, etc.)
// - Réduction Superhost côté hôte
// - Planchers & plafonds de frais (host/guest)
// - Estimation Stripe configurable via .env
// - Fonction inferRegion pour convertir pays/province → Region interne

import type { Currency as MoneyCurrency } from "./currency";

// -------------------- Types publics (compat) --------------------

// On réutilise exactement le même type que dans lib/currency
export type Currency = MoneyCurrency;

export type RegionFR = "FRANCE";
export type RegionCA = "AB" | "BC" | "ON" | "QC" | "ATL"; // NB/NS/NL/PE → ATL

export type Region = RegionFR | RegionCA;

/**
 * Type de réservation (on pourra le mapper avec Listing.category côté app).
 * - "stay"     : hébergement (chambre, appart, maison…)
 * - "parking"  : parking, box, place extérieure
 * - "cowork"   : poste de travail, open space, bureau
 * - "meeting"  : salle de réunion, studio, salle événementielle
 */
export type BookingKind = "stay" | "parking" | "cowork" | "meeting";

export type FeeInput = {
  /** Prix de base (hors frais) en cents, dans la devise locale de l’annonce. */
  priceCents: number;

  /** Devise locale de l’annonce. */
  currency: Currency;

  /** Région fiscale/logique (FRANCE, AB, BC, ON, QC, ATL). */
  region: Region;

  /**
   * Type de réservation (facultatif).
   * Si absent, on considère "stay".
   */
  bookingKind?: BookingKind;

  /**
   * L’hôte est-il Superhost ?
   * Si true → réduction de la commission host.
   */
  isSuperhost?: boolean;

  /**
   * Optionnel : override manuel des taux si un jour
   * tu veux appliquer une promo spécifique.
   */
  overrideRates?: {
    hostPct?: number; // 0.02 = 2 %
    guestPct?: number;
    taxRate?: number;
  };
};

export type FeeBreakdown = {
  // Taux (après application type + superhost + override)
  hostPct: number;
  guestPct: number;

  // Frais bruts Lok'Room côté hôte & voyageur
  hostFeeCents: number;
  guestFeeCents: number;

  // Taxes collectées sur les frais guest
  taxOnGuestFeeCents: number;

  // Montant débité au client (base + frais + taxes sur frais)
  chargeCents: number;

  // Montant crédité au wallet de l'hôte (avant éventuels refunds)
  hostPayoutCents: number;

  // Estimation des frais Stripe (process + fixed fee)
  stripeEstimateCents: number;

  // Infos supplémentaires utiles pour l’analytics / marge
  platformGrossCents: number; // hostFee + guestFee + taxOnGuestFee
  platformNetCents: number; // platformGross - stripeEstimate

  currency: Currency;
  region: Region;

  // Traces pour debug/analytics
  meta: {
    bookingKind: BookingKind;
    isSuperhost: boolean;
    raw: {
      baseHostPct: number;
      baseGuestPct: number;
      baseTaxRate: number;
      bookingKindHostMultiplier: number;
      bookingKindGuestMultiplier: number;
      superhostHostMultiplier: number;
    };
  };
};

// -------------------- Config Stripe --------------------

// On garde la config via .env pour pouvoir ajuster sans redeploy
const STRIPE_PCT_EU =
  Number(process.env.NEXT_PUBLIC_STRIPE_PCT_EU ?? 1.4) / 100; // 0.014
const STRIPE_FIX_EUR = Number(process.env.NEXT_PUBLIC_STRIPE_FIX_EUR ?? 25); // 25 cents

const STRIPE_PCT_CA =
  Number(process.env.NEXT_PUBLIC_STRIPE_PCT_CA ?? 2.9) / 100; // 0.029
const STRIPE_FIX_CAD = Number(process.env.NEXT_PUBLIC_STRIPE_FIX_CAD ?? 30); // 30 cents

// Pour l’instant :
// - EUR → config EU
// - CAD → config CA
// - USD / GBP / CNY → on réutilise la config EU (simple, ça évite de tout
//   reparamétrer maintenant, tu pourras affiner plus tard).
const STRIPE_CONFIG: Record<Currency, { pct: number; fix: number }> = {
  EUR: {
    pct: STRIPE_PCT_EU,
    fix: STRIPE_FIX_EUR,
  },
  CAD: {
    pct: STRIPE_PCT_CA,
    fix: STRIPE_FIX_CAD,
  },
  USD: {
    pct: STRIPE_PCT_EU,
    fix: STRIPE_FIX_EUR,
  },
  GBP: {
    pct: STRIPE_PCT_EU,
    fix: STRIPE_FIX_EUR,
  },
  CNY: {
    pct: STRIPE_PCT_EU,
    fix: STRIPE_FIX_EUR,
  },
};

// -------------------- Planchers / plafonds --------------------

// Frais min / max pour éviter des valeurs ridicules.
// Pour les nouvelles devises, on part sur quelque chose de proche de l’EUR,
// tu pourras affiner ensuite.
const HOST_MIN_FEE: Record<Currency, number> = {
  EUR: 30, // 0,30 €
  CAD: 50, // 0,50 $
  USD: 30,
  GBP: 30,
  CNY: 30,
};

const GUEST_MIN_FEE: Record<Currency, number> = {
  EUR: 50, // 0,50 €
  CAD: 75, // 0,75 $
  USD: 50,
  GBP: 50,
  CNY: 50,
};

// Plafonds de frais (tu pourras ajuster plus tard si tu veux)
const HOST_MAX_FEE: Record<Currency, number> = {
  EUR: 2500, // 25 €
  CAD: 3500, // 35 $
  USD: 2500,
  GBP: 2500,
  CNY: 2500,
};

const GUEST_MAX_FEE: Record<Currency, number> = {
  EUR: 5000, // 50 €
  CAD: 7000, // 70 $
  USD: 5000,
  GBP: 5000,
  CNY: 5000,
};

// -------------------- Multiplicateurs BookingKind --------------------

// On ajuste légèrement les taux selon le type de réservation
const BOOKING_KIND_MULTIPLIER: Record<
  BookingKind,
  { host: number; guest: number }
> = {
  // Hébergement classique
  stay: { host: 1.0, guest: 1.0 },

  // Parking → marges plus faibles
  parking: { host: 0.7, guest: 0.7 },

  // Coworking → un peu plus de gestion → taux légèrement supérieurs
  cowork: { host: 1.1, guest: 1.05 },

  // Meeting / évènementiel → taux les plus élevés
  meeting: { host: 1.15, guest: 1.1 },
};

// Superhost : réduction sur la part Host uniquement
const SUPERHOST_HOST_DISCOUNT = 0.85; // -15 % sur la commission host

// -------------------- Barèmes de base (comme ton fichier actuel) --------------------

// France (EUR)
function pickRatesFR(priceCents: number) {
  const p = priceCents / 100;
  if (p < 20) return { hostPct: 0.03, guestPct: 0.115, taxRate: 0.2 };
  if (p < 60) return { hostPct: 0.027, guestPct: 0.105, taxRate: 0.2 };
  if (p < 150) return { hostPct: 0.023, guestPct: 0.098, taxRate: 0.2 };
  if (p < 300) return { hostPct: 0.021, guestPct: 0.085, taxRate: 0.2 };
  return { hostPct: 0.02, guestPct: 0.075, taxRate: 0.2 };
}

// Canada (CAD) — par province
function pickRatesCA(priceCents: number, province: RegionCA) {
  const p = priceCents / 100;

  const taxRates: Record<RegionCA, number> = {
    AB: 0.05,
    BC: 0.12,
    ON: 0.13,
    QC: 0.14975,
    ATL: 0.15,
  };

  const t = taxRates[province];

  if (province === "AB") {
    if (p < 20) return { hostPct: 0.027, guestPct: 0.098, taxRate: t };
    if (p < 60) return { hostPct: 0.024, guestPct: 0.088, taxRate: t };
    if (p < 150) return { hostPct: 0.022, guestPct: 0.082, taxRate: t };
    if (p < 300) return { hostPct: 0.02, guestPct: 0.078, taxRate: t };
    return { hostPct: 0.018, guestPct: 0.073, taxRate: t };
  }
  if (province === "BC") {
    if (p < 20) return { hostPct: 0.028, guestPct: 0.103, taxRate: t };
    if (p < 60) return { hostPct: 0.025, guestPct: 0.092, taxRate: t };
    if (p < 150) return { hostPct: 0.023, guestPct: 0.085, taxRate: t };
    if (p < 300) return { hostPct: 0.021, guestPct: 0.08, taxRate: t };
    return { hostPct: 0.019, guestPct: 0.075, taxRate: t };
  }
  if (province === "ON") {
    if (p < 20) return { hostPct: 0.029, guestPct: 0.108, taxRate: t };
    if (p < 60) return { hostPct: 0.026, guestPct: 0.098, taxRate: t };
    if (p < 150) return { hostPct: 0.024, guestPct: 0.092, taxRate: t };
    if (p < 300) return { hostPct: 0.022, guestPct: 0.087, taxRate: t };
    return { hostPct: 0.02, guestPct: 0.08, taxRate: t };
  }
  if (province === "QC") {
    if (p < 20) return { hostPct: 0.03, guestPct: 0.115, taxRate: t };
    if (p < 60) return { hostPct: 0.027, guestPct: 0.105, taxRate: t };
    if (p < 150) return { hostPct: 0.024, guestPct: 0.095, taxRate: t };
    if (p < 300) return { hostPct: 0.022, guestPct: 0.09, taxRate: t };
    return { hostPct: 0.02, guestPct: 0.082, taxRate: t };
  }
  // ATL = NB / NS / NL / PE
  if (province === "ATL") {
    if (p < 20) return { hostPct: 0.03, guestPct: 0.115, taxRate: t };
    if (p < 60) return { hostPct: 0.028, guestPct: 0.105, taxRate: t };
    if (p < 150) return { hostPct: 0.025, guestPct: 0.098, taxRate: t };
    if (p < 300) return { hostPct: 0.023, guestPct: 0.09, taxRate: t };
    return { hostPct: 0.021, guestPct: 0.083, taxRate: t };
  }

  // Fallback
  return { hostPct: 0.025, guestPct: 0.09, taxRate: t };
}

// -------------------- Helpers internes --------------------

function clampFee(
  value: number,
  currency: Currency,
  minMap: Record<Currency, number>,
  maxMap: Record<Currency, number>,
): number {
  const min = minMap[currency];
  const max = maxMap[currency];
  return Math.min(Math.max(value, min), max);
}

function pickBaseRates(
  priceCents: number,
  currency: Currency,
  region: Region,
): { hostPct: number; guestPct: number; taxRate: number } {
  if (currency === "EUR") {
    return pickRatesFR(priceCents);
  }

  // Pour l’instant, toutes les autres devises sont traitées comme le Canada
  // (CAD) au niveau des barèmes. Tu pourras raffiner plus tard.
  return pickRatesCA(priceCents, region as RegionCA);
}

// -------------------- Moteur principal --------------------

export function computeFees(input: FeeInput): FeeBreakdown {
  const {
    priceCents,
    currency,
    region,
    bookingKind = "stay",
    isSuperhost = false,
    overrideRates,
  } = input;

  if (priceCents <= 0) {
    throw new Error("computeFees: priceCents must be > 0");
  }

  // 1) Barème de base selon la région + price band
  const base = pickBaseRates(priceCents, currency, region);

  let hostPct = base.hostPct;
  let guestPct = base.guestPct;
  let taxRate = base.taxRate;

  // 2) Ajustement selon BookingKind (stay / parking / cowork / meeting)
  const kindMult = BOOKING_KIND_MULTIPLIER[bookingKind] ?? {
    host: 1,
    guest: 1,
  };

  hostPct *= kindMult.host;
  guestPct *= kindMult.guest;

  // 3) Réduction Superhost (uniquement sur la part Host)
  const superhostHostMultiplier = isSuperhost ? SUPERHOST_HOST_DISCOUNT : 1;
  hostPct *= superhostHostMultiplier;

  // 4) Overrides manuels (si fournis)
  if (overrideRates?.hostPct != null) hostPct = overrideRates.hostPct;
  if (overrideRates?.guestPct != null) guestPct = overrideRates.guestPct;
  if (overrideRates?.taxRate != null) taxRate = overrideRates.taxRate;

  // 5) Calcul des frais bruts
  let hostFeeCents = Math.ceil(priceCents * hostPct);
  let guestFeeCents = Math.ceil(priceCents * guestPct);

  // 6) Application des planchers / plafonds
  hostFeeCents = clampFee(hostFeeCents, currency, HOST_MIN_FEE, HOST_MAX_FEE);
  guestFeeCents = clampFee(
    guestFeeCents,
    currency,
    GUEST_MIN_FEE,
    GUEST_MAX_FEE,
  );

  // 7) Taxes sur la part Guest uniquement
  const taxOnGuestFeeCents = Math.ceil(guestFeeCents * taxRate);

  // 8) Total débité au client
  const chargeCents = priceCents + guestFeeCents + taxOnGuestFeeCents;

  // 9) Payout hôte (base - host fee)
  const hostPayoutCents = priceCents - hostFeeCents;

  // 10) Estimation Stripe
  const stripeCfg = STRIPE_CONFIG[currency];
  const stripeEstimateCents = Math.ceil(
    chargeCents * stripeCfg.pct + stripeCfg.fix,
  );

  // 11) Marge plateforme
  const platformGrossCents =
    hostFeeCents + guestFeeCents + taxOnGuestFeeCents;
  const platformNetCents = platformGrossCents - stripeEstimateCents;

  return {
    hostPct,
    guestPct,
    hostFeeCents,
    guestFeeCents,
    taxOnGuestFeeCents,
    chargeCents,
    hostPayoutCents,
    stripeEstimateCents,
    platformGrossCents,
    platformNetCents,
    currency,
    region,
    meta: {
      bookingKind,
      isSuperhost,
      raw: {
        baseHostPct: base.hostPct,
        baseGuestPct: base.guestPct,
        baseTaxRate: base.taxRate,
        bookingKindHostMultiplier: kindMult.host,
        bookingKindGuestMultiplier: kindMult.guest,
        superhostHostMultiplier,
      },
    },
  };
}

// -------------------- Détermination de la région --------------------

/**
 * Détermine la Region interne (FRANCE / AB / BC / ON / QC / ATL)
 * à partir de la currency + country + provinceCode (enum ou string).
 *
 * - si EUR → FRANCE
 * - sinon → on applique les règles Canada (AB/BC/ON/QC/ATL) par défaut
 */
export function inferRegion(params: {
  currency: Currency;
  country?: string | null;
  provinceCode?: unknown;
}): Region {
  const { currency, country, provinceCode } = params;

  if (currency === "EUR") return "FRANCE";

  const raw = provinceCode == null ? "" : String(provinceCode);
  const code = raw.toUpperCase();

  if (code === "AB") return "AB";
  if (code === "BC") return "BC";
  if (code === "ON") return "ON";
  if (code === "QC") return "QC";
  if (["NB", "NS", "NL", "PE"].includes(code)) return "ATL";

  const ctry = (country ?? "").toLowerCase();
  if (ctry === "canada" || ctry === "ca") {
    return "QC";
  }

  return "FRANCE";
}
