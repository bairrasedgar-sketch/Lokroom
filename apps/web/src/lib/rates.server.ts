// SERVER-ONLY : conversions + cache disque
import "server-only";

import { promises as fs } from "fs";
import path from "path";

export type Currency = "EUR" | "CAD";

const CACHE_DIR =
  process.env.NODE_ENV === "production"
    ? "/tmp"
    : path.join(process.cwd(), ".next", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "rates_eur_cad.json");

type RatesPayload = {
  updatedAt: number;
  tables: Record<Currency, Record<Currency, number>>;
};

const TTL_MS = 24 * 60 * 60 * 1000;

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

async function fetchRatesFresh(): Promise<RatesPayload> {
  try {
    const u = "https://api.exchangerate.host/latest?base=EUR&symbols=CAD";
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) throw new Error("rates http " + res.status);
    const j = (await res.json()) as { rates: { CAD: number } };
    const eurToCad = Number(j?.rates?.CAD);
    if (!Number.isFinite(eurToCad) || eurToCad <= 0) throw new Error("bad rate");
    const cadToEur = 1 / eurToCad;

    const payload: RatesPayload = {
      updatedAt: Date.now(),
      tables: {
        EUR: { EUR: 1, CAD: eurToCad },
        CAD: { EUR: cadToEur, CAD: 1 },
      },
    };
    await writeCache(payload);
    return payload;
  } catch {
    const eurToCad = 1.45;
    const cadToEur = 1 / eurToCad;
    const payload: RatesPayload = {
      updatedAt: Date.now(),
      tables: {
        EUR: { EUR: 1, CAD: eurToCad },
        CAD: { EUR: cadToEur, CAD: 1 },
      },
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
  if (from === to) return Number(amount.toFixed(2));
  const rates = await getRates();
  const rate = rates.tables[from]?.[to];
  if (!Number.isFinite(rate)) {
    const fresh = await fetchRatesFresh();
    const r2 = fresh.tables[from]?.[to];
    return Number((amount * (r2 ?? 1)).toFixed(2));
  }
  return Number((amount * rate).toFixed(2));
}
