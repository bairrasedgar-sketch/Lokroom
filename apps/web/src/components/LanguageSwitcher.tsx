// apps/web/src/components/LanguageSwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Locale = "fr" | "en";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [value, setValue] = useState<Locale>("fr");

  // Initialise avec cookie ou navigator.language (première visite)
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    let loc = (m?.[1] as Locale | undefined);
    if (!loc) {
      const nav = (navigator.language || "en").toLowerCase();
      loc = nav.startsWith("fr") ? "fr" : "en";
      document.cookie = `locale=${loc}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    }
    setValue(loc);
  }, []);

  async function setLocale(next: Locale) {
    setValue(next);
    // Mets à jour cookie via l’API (et headers côté serveur)
    await fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs bg-white">
      <button
        type="button"
        onClick={() => setLocale("fr")}
        className={`px-2 py-0.5 rounded ${value === "fr" ? "bg-black text-white" : "hover:bg-gray-100"}`}
        aria-pressed={value === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-0.5 rounded ${value === "en" ? "bg-black text-white" : "hover:bg-gray-100"}`}
        aria-pressed={value === "en"}
      >
        EN
      </button>
    </div>
  );
}
