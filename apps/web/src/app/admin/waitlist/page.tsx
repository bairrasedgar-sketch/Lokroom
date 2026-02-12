"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
import { logger } from "@/lib/logger";

  EnvelopeIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

interface WaitlistStats {
  total: number;
  today: number;
  week: number;
}

export default function AdminWaitlistPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats>({ total: 0, today: 0, week: 0 });
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [notifyResult, setNotifyResult] = useState<any>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  async function fetchWaitlist() {
    try {
      const response = await fetch("/api/waitlist");
      if (!response.ok) throw new Error("Erreur de chargement");

      const data = await response.json();
      setEntries(data.entries);
      setStats(data.stats);
    } catch (error) {
      logger.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotify() {
    if (!appStoreUrl || !playStoreUrl) {
      alert("Veuillez renseigner les URLs des stores");
      return;
    }

    if (testMode && !testEmail) {
      alert("Veuillez renseigner un email de test");
      return;
    }

    if (!testMode) {
      const confirm = window.confirm(
        `Êtes-vous sûr de vouloir envoyer ${stats.total} emails de notification ?`
      );
      if (!confirm) return;
    }

    setNotifying(true);
    setNotifyResult(null);

    try {
      const response = await fetch("/api/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appStoreUrl,
          playStoreUrl,
          testMode,
          testEmail: testMode ? testEmail : undefined,
        }),
      });

      const data = await response.json();
      setNotifyResult(data);

      if (data.success) {
        alert(
          testMode
            ? `Email de test envoyé à ${testEmail}`
            : `${data.sent}/${data.total} emails envoyés avec succès`
        );
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      logger.error("Erreur:", error);
      alert("Erreur lors de l'envoi des notifications");
    } finally {
      setNotifying(false);
    }
  }

  function exportToCSV() {
    const csv = [
      ["Email", "Source", "Date d'inscription"],
      ...entries.map((entry) => [
        entry.email,
        entry.source,
        new Date(entry.createdAt).toLocaleDateString("fr-FR"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Liste d'attente mobile</h1>
          <p className="mt-2 text-gray-600">
            Gérez les inscriptions à la liste d'attente de l'application mobile
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total inscrits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cette semaine</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.week}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportToCSV}
              disabled={entries.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exporter en CSV
            </button>

            <button
              onClick={() => setShowNotifyModal(true)}
              disabled={entries.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Notifier le lancement
            </button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Inscrits ({entries.length})
            </h2>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-12">
              <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun inscrit pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {entry.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Notifier le lancement de l'application
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Envoyez un email à tous les inscrits pour annoncer la disponibilité de l'app
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL App Store
                </label>
                <input
                  type="url"
                  value={appStoreUrl}
                  onChange={(e) => setAppStoreUrl(e.target.value)}
                  placeholder="https://apps.apple.com/app/lokroom/id..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Google Play
                </label>
                <input
                  type="url"
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.lokroom.app"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Test Mode */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="testMode"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="testMode" className="font-medium text-gray-900 cursor-pointer">
                      Mode test (recommandé)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Envoyez d'abord un email de test pour vérifier le rendu avant d'envoyer à tous les inscrits
                    </p>
                  </div>
                </div>

                {testMode && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de test
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Result */}
              {notifyResult && (
                <div
                  className={`rounded-lg p-4 ${
                    notifyResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notifyResult.success ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          notifyResult.success ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {notifyResult.message || notifyResult.error}
                      </p>
                      {notifyResult.sent && (
                        <p className="text-sm text-gray-600 mt-1">
                          {notifyResult.sent} emails envoyés, {notifyResult.failed} échecs
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNotifyModal(false);
                  setNotifyResult(null);
                }}
                disabled={notifying}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleNotify}
                disabled={notifying || !appStoreUrl || !playStoreUrl}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {notifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    {testMode ? "Envoyer le test" : `Envoyer à ${stats.total} inscrits`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
