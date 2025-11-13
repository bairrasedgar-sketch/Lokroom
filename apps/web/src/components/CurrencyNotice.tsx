// apps/web/src/components/CurrencyNotice.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CurrencyNotice() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [detected, setDetected] = useState<"EUR" | "CAD">("EUR");

  useEffect(() => {
    // déjà masqué ?
    if (localStorage.getItem("currency-notice-dismissed") === "1") return;
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cur = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setDetected(cur);
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function setCurrency(next: "EUR" | "CAD") {
    document.cookie = `currency=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="mb-3 flex items-center justify-between rounded-lg border bg-yellow-50 px-3 py-2 text-sm">
        <div>
          Devise détectée : <b>{detected}</b>. Vous pouvez changer à tout moment.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrency("EUR")}
            className="rounded border px-2 py-1"
          >
            EUR €
          </button>
          <button
            onClick={() => setCurrency("CAD")}
            className="rounded border px-2 py-1"
          >
            CAD $
          </button>
          <button
            onClick={() => {
              localStorage.setItem("currency-notice-dismissed", "1");
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
