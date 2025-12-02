// apps/web/src/lib/currency.ts
// Point d'entrée UNIQUE à importer partout.
// - formatMoney : synchrone, pas de conversion → même code côté client/serveur
// - formatMoneyAsync : conversion via module serveur ou client selon l'environnement

import type { Currency as PrismaCurrency } from "@prisma/client";

export type Currency = PrismaCurrency;

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
      // valeur de secours
      return "en-US";
  }
}

/** Formatage SANS conversion (synchrone). */
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

/** Formatage AVEC conversion (asynchrone). */
export async function formatMoneyAsync(
  amount: number,
  originCurrency: Currency,
  displayCurrency: Currency,
  locale?: string
): Promise<string> {
  const loc = locale || defaultLocaleFor(displayCurrency);

  if (originCurrency === displayCurrency) {
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: displayCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Côté serveur: conversion locale (rates.server.ts)
  if (typeof window === "undefined") {
    const mod = await import("./currency.server");
    const converted = await mod.convert(amount, originCurrency, displayCurrency);
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: displayCurrency,
      maximumFractionDigits: 2,
    }).format(converted);
  }

  // Côté client: passe par l’API /api/convert
  const mod = await import("./currency.client");
  const converted = await mod.convert(amount, originCurrency, displayCurrency);
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: displayCurrency,
    maximumFractionDigits: 2,
  }).format(converted);
}

/** Export pratique si tu veux juste formatter sans conversion. */
export function formatMoneyStatic(amount: number, currency: Currency): string {
  return formatMoney(amount, currency);
}
