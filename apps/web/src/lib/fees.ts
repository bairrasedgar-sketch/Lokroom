// Moteur de frais Lok'Room — France (EUR) + Canada par province (CAD)

export type Currency = "EUR" | "CAD";
export type RegionFR = "FRANCE";
export type RegionCA = "AB" | "BC" | "ON" | "QC" | "ATL"; // Alberta, BC, Ontario, Québec, Atlantique (NB/NS/NL/PE)
export type Region = RegionFR | RegionCA;

const STRIPE_PCT_EU = Number(process.env.NEXT_PUBLIC_STRIPE_PCT_EU ?? 1.4) / 100; // 0.014
const STRIPE_FIX_EUR = Number(process.env.NEXT_PUBLIC_STRIPE_FIX_EUR ?? 25); // 25 cents

const STRIPE_PCT_CA = Number(process.env.NEXT_PUBLIC_STRIPE_PCT_CA ?? 2.9) / 100; // 0.029
const STRIPE_FIX_CAD = Number(process.env.NEXT_PUBLIC_STRIPE_FIX_CAD ?? 30); // 30 cents

export type FeeInput = {
  priceCents: number;   // base (en cents)
  currency: Currency;   // "EUR" | "CAD"
  region: Region;       // FRANCE | AB | BC | ON | QC | ATL
};

export type FeeBreakdown = {
  hostPct: number;
  guestPct: number;

  hostFeeCents: number;
  guestFeeCents: number;

  taxOnGuestFeeCents: number;

  chargeCents: number;      // débité au client
  hostPayoutCents: number;  // crédité au wallet hôte

  stripeEstimateCents: number;

  currency: Currency;
  region: Region;
};

// ---------- Barèmes ----------

// France (EUR)
function pickRatesFR(priceCents: number) {
  const p = priceCents / 100;
  if (p < 20)   return { hostPct: 0.030, guestPct: 0.115, taxRate: 0.20 };
  if (p < 60)   return { hostPct: 0.027, guestPct: 0.105, taxRate: 0.20 };
  if (p < 150)  return { hostPct: 0.023, guestPct: 0.098, taxRate: 0.20 };
  if (p < 300)  return { hostPct: 0.021, guestPct: 0.085, taxRate: 0.20 };
  return            { hostPct: 0.020, guestPct: 0.075, taxRate: 0.20 };
}

// Canada (CAD) — par province
function pickRatesCA(priceCents: number, province: RegionCA) {
  const p = priceCents / 100;

  const taxRates: Record<RegionCA, number> = {
    AB: 0.05,
    BC: 0.12,
    ON: 0.13,
    QC: 0.14975,
    ATL: 0.15, // NB/NS/NL/PE
  };

  const t = taxRates[province];

  if (province === "AB") {
    if (p < 20)   return { hostPct: 0.027, guestPct: 0.098, taxRate: t };
    if (p < 60)   return { hostPct: 0.024, guestPct: 0.088, taxRate: t };
    if (p < 150)  return { hostPct: 0.022, guestPct: 0.082, taxRate: t };
    if (p < 300)  return { hostPct: 0.020, guestPct: 0.078, taxRate: t };
    return            { hostPct: 0.018, guestPct: 0.073, taxRate: t };
  }
  if (province === "BC") {
    if (p < 20)   return { hostPct: 0.028, guestPct: 0.103, taxRate: t };
    if (p < 60)   return { hostPct: 0.025, guestPct: 0.092, taxRate: t };
    if (p < 150)  return { hostPct: 0.023, guestPct: 0.085, taxRate: t };
    if (p < 300)  return { hostPct: 0.021, guestPct: 0.080, taxRate: t };
    return            { hostPct: 0.019, guestPct: 0.075, taxRate: t };
  }
  if (province === "ON") {
    if (p < 20)   return { hostPct: 0.029, guestPct: 0.108, taxRate: t };
    if (p < 60)   return { hostPct: 0.026, guestPct: 0.098, taxRate: t };
    if (p < 150)  return { hostPct: 0.024, guestPct: 0.092, taxRate: t };
    if (p < 300)  return { hostPct: 0.022, guestPct: 0.087, taxRate: t };
    return            { hostPct: 0.020, guestPct: 0.080, taxRate: t };
  }
  if (province === "QC") {
    if (p < 20)   return { hostPct: 0.030, guestPct: 0.115, taxRate: t };
    if (p < 60)   return { hostPct: 0.027, guestPct: 0.105, taxRate: t };
    if (p < 150)  return { hostPct: 0.024, guestPct: 0.095, taxRate: t };
    if (p < 300)  return { hostPct: 0.022, guestPct: 0.090, taxRate: t };
    return            { hostPct: 0.020, guestPct: 0.082, taxRate: t };
  }
  // ATL = NB / NS / NL / PE
  if (province === "ATL") {
    if (p < 20)   return { hostPct: 0.030, guestPct: 0.115, taxRate: t };
    if (p < 60)   return { hostPct: 0.028, guestPct: 0.105, taxRate: t };
    if (p < 150)  return { hostPct: 0.025, guestPct: 0.098, taxRate: t };
    if (p < 300)  return { hostPct: 0.023, guestPct: 0.090, taxRate: t };
    return            { hostPct: 0.021, guestPct: 0.083, taxRate: t };
  }

  // Fallback
  return { hostPct: 0.025, guestPct: 0.09, taxRate: t };
}

