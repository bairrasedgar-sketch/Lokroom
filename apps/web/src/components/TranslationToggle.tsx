"use client";

import { useState, useEffect, useCallback } from "react";
import { GlobeAltIcon, CheckIcon } from "@heroicons/react/24/outline";
import { logger } from "@/lib/logger";


type LanguageInfo = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

type TranslationToggleProps = {
  onPreferencesChange?: (prefs: { preferredLanguage: string; autoTranslate: boolean }) => void;
  compact?: boolean;
};

export function TranslationToggle({
  onPreferencesChange,
  compact = false,
}: TranslationToggleProps) {
  const [preferredLanguage, setPreferredLanguage] = useState("fr");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saved, setSaved] = useState(false);

  // Charger les preferences et les langues
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les langues supportees
        const langRes = await fetch("/api/translate");
        if (langRes.ok) {
          const langData = await langRes.json();
          setLanguages(langData.languages || []);
        }

        // Charger les preferences utilisateur
        const prefRes = await fetch("/api/account/preferences/translation");
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          setPreferredLanguage(prefData.preferredLanguage || "fr");
          setAutoTranslate(prefData.autoTranslate ?? true);
        }
      } catch (error) {
        logger.error("Erreur chargement preferences traduction:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  // Sauvegarder les preferences
  const savePreferences = useCallback(
    async (newLang?: string, newAuto?: boolean) => {
      setSaving(true);
      setSaved(false);

      const langToSave = newLang ?? preferredLanguage;
      const autoToSave = newAuto ?? autoTranslate;

      try {
        const res = await fetch("/api/account/preferences/translation", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferredLanguage: langToSave,
            autoTranslate: autoToSave,
          }),
        });

        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);

          if (onPreferencesChange) {
            onPreferencesChange({
              preferredLanguage: langToSave,
              autoTranslate: autoToSave,
            });
          }
        }
      } catch (error) {
        logger.error("Erreur sauvegarde preferences:", error);
      } finally {
        setSaving(false);
      }
    },
    [preferredLanguage, autoTranslate, onPreferencesChange]
  );

  // Changer la langue preferee
  const handleLanguageChange = useCallback(
    (langCode: string) => {
      setPreferredLanguage(langCode);
      setShowDropdown(false);
      void savePreferences(langCode, undefined);
    },
    [savePreferences]
  );

  // Basculer la traduction automatique
  const handleAutoTranslateToggle = useCallback(() => {
    const newValue = !autoTranslate;
    setAutoTranslate(newValue);
    void savePreferences(undefined, newValue);
  }, [autoTranslate, savePreferences]);

  // Trouver la langue actuelle
  const currentLanguage = languages.find((l) => l.code === preferredLanguage);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <GlobeAltIcon className="h-4 w-4 animate-pulse" />
        <span>Chargement...</span>
      </div>
    );
  }

  // Version compacte (pour la barre de conversation)
  if (compact) {
    return (
      <div className="relative flex items-center gap-2">
        {/* Bouton langue */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
          title="Langue de traduction"
        >
          <GlobeAltIcon className="h-3.5 w-3.5" />
          <span>{currentLanguage?.code.toUpperCase() || "FR"}</span>
        </button>

        {/* Toggle auto-traduction */}
        <button
          type="button"
          onClick={handleAutoTranslateToggle}
          disabled={saving}
          className={[
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition",
            autoTranslate
              ? "bg-gray-900 text-white"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
          ].join(" ")}
          title={autoTranslate ? "Traduction auto activee" : "Traduction auto desactivee"}
        >
          {autoTranslate ? "Auto" : "Manuel"}
        </button>

        {/* Dropdown langues */}
        {showDropdown && (
          <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={[
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50",
                  lang.code === preferredLanguage
                    ? "bg-gray-50 font-medium"
                    : "",
                ].join(" ")}
              >
                <span>{lang.nativeName}</span>
                {lang.code === preferredLanguage && (
                  <CheckIcon className="h-4 w-4 text-gray-900" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Indicateur de sauvegarde */}
        {saved && (
          <span className="text-xs text-emerald-600">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    );
  }

  // Version complete (pour les parametres)
  return (
    <div className="space-y-4">
      {/* Toggle traduction automatique */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Traduction automatique
          </p>
          <p className="text-xs text-gray-500">
            Traduire automatiquement les messages recus
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoTranslate}
          onClick={handleAutoTranslateToggle}
          disabled={saving}
          className={[
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
            autoTranslate ? "bg-gray-900" : "bg-gray-200",
            saving ? "opacity-50 cursor-wait" : "",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              autoTranslate ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>

      {/* Selecteur de langue */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Langue preferee
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Les messages seront traduits dans cette langue
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {languages.slice(0, 9).map((lang) => {
            const isSelected = lang.code === preferredLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                disabled={saving}
                className={[
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                  isSelected
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white hover:border-gray-400",
                  saving ? "opacity-50 cursor-wait" : "",
                ].join(" ")}
              >
                <span className="font-medium">{lang.nativeName}</span>
                {isSelected && <CheckIcon className="h-4 w-4" />}
              </button>
            );
          })}
        </div>

        {/* Voir plus de langues */}
        {languages.length > 9 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
              Voir plus de langues ({languages.length - 9})
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {languages.slice(9).map((lang) => {
                const isSelected = lang.code === preferredLanguage;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={saving}
                    className={[
                      "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                      isSelected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white hover:border-gray-400",
                      saving ? "opacity-50 cursor-wait" : "",
                    ].join(" ")}
                  >
                    <span className="font-medium">{lang.nativeName}</span>
                    {isSelected && <CheckIcon className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* Indicateur de sauvegarde */}
      {saved && (
        <div className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckIcon className="h-4 w-4" />
          <span>Preferences enregistrees</span>
        </div>
      )}
    </div>
  );
}

export default TranslationToggle;
