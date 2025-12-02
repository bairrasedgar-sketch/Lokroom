// apps/web/src/components/CurrencySwitcher.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Currency } from "@/lib/currency";

const SUPPORTED: Currency[] = ["EUR", "CAD", "USD", "CNY", "GBP"];

export default function CurrencySwitcher() {
  const router = useRouter();
  const [value, setValue] = useState<Currency>("EUR");

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cur = (m?.[1] as Currency | undefined) || "EUR";
    if (SUPPORTED.includes(cur)) {
      setValue(cur);
    } else {
      setValue("EUR");
    }
  }, []);

  function setCurrency(next: Currency) {
    // 1 an
    document.cookie = `currency=${next}; Path=/; Max-Age=${
      60 * 60 * 24 * 365
    }`;
    setValue(next);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs bg-white">
      {SUPPORTED.map((cur) => (
        <button
          key={cur}
          type="button"
          onClick={() => setCurrency(cur)}
          className={`px-2 py-0.5 rounded ${
            value === cur ? "bg-black text-white" : "hover:bg-gray-100"
          }`}
          aria-pressed={value === cur}
        >
          {cur === "EUR" && "EUR €"}
          {cur === "CAD" && "CAD $"}
          {cur === "USD" && "USD $"}
          {cur === "GBP" && "GBP £"}
          {cur === "CNY" && "CNY ¥"}
        </button>
      ))}
    </div>
  );
}
