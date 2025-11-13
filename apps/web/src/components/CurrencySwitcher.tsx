// apps/web/src/components/CurrencySwitcher.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CurrencySwitcher() {
  const router = useRouter();
  const [value, setValue] = useState<"EUR" | "CAD">("EUR");

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cur = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setValue(cur);
  }, []);

  function setCurrency(next: "EUR" | "CAD") {
    // 1 an
    document.cookie = `currency=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    setValue(next);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs bg-white">
      <button
        type="button"
        onClick={() => setCurrency("EUR")}
        className={`px-2 py-0.5 rounded ${value === "EUR" ? "bg-black text-white" : "hover:bg-gray-100"}`}
        aria-pressed={value === "EUR"}
      >
        EUR €
      </button>
      <button
        type="button"
        onClick={() => setCurrency("CAD")}
        className={`px-2 py-0.5 rounded ${value === "CAD" ? "bg-black text-white" : "hover:bg-gray-100"}`}
        aria-pressed={value === "CAD"}
      >
        CAD $
      </button>
    </div>
  );
}
