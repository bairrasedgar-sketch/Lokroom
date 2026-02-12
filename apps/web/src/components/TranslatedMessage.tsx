"use client";

import { useState, useCallback } from "react";
import { GlobeAltIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { logger } from "@/lib/logger";


type TranslatedMessageProps = {
  messageId: string;
  originalContent: string;
  originalLanguage?: string | null;
  translations?: Record<string, string> | null;
  preferredLanguage: string;
  autoTranslate: boolean;
  isMine: boolean;
  createdAt: string;
};

// Noms des langues pour l'affichage
const LANGUAGE_NAMES: Record<string, string> = {
  fr: "francais",
  en: "anglais",
  es: "espagnol",
  de: "allemand",
  it: "italien",
  pt: "portugais",
  zh: "chinois",
  ar: "arabe",
  ja: "japonais",
  nl: "neerlandais",
  ru: "russe",
  ko: "coreen",
  pl: "polonais",
  tr: "turc",
  vi: "vietnamien",
  th: "thai",
  id: "indonesien",
  hi: "hindi",
};

export function TranslatedMessage({
  messageId,
  originalContent,
  originalLanguage,
  translations,
  preferredLanguage,
  autoTranslate,
  isMine,
  createdAt,
}: TranslatedMessageProps) {
  const [showOriginal, setShowOriginal] = useState(!autoTranslate || isMine);
  const [translatedContent, setTranslatedContent] = useState<string | null>(
    translations?.[preferredLanguage] || null
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determiner si une traduction est necessaire
  const needsTranslation =
    !isMine &&
    originalLanguage &&
    originalLanguage !== preferredLanguage;

  // Traduire le message a la demande
  const handleTranslate = useCallback(async () => {
    if (translatedContent) {
      setShowOriginal(false);
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/messages/${messageId}/translate?targetLang=${preferredLanguage}`
      );

      if (!res.ok) {
        throw new Error("Erreur lors de la traduction");
      }

      const data = await res.json();
      setTranslatedContent(data.translatedContent);
      setShowOriginal(false);
    } catch (e) {
      logger.error("Erreur traduction:", e);
      setError("Impossible de traduire ce message");
    } finally {
      setIsTranslating(false);
    }
  }, [messageId, preferredLanguage, translatedContent]);

  // Basculer entre original et traduction
  const toggleView = useCallback(() => {
    if (!translatedContent && !showOriginal) {
      handleTranslate();
    } else {
      setShowOriginal(!showOriginal);
    }
  }, [translatedContent, showOriginal, handleTranslate]);

  // Contenu a afficher
  const displayContent = showOriginal ? originalContent : (translatedContent || originalContent);

  // Nom de la langue source
  const sourceLangName = originalLanguage
    ? LANGUAGE_NAMES[originalLanguage] || originalLanguage
    : null;

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={[
          "max-w-xs rounded-2xl px-3 py-2 text-sm",
          isMine
            ? "bg-gray-900 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm",
        ].join(" ")}
      >
        {/* Contenu du message */}
        <p
          className={[
            "whitespace-pre-wrap",
            !showOriginal && translatedContent ? "italic" : "",
          ].join(" ")}
        >
          {displayContent}
        </p>

        {/* Indicateur de traduction */}
        {!showOriginal && translatedContent && (
          <p
            className={[
              "mt-1 text-[10px]",
              isMine ? "text-white/60" : "text-gray-500",
            ].join(" ")}
          >
            Traduit du {sourceLangName}
          </p>
        )}

        {/* Erreur de traduction */}
        {error && (
          <p className="mt-1 text-[10px] text-red-400">{error}</p>
        )}

        {/* Footer avec heure et bouton de traduction */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p
            className={[
              "text-[10px]",
              isMine ? "text-white/70" : "text-gray-500",
            ].join(" ")}
          >
            {new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Bouton de traduction (seulement si necessaire) */}
          {needsTranslation && (
            <button
              type="button"
              onClick={toggleView}
              disabled={isTranslating}
              className={[
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] transition",
                isMine
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200",
                isTranslating ? "opacity-50 cursor-wait" : "",
              ].join(" ")}
              title={showOriginal ? "Voir la traduction" : "Voir l'original"}
            >
              {isTranslating ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
              ) : (
                <GlobeAltIcon className="h-3 w-3" />
              )}
              <span>
                {isTranslating
                  ? "..."
                  : showOriginal
                  ? "Traduire"
                  : "Original"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TranslatedMessage;
