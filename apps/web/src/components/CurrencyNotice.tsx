// apps/web/src/components/CurrencyNotice.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useLocalStorage";
import type { Currency } from "@/lib/currency";

const SUPPORTED: Currency[] = ["EUR", "CAD", "USD", "CNY", "GBP"];

export default function CurrencyNotice() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [detected, setDetected] = useState<Currency>("EUR");
  const isClient = useIsClient();

  useEffect(() => {
    // 🔒 SÉCURITÉ : Check SSR - Ne pas accéder à localStorage côté serveur
    if (!isClient) return;

    // déjà masqué ?
    if (localStorage.getItem("currency-notice-dismissed") === "1") return;

    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cur = (m?.[1] as Currency | undefined) || "EUR";

    // si jamais le cookie contient une devise non supportée
    if (!SUPPORTED.includes(cur)) {
      setDetected("EUR");
    } else {
      setDetected(cur);
    }

    setVisible(true);
  }, [isClient]);

  if (!visible) return null;

  async function setCurrency(next: Currency) {
    document.cookie = `currency=${next}; Path=/; Max-Age=${
      60 * 60 * 24 * 365
    }`;
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="mb-3 flex items-center justify-between rounded-lg border bg-yellow-50 px-3 py-2 text-sm">
        <div>
          Devise détectée : <b>{detected}</b>. Vous pouvez changer à tout moment.
        </div>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED.map((cur) => (
            <button
              key={cur}
              onClick={() => setCurrency(cur)}
              className="rounded border px-2 py-1"
            >
              {cur === "EUR" && "EUR €"}
              {cur === "CAD" && "CAD $"}
              {cur === "USD" && "USD $"}
              {cur === "GBP" && "GBP £"}
              {cur === "CNY" && "CNY ¥"}
            </button>
          ))}
          <button
            onClick={() => {
              // 🔒 SÉCURITÉ : Check SSR avant d'accéder à localStorage
              if (typeof window !== "undefined") {
                localStorage.setItem("currency-notice-dismissed", "1");
              }
              setVisible(false);
            }}
            className="rounded border px-2 py-1"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
