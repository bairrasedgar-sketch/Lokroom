// SERVER-ONLY : conversions + cache disque
import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { Currency } from "./currency"; // ✅ vient maintenant de currency.ts

// ✅ toutes les devises supportées
const CURRENCIES: Currency[] = ["EUR", "CAD", "USD", "GBP", "CNY"];

// 💰 marge appliquée PAR DEVISE DE DESTINATION (to)
// ➜ valeurs que tu peux ajuster si tu veux plus/moins agressif
// USD : marge plus haute car c'est là que tu vois le plus d'écart (6.26€ → 7.27$)
const FX_MARKUP_PER_TARGET: Partial<Record<Currency, number>> = {
  EUR: 0, // pas de marge si on reste en EUR
  USD: 0.06, // +6% sur les conversions vers USD
  CAD: 0.03, // +3% vers CAD
  GBP: 0.03, // +3% vers GBP
  CNY: 0.03, // +3% vers CNY
};

// marge par défaut si jamais une devise n'est pas dans le map
const DEFAULT_MARKUP = 0.03;

const CACHE_DIR =
  process.env.NODE_ENV === "production"
    ? "/tmp"
    : path.join(process.cwd(), ".next", "cache");

// on change le nom pour repartir sur un nouveau fichier de cache
const CACHE_FILE = path.join(CACHE_DIR, "rates_multi.json");

type RatesTable = Record<Currency, Record<Currency, number>>;

type RatesPayload = {
  updatedAt: number;
  tables: RatesTable;
};

// ⏱ TTL du cache : 5 minutes → quasi “temps réel”
const TTL_MS = 5 * 60 * 1000;

async function readCache(): Promise<RatesPayload | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    const data = JSON.parse(raw) as RatesPayload;
    if (Date.now() - data.updatedAt < TTL_MS) return data;
    return null;
  } catch {
    return null;
  }
}

async function writeCache(payload: RatesPayload) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(payload), "utf8");
  } catch {
    // ignore
  }
}

/**
 * Récupère les taux frais depuis exchangerate.host
 * base = EUR → on reconstruit la matrice complète (SANS marge).
 */
async function fetchRatesFresh(): Promise<RatesPayload> {
  try {
    const symbols = CURRENCIES.filter((c) => c !== "EUR").join(",");
    const u = `https://api.exchangerate.host/latest?base=EUR&symbols=${symbols}`;

    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) throw new Error("rates http " + res.status);

    const j = (await res.json()) as {
      rates: Partial<Record<Currency, number>>;
    };

    // taux "propres" du marché par rapport à EUR (SANS marge)
    const baseRates: Record<Currency, number> = {
      EUR: 1,
      CAD: Number(j.rates.CAD),
      USD: Number(j.rates.USD),
      GBP: Number(j.rates.GBP),
      CNY: Number(j.rates.CNY),
    };

    // validation
    for (const cur of CURRENCIES) {
      const v = baseRates[cur];
      if (!Number.isFinite(v) || v <= 0) {
        throw new Error("bad rate for " + cur);
      }
    }

    // construit la table complète from -> to (toujours SANS marge ici)
    const tables: RatesTable = {} as RatesTable;
    for (const from of CURRENCIES) {
      tables[from] = {} as Record<Currency, number>;
      for (const to of CURRENCIES) {
        if (from === to) {
          tables[from][to] = 1;
        } else {
          // ex : CAD -> USD = (USD/EUR) / (CAD/EUR)
          tables[from][to] = baseRates[to] / baseRates[from];
        }
      }
    }

    const payload: RatesPayload = {
      updatedAt: Date.now(),
      tables,
    };

    await writeCache(payload);
    return payload;
  } catch (err) {
    console.error("fetchRatesFresh error, using fallback", err);

    // 🔁 fallback “en dur” si l’API externe tombe
    // (valeurs approximatives, c’est juste pour ne pas crasher)
    const baseRates: Record<Currency, number> = {
      EUR: 1,
      CAD: 1.62, // ~ taux BCE fin 2025
      USD: 1.16,
      GBP: 0.88,
      CNY: 8.2,
    };

    const tables: RatesTable = {} as RatesTable;
    for (const from of CURRENCIES) {
      tables[from] = {} as Record<Currency, number>;
      for (const to of CURRENCIES) {
        if (from === to) {
          tables[from][to] = 1;
        } else {
          tables[from][to] = baseRates[to] / baseRates[from];
        }
      }
    }

    const payload: RatesPayload = {
      updatedAt: Date.now(),
      tables,
    };
    await writeCache(payload);
    return payload;
  }
}

async function getRates(): Promise<RatesPayload> {
  const c = await readCache();
  return c ?? (await fetchRatesFresh());
}

export async function convert(amount: number, from: Currency, to: Currency) {
  // même devise : on ne touche pas au montant, on arrondit juste proprement
  if (from === to) {
    return Math.ceil(amount * 100) / 100;
  }

  const rates = await getRates();
  const baseRate = rates.tables[from]?.[to];

  // petite fonction utilitaire pour appliquer la marge + arrondi
  function applyMarginAndRound(rate: number): number {
    const margin = FX_MARKUP_PER_TARGET[to] ?? DEFAULT_MARKUP;
    const effectiveRate = rate * (1 + margin);
    const raw = amount * effectiveRate;

    // ARRONDI VERS LE HAUT à 2 décimales → tu ne perds pas des centimes
    return Math.ceil(raw * 100) / 100;
  }

  if (!Number.isFinite(baseRate)) {
    const fresh = await fetchRatesFresh();
    const r2 = fresh.tables[from]?.[to] ?? 1;
    return applyMarginAndRound(r2);
  }

  return applyMarginAndRound(baseRate);
}
