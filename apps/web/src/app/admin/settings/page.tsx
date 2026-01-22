/**
 * Page Admin - Configuration système
 * Interface moderne et épurée
 */
"use client";

import { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  PhotoIcon,
  ClockIcon,
  CurrencyEuroIcon,
  WrenchScrewdriverIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

type Config = {
  hostFeePercent: number;
  guestFeePercent: number;
  maxImagesPerListing: number;
  maxListingsPerHost: number;
  minPricePerNight: number;
  maxPricePerNight: number;
  bookingExpirationHours: number;
  reviewWindowDays: number;
  disputeWindowDays: number;
  payoutDelayDays: number;
  minPayoutAmount: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

const DEFAULT_CONFIG: Config = {
  hostFeePercent: 3,
  guestFeePercent: 12,
  maxImagesPerListing: 20,
  maxListingsPerHost: 50,
  minPricePerNight: 10,
  maxPricePerNight: 10000,
  bookingExpirationHours: 24,
  reviewWindowDays: 14,
  disputeWindowDays: 30,
  payoutDelayDays: 3,
  minPayoutAmount: 100,
  maintenanceMode: false,
  maintenanceMessage: "",
};

type ConfigCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  accentColor?: string;
};

function ConfigCard({ icon, title, description, children, accentColor = "gray" }: ConfigCardProps) {
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-50 text-gray-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colorClasses[accentColor]}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: "number" | "text";
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
};

function InputField({ label, value, onChange, type = "number", suffix, min, max, step, placeholder }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig({ ...DEFAULT_CONFIG, ...data.config });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof Config, value: number | boolean | string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-500 mt-1">Paramètres globaux de la plateforme Lok'Room</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-in fade-in">
              <CheckIcon className="h-4 w-4" />
              Enregistré
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Maintenance Mode - Prominent Card */}
      <div className={`rounded-2xl border-2 transition-all ${
        config.maintenanceMode
          ? "bg-amber-50 border-amber-300"
          : "bg-white border-gray-100"
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${config.maintenanceMode ? "bg-amber-100" : "bg-gray-100"}`}>
                <WrenchScrewdriverIcon className={`h-6 w-6 ${config.maintenanceMode ? "text-amber-600" : "text-gray-500"}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Mode maintenance</h3>
                <p className="text-gray-600 mt-1">
                  {config.maintenanceMode
                    ? "Le site est actuellement en maintenance. Les visiteurs voient la page de maintenance."
                    : "Activez ce mode pour afficher une page de maintenance aux visiteurs."}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateConfig("maintenanceMode", !config.maintenanceMode)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                config.maintenanceMode
                  ? "bg-amber-500 focus:ring-amber-500"
                  : "bg-gray-200 focus:ring-gray-500"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {config.maintenanceMode && (
            <div className="mt-5 pt-5 border-t border-amber-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message personnalisé (optionnel)
              </label>
              <textarea
                value={config.maintenanceMessage}
                onChange={(e) => updateConfig("maintenanceMessage", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-gray-900 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-none"
                placeholder="Nous effectuons une mise à jour pour améliorer votre expérience. Nous serons de retour très bientôt !"
              />
              <p className="text-xs text-amber-700 mt-2">
                Ce message sera affiché sur la page de maintenance. Laissez vide pour le message par défaut.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Config Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commissions */}
        <ConfigCard
          icon={<BanknotesIcon className="h-5 w-5" />}
          title="Commissions"
          description="Frais prélevés sur chaque réservation"
          accentColor="green"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Commission hôte"
              value={config.hostFeePercent}
              onChange={(v) => updateConfig("hostFeePercent", v as number)}
              suffix="%"
              min={0}
              max={50}
              step={0.1}
            />
            <InputField
              label="Commission voyageur"
              value={config.guestFeePercent}
              onChange={(v) => updateConfig("guestFeePercent", v as number)}
              suffix="%"
              min={0}
              max={50}
              step={0.1}
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Les taxes sont calculées automatiquement par Stripe selon la localisation.
          </p>
        </ConfigCard>

        {/* Limites annonces */}
        <ConfigCard
          icon={<HomeIcon className="h-5 w-5" />}
          title="Annonces"
          description="Limites pour les annonces"
          accentColor="blue"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Max images par annonce"
              value={config.maxImagesPerListing}
              onChange={(v) => updateConfig("maxImagesPerListing", v as number)}
              min={1}
              max={50}
            />
            <InputField
              label="Max annonces par hôte"
              value={config.maxListingsPerHost}
              onChange={(v) => updateConfig("maxListingsPerHost", v as number)}
              min={1}
              max={500}
            />
          </div>
        </ConfigCard>

        {/* Prix */}
        <ConfigCard
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
          title="Tarification"
          description="Limites de prix par nuit"
          accentColor="green"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Prix minimum"
              value={config.minPricePerNight}
              onChange={(v) => updateConfig("minPricePerNight", v as number)}
              suffix="€"
              min={1}
            />
            <InputField
              label="Prix maximum"
              value={config.maxPricePerNight}
              onChange={(v) => updateConfig("maxPricePerNight", v as number)}
              suffix="€"
              min={1}
            />
          </div>
        </ConfigCard>

        {/* Délais réservation */}
        <ConfigCard
          icon={<CalendarDaysIcon className="h-5 w-5" />}
          title="Réservations"
          description="Délais et expiration"
          accentColor="amber"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Expiration demande"
              value={config.bookingExpirationHours}
              onChange={(v) => updateConfig("bookingExpirationHours", v as number)}
              suffix="h"
              min={1}
              max={168}
            />
            <InputField
              label="Délai versement"
              value={config.payoutDelayDays}
              onChange={(v) => updateConfig("payoutDelayDays", v as number)}
              suffix="jours"
              min={0}
              max={14}
            />
          </div>
        </ConfigCard>

        {/* Avis et litiges */}
        <ConfigCard
          icon={<ShieldExclamationIcon className="h-5 w-5" />}
          title="Avis et litiges"
          description="Délais pour les avis et litiges"
          accentColor="red"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Délai pour laisser un avis"
              value={config.reviewWindowDays}
              onChange={(v) => updateConfig("reviewWindowDays", v as number)}
              suffix="jours"
              min={1}
              max={60}
            />
            <InputField
              label="Délai pour ouvrir un litige"
              value={config.disputeWindowDays}
              onChange={(v) => updateConfig("disputeWindowDays", v as number)}
              suffix="jours"
              min={1}
              max={90}
            />
          </div>
        </ConfigCard>

        {/* Paiements */}
        <ConfigCard
          icon={<BanknotesIcon className="h-5 w-5" />}
          title="Versements"
          description="Configuration des paiements hôtes"
          accentColor="green"
        >
          <InputField
            label="Montant minimum de versement"
            value={config.minPayoutAmount}
            onChange={(v) => updateConfig("minPayoutAmount", v as number)}
            suffix="€"
            min={1}
          />
          <p className="text-xs text-gray-500 mt-3">
            Les versements inférieurs à ce montant seront accumulés.
          </p>
        </ConfigCard>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-lg transition-all ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-900 hover:bg-black hover:shadow-xl hover:scale-105"
          } text-white`}
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Enregistrement...
            </>
          ) : (
            <>
              <Cog6ToothIcon className="h-5 w-5" />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
