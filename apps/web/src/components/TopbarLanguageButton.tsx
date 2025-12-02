"use client";

import { useState } from "react";
import { LanguageCurrencyModal } from "./LanguageCurrencyModal";

export function TopbarLanguageButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-black"
      >
        🌐 Langue / Devise
      </button>

      <LanguageCurrencyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
