// apps/web/src/app/account/page.tsx
"use client";

import { useState } from "react";
import PaymentsPage from "./payments/page"; // ✅ on réutilise la page Paiements

type TabId =
  | "personal"
  | "security"
  | "privacy"
  | "notifications"
  | "taxes"
  | "payments"
  | "language"
  | "business"
  | "proTools";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "personal", label: "Données personnelles", icon: "👤" },
  { id: "security", label: "Connexion et sécurité", icon: "🛡️" },
  { id: "privacy", label: "Confidentialité", icon: "✋" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "taxes", label: "Taxes", icon: "🧾" },
  { id: "payments", label: "Paiements", icon: "💳" },
  { id: "language", label: "Langues et devise", icon: "🌍" },
  { id: "business", label: "Voyage d'affaires", icon: "🏢" },
  { id: "proTools", label: "Outils pour les hôtes professionnels", icon: "🧰" },
];

function TabContent({ active }: { active: TabId }) {
  switch (active) {
    case "personal":
      return (
        <section className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">Données personnelles</h1>
            <p className="text-sm text-gray-500">
              Gérez votre nom, votre adresse e-mail et vos informations de contact.
            </p>
          </header>

          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Nom légal</p>
                <p className="text-xs text-gray-500">
                  Le nom figurant sur votre pièce d’identité et vos justificatifs.
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Adresse e-mail</p>
                <p className="text-xs text-gray-500">
                  Utilisée pour vos confirmations de réservation et les notifications.
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                Modifier
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Numéro de téléphone
                </p>
                <p className="text-xs text-gray-500">
                  Sert à sécuriser votre compte et à vous contacter si nécessaire.
                </p>
              </div>
              <button className="text-sm font-medium text-primary-600 hover:underline">
                Modifier
              </button>
            </div>
          </div>
        </section>
      );

    case "payments":
      // ✅ On affiche le vrai flow Paiements / Versements ici
      return (
        <section className="space-y-6">
          <PaymentsPage />
        </section>
      );

    // Pour l’instant les autres onglets sont des placeholders.
    default:
      return (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-semibold">Section à venir</h1>
            <p className="text-sm text-gray-500">
              On préparera le contenu détaillé de «{" "}
              {tabs.find((t) => t.id === active)?.label} » plus tard.
            </p>
          </header>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Pour l’instant, cette section est une maquette. On y ajoutera les
            formulaires et paramètres quand on s’attaquera à cette partie.
          </div>
        </section>
      );
  }
}

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  return (
    <main className="mx-auto flex max-w-6xl gap-8 px-4 py-10 lg:px-8">
      {/* Colonne gauche – menu des paramètres */}
      <aside className="hidden w-72 flex-shrink-0 border-r border-gray-200 pr-6 md:block">
        <h2 className="mb-6 text-lg font-semibold">Paramètres du compte</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition",
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-base">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: petit menu au dessus */}
      <div className="md:hidden">
        <h2 className="mb-3 text-lg font-semibold">Paramètres du compte</h2>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabId)}
          className="mb-6 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Colonne droite – contenu de l’onglet */}
      <section className="flex-1">
        <TabContent active={activeTab} />
      </section>
    </main>
  );
}