// ---------- Sélecteur + calculs ----------

export function computeFees(input: FeeInput): FeeBreakdown {
  const { priceCents, currency, region } = input;

  let hostPct = 0, guestPct = 0, taxRate = 0;

  if (currency === "EUR") {
    const fr = pickRatesFR(priceCents);
    hostPct = fr.hostPct; guestPct = fr.guestPct; taxRate = fr.taxRate;
  } else {
    const ca = pickRatesCA(priceCents, region as RegionCA);
    hostPct = ca.hostPct; guestPct = ca.guestPct; taxRate = ca.taxRate;
  }

  const hostFeeCents = Math.ceil(priceCents * hostPct);
  const guestFeeCents = Math.ceil(priceCents * guestPct);

  // taxes sur la part Guest uniquement
  const taxOnGuestFeeCents = Math.ceil(guestFeeCents * taxRate);

  // total débité
  const chargeCents = priceCents + guestFeeCents + taxOnGuestFeeCents;

  // payout hôte
  const hostPayoutCents = priceCents - hostFeeCents;

  // estimation Stripe
  const stripePct  = currency === "EUR" ? STRIPE_PCT_EU : STRIPE_PCT_CA;
  const stripeFix  = currency === "EUR" ? STRIPE_FIX_EUR : STRIPE_FIX_CAD;
  const stripeEstimateCents = Math.ceil(chargeCents * stripePct + stripeFix);

  return {
    hostPct, guestPct,
    hostFeeCents,
    guestFeeCents,
    taxOnGuestFeeCents,
    chargeCents,
    hostPayoutCents,
    stripeEstimateCents,
    currency,
    region,
  };
}

// ---------- Détermination de la région à partir du pays/province ----------

export function inferRegion(params: {
  currency: Currency;
  country?: string | null;
  // Acceptons string, enum Prisma, ou null/undefined
  provinceCode?: unknown;
}): Region {
  const { currency, country, provinceCode } = params;

  if (currency === "EUR") return "FRANCE";

  // Normalise la province vers un code string en majuscules
  const raw = provinceCode == null ? "" : String(provinceCode);
  const code = raw.toUpperCase();

  if (code === "AB") return "AB";
  if (code === "BC") return "BC";
  if (code === "ON") return "ON";
  if (code === "QC") return "QC";
  if (["NB", "NS", "NL", "PE"].includes(code)) return "ATL";

  // Si pas de province mais on est au Canada, fallback ATL ou QC
  const ctry = (country ?? "").toLowerCase();
  if (ctry === "canada" || ctry === "ca") {
    return "QC"; // fallback raisonnable
  }

  // par défaut
  return "FRANCE";
}
