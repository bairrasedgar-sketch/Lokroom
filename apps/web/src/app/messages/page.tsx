// apps/web/src/app/messages/page.tsx
"use client";

import { useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

type Filter = "all" | "unread" | "trips" | "support";

export default function MessagesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [selectedConversationId] = useState<string | null>(null);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Tout" },
    { id: "unread", label: "Non lus" },
    { id: "trips", label: "Voyages" },
    { id: "support", label: "Support Lok'Room" },
  ];

  const hasConversations = false; // plus tard on branchera la vraie liste

  return (
    <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-14 pt-10 lg:px-0">
        {/* Titre + sous-titre */}
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Messages
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Retrouve toutes tes conversations Lok&apos;Room : voyageurs, hôtes
              et support.
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
                <span>Messages</span>
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
                    Aucun message pour ce filtre.
                    <br />
                    Tu verras apparaître ici tes conversations avec les hôtes,
                    les voyageurs et le support Lok&apos;Room.
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
                    Sélectionne une conversation à gauche
                  </p>
                  <p className="text-sm text-gray-500">
                    Quand tu cliqueras sur un message, l&apos;historique complet
                    apparaîtra ici, avec l&apos;envoi de nouveaux messages en
                    bas.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* COLONNE DROITE : RÉSUMÉ RÉSERVATION / ANNONCE */}
          <section className="hidden w-[320px] flex-col border-l border-gray-100 px-6 py-5 lg:flex">
            <h2 className="text-sm font-semibold text-gray-900">
              Résumé de la réservation / de l&apos;annonce
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Quand la messagerie sera connectée aux réservations, tu verras ici
              les infos principales : logement, dates, montant, état de la
              réservation, etc.
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
              <p className="mb-2 font-medium text-gray-700">Exemple :</p>
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
