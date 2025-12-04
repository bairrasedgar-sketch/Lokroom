"use client";

import { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import useTranslation from "@/hooks/useTranslation";

type Filter = "all" | "unread" | "trips" | "support";

export default function MessagesPage() {
  const { dict } = useTranslation();
  const t = dict.messages;

  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [selectedConversationId] = useState<string | null>(null);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.all },
    { id: "unread", label: t.unread },
    { id: "trips", label: t.trips },
    { id: "support", label: t.support },
  ];

  const hasConversations = false; // plus tard on branchera la vraie liste

  return (
    <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-14 pt-10 lg:px-0">
        {/* Titre + sous-titre */}
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t.subtitle}
            </p>
          </div>
        </header>

        {/* GROS CONTAINER BLANC 3 COLONNES */}
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:flex-row">
          {/* COLONNE GAUCHE : LISTE DES CONVOS */}
          <section className="flex w-full flex-col border-b border-gray-100 md:w-[320px] md:border-b-0 md:border-r">
            {/* Header messages + filtres icône */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-600" />
                </span>
                <span>{t.title}</span>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Filtres (Tout / Non lus / Voyages / Support) */}
            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {filters.map((f) => {
                const isActive = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      isActive
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {!hasConversations ? (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-gray-400">
                  <p>
                    {t.noMessagesFilter}
                    <br />
                    {t.noMessagesFilterDesc}
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {/* Plus tard : items de conversations ici */}
                </ul>
              )}
            </div>
          </section>

          {/* COLONNE CENTRALE : CONVERSATION */}
          <section className="flex min-h-[260px] flex-1 flex-col">
            {selectedConversationId ? (
              <div className="flex-1 px-8 py-6">
                {/* Plus tard : header convo + messages */}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-8 py-10 text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-base font-medium text-gray-900">
                    {t.selectConversation}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.selectConversationDesc}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* COLONNE DROITE : RÉSUMÉ RÉSERVATION / ANNONCE */}
          <section className="hidden w-[320px] flex-col border-l border-gray-100 px-6 py-5 lg:flex">
            <h2 className="text-sm font-semibold text-gray-900">
              {t.bookingSummary}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {t.bookingSummaryDesc}
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
              <p className="mb-2 font-medium text-gray-700">{t.example}</p>
              <p>
                <span className="font-semibold text-gray-900">
                  Maison vue sur un canap
                </span>
                , Montréal, Canada — séjour du 12 au 15 mai, total 320&nbsp;€.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
