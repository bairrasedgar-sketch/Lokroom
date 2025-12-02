// apps/web/src/lib/currency.server.ts
import type { Currency } from "@prisma/client";
import { convert as convertRates } from "./rates.server";

function defaultLocaleFor(currency: Currency): string {
  switch (currency) {
    case "EUR":
      return "fr-FR";
    case "CAD":
      return "en-CA";
    case "USD":
      return "en-US";
    case "GBP":
      return "en-GB";
    case "CNY":
      return "zh-CN";
    default:
      return "en-US";
  }
}

export function formatMoney(
  amount: number,
  currency: Currency,
  locale?: string
): string {
  const loc = locale || defaultLocaleFor(currency);
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ✅ utilisé par currency.ts
export async function convert(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  return convertRates(amount, from, to);
}

export async function formatMoneyAsync(
  amount: number,
  originCurrency: Currency,
  displayCurrency: Currency,
  locale?: string
): Promise<string> {
  const loc = locale || defaultLocaleFor(displayCurrency);
  if (originCurrency === displayCurrency) {
    return formatMoney(amount, displayCurrency, loc);
  }
  const v = await convert(amount, originCurrency, displayCurrency);
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 2,
  }).format(v);
}
