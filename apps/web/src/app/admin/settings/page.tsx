/**
 * Page Admin - Configuration système
 */
"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type Config = {
  hostFeePercent: number;
  guestFeePercent: number;
  gstPercent: number;
  pstPercent: number;
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
  gstPercent: 5,
  pstPercent: 9.975,
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

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Configuration sauvegardée" });
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la sauvegarde" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion" });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof Config, value: number | boolean | string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paramètres globaux de la plateforme
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {message.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Commissions */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Commissions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission hôte (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={config.hostFeePercent}
              onChange={(e) => updateConfig("hostFeePercent", parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission voyageur (%)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={config.guestFeePercent}
              onChange={(e) => updateConfig("guestFeePercent", parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TPS (GST) (%)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={config.gstPercent}
              onChange={(e) => updateConfig("gstPercent", parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TVQ (PST) (%)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={config.pstPercent}
              onChange={(e) => updateConfig("pstPercent", parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </section>

      {/* Limites */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Limites</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max images par annonce
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.maxImagesPerListing}
              onChange={(e) => updateConfig("maxImagesPerListing", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max annonces par hôte
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={config.maxListingsPerHost}
              onChange={(e) => updateConfig("maxListingsPerHost", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix min par nuit (€)
            </label>
            <input
              type="number"
              min="1"
              value={config.minPricePerNight}
              onChange={(e) => updateConfig("minPricePerNight", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix max par nuit (€)
            </label>
            <input
              type="number"
              min="1"
              value={config.maxPricePerNight}
              onChange={(e) => updateConfig("maxPricePerNight", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </section>

      {/* Délais */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Délais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration réservation (heures)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={config.bookingExpirationHours}
              onChange={(e) => updateConfig("bookingExpirationHours", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Délai avis (jours)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={config.reviewWindowDays}
              onChange={(e) => updateConfig("reviewWindowDays", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Délai litige (jours)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={config.disputeWindowDays}
              onChange={(e) => updateConfig("disputeWindowDays", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Délai versement (jours)
            </label>
            <input
              type="number"
              min="0"
              max="14"
              value={config.payoutDelayDays}
              onChange={(e) => updateConfig("payoutDelayDays", parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mode maintenance</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="maintenanceMode"
              checked={config.maintenanceMode}
              onChange={(e) => updateConfig("maintenanceMode", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            <label htmlFor="maintenanceMode" className="font-medium text-gray-900">
              Activer le mode maintenance
            </label>
          </div>
          {config.maintenanceMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message de maintenance
              </label>
              <textarea
                value={config.maintenanceMessage}
                onChange={(e) => updateConfig("maintenanceMessage", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Le site est en maintenance, merci de réessayer plus tard..."
              />
            </div>
          )}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium"
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
