"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LocaleSwitcher() {
  const router = useRouter();
  const [value, setValue] = useState<"fr" | "en">("fr");

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const loc = (m?.[1] as "fr" | "en" | undefined) || "fr";
    setValue(loc);
  }, []);

  function setLocale(next: "fr" | "en") {
    document.cookie = `locale=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    setValue(next);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs bg-white">
      <button
        type="button"
        onClick={() => setLocale("fr")}
        className={`px-2 py-0.5 rounded ${
          value === "fr" ? "bg-black text-white" : "hover:bg-gray-100"
        }`}
        aria-pressed={value === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-0.5 rounded ${
          value === "en" ? "bg-black text-white" : "hover:bg-gray-100"
        }`}
        aria-pressed={value === "en"}
      >
        EN
      </button>
    </div>
  );
}
