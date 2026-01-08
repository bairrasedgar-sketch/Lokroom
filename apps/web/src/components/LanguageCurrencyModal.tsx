// apps/web/src/components/LanguageCurrencyModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, type SupportedLang, SUPPORTED_LANGS } from "@/locales";
import type { Currency } from "@/lib/currency"; // doit être "EUR" | "CAD" | "USD" | "GBP" | "CNY"

const ONE_YEAR = 60 * 60 * 24 * 365;

const LANG_LABELS: Record<SupportedLang, { label: string; code: string }> = {
  fr: { label: "Français", code: "FR" },
  en: { label: "Anglais", code: "EN" },
  es: { label: "Espagnol", code: "ES" },
  de: { label: "Allemand", code: "DE" },
  it: { label: "Italien", code: "IT" },
  pt: { label: "Portugais", code: "PT" },
  zh: { label: "Chinois", code: "ZH" },
};

type CurrencyOption = {
  value: Currency;
  label: string;
  code: string;
  symbol: string;
};

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "EUR", label: "Euro", code: "EUR", symbol: "€" },
  { value: "USD", label: "Dollar américain", code: "USD", symbol: "$" },
  { value: "CAD", label: "Dollar canadien", code: "CAD", symbol: "$" },
  { value: "CNY", label: "Yuan chinois", code: "CNY", symbol: "¥" },
  { value: "GBP", label: "Livre", code: "GBP", symbol: "£" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LanguageCurrencyModal({ open, onClose }: Props) {
  const router = useRouter();

  const [lang, setLang] = useState<SupportedLang>("fr");
  const [currency, setCurrency] = useState<Currency>("EUR");

  // lecture cookies au montage
  useEffect(() => {
    if (!open) return;

    const cookieStr = document.cookie;

    // Note: le middleware utilise "locale", pas "lang"
    const langMatch = cookieStr.match(/(?:^|;\s*)locale=([^;]+)/);
    const curLang = (langMatch?.[1] as SupportedLang | undefined) || "fr";
    if (SUPPORTED_LANGS.includes(curLang)) {
      setLang(curLang);
    }

    const curMatch = cookieStr.match(/(?:^|;\s*)currency=([^;]+)/);
    const cur = (curMatch?.[1] as Currency | undefined) || "EUR";
    setCurrency(cur);
  }, [open]);

  const dict = dictionaries[lang] ?? dictionaries.fr;

  function handleSave() {
    // Important: utiliser "locale" comme le middleware l'attend
    document.cookie = `locale=${lang}; Path=/; Max-Age=${ONE_YEAR}`;
    document.cookie = `currency=${currency}; Path=/; Max-Age=${ONE_YEAR}`;
    onClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {dict.modal.title}
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Langues */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              {dict.modal.languages}
            </h3>
            <div className="space-y-2">
              {SUPPORTED_LANGS.map((code) => {
                const meta = LANG_LABELS[code];
                const active = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-black/60"
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span className={active ? "opacity-90" : "text-gray-400"}>
                      {meta.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Devises */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              {dict.modal.currencies}
            </h3>
            <div className="space-y-2">
              {CURRENCY_OPTIONS.map((opt) => {
                const active = currency === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCurrency(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-black/60"
                    }`}
                  >
                    <span>
                      {opt.label} ({opt.symbol})
                    </span>
                    <span className={active ? "opacity-90" : "text-gray-400"}>
                      {opt.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            onClick={onClose}
          >
            {dict.common.cancel}
          </button>
          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
            onClick={handleSave}
          >
            {dict.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
