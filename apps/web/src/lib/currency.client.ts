// apps/web/src/lib/currency.client.ts
export type Currency = "EUR" | "CAD";

function defaultLocaleFor(currency: Currency): string {
  switch (currency) {
    case "EUR":
      return "fr-FR";
    case "CAD":
      return "en-CA";
    default:
      return "en-US";
  }
}

export function formatMoney(amount: number, currency: Currency, locale?: string): string {
  const loc = locale || defaultLocaleFor(currency);
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ✅ export nécessaire pour currency.ts
export async function convert(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, from, to }),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || typeof j?.value !== "number") {
    throw new Error("Convert API failed");
  }
  return j.value;
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
