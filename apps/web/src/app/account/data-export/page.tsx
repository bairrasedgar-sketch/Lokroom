/**
 * Page d'export de données personnelles (RGPD)
 * /account/data-export
 */

"use client";

import { useState, useEffect } from "react";
import { Download, FileJson, FileText, FileArchive, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";


interface ExportRequest {
  id: string;
  format: string;
  status: string;
  fileSize: number | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  downloadUrl: string | null;
  isExpired: boolean;
}

export default function DataExportPage() {
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("json");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger l'historique des exports
  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    try {
      const response = await fetch("/api/users/me/export");
      if (!response.ok) throw new Error("Erreur de chargement");

      const data = await response.json();
      setExports(data.exports || []);
    } catch (err) {
      logger.error("Erreur chargement exports:", err);
      setError("Impossible de charger l'historique des exports");
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouvel export
  const createExport = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/users/me/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selectedFormat }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.message || "Limite de fréquence atteinte. Veuillez réessayer plus tard.");
        } else {
          setError(data.error || "Erreur lors de la création de l'export");
        }
        return;
      }

      setSuccess("Export créé avec succès ! Vous pouvez le télécharger ci-dessous.");
      await loadExports();
    } catch (err) {
      logger.error("Erreur création export:", err);
      setError("Erreur lors de la création de l'export");
    } finally {
      setCreating(false);
    }
  };

  // Télécharger un export
  const downloadExport = async (exportId: string) => {
    try {
      // Utiliser un lien temporaire pour télécharger
      const link = document.createElement('a');
      link.href = `/api/users/me/export/${exportId}/download`;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      logger.error("Erreur téléchargement:", err);
      setError("Erreur lors du téléchargement");
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Icône selon le format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case "json":
        return <FileJson className="w-5 h-5" />;
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "csv":
      case "zip":
      case "zip-no-photos":
        return <FileArchive className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Icône selon le statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "processing":
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // Libellé du statut
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "completed":
        return "Terminé";
      case "processing":
        return "En cours";
      case "pending":
        return "En attente";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Export de données personnelles</h1>
        <p className="text-gray-600">
          Conformément au RGPD (Article 20), vous pouvez exporter toutes vos données personnelles.
        </p>
      </div>

      {/* Alertes */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Succès</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Créer un nouvel export */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Créer un nouvel export</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choisissez le format d'export
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JSON */}
            <button
              onClick={() => setSelectedFormat("json")}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedFormat === "json"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileJson className="w-6 h-6 text-blue-600" />
                <span className="font-semibold">JSON</span>
              </div>
              <p className="text-sm text-gray-600">
                Format structuré, machine-readable. Idéal pour les développeurs.
              </p>
              <p className="text-xs text-gray-500 mt-2">Taille: ~100-500 KB</p>
            </button>

            {/* CSV */}
            <button
              onClick={() => setSelectedFormat("csv")}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedFormat === "csv"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileArchive className="w-6 h-6 text-green-600" />
                <span className="font-semibold">CSV (ZIP)</span>
              </div>
              <p className="text-sm text-gray-600">
                Compatible Excel/Google Sheets. Plusieurs fichiers CSV dans un ZIP.
              </p>
              <p className="text-xs text-gray-500 mt-2">Taille: ~50-200 KB</p>
            </button>

            {/* PDF */}
            <button
              onClick={() => setSelectedFormat("pdf")}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedFormat === "pdf"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-red-600" />
                <span className="font-semibold">PDF</span>
              </div>
              <p className="text-sm text-gray-600">
                Rapport lisible avec mise en page. Facile à imprimer.
              </p>
              <p className="text-xs text-gray-500 mt-2">Taille: ~200-800 KB</p>
            </button>

            {/* ZIP complet */}
            <button
              onClick={() => setSelectedFormat("zip")}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedFormat === "zip"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileArchive className="w-6 h-6 text-purple-600" />
                <span className="font-semibold">ZIP (avec photos)</span>
              </div>
              <p className="text-sm text-gray-600">
                Export complet: JSON, CSV et toutes vos photos.
              </p>
              <p className="text-xs text-gray-500 mt-2">Taille: ~5-50 MB</p>
            </button>
          </div>
        </div>

        <button
          onClick={createExport}
          disabled={creating}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Créer l'export
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Limite: 1 export par heure. Les exports expirent après 7 jours.
        </p>
      </div>

      {/* Historique des exports */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Historique des exports</h2>

        {loading ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-8">
            <FileArchive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">Aucun export pour le moment</p>
            <p className="text-sm text-gray-500 mt-1">
              Créez votre premier export ci-dessus
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {exports.map((exp) => (
              <div
                key={exp.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getFormatIcon(exp.format)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium uppercase text-sm">
                          {exp.format}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(exp.fileSize)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        {getStatusIcon(exp.status)}
                        <span>{getStatusLabel(exp.status)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Créé le {formatDate(exp.createdAt)}
                      </p>
                      {exp.expiresAt && !exp.isExpired && (
                        <p className="text-xs text-gray-500">
                          Expire le {formatDate(exp.expiresAt)}
                        </p>
                      )}
                      {exp.isExpired && (
                        <p className="text-xs text-red-600 font-medium">
                          Expiré
                        </p>
                      )}
                      {exp.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">
                          Erreur: {exp.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {exp.downloadUrl && !exp.isExpired && (
                    <button
                      onClick={() => downloadExport(exp.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations RGPD */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Conformité RGPD - Article 20
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          Cet export contient toutes vos données personnelles stockées sur Lok'Room:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Informations du compte et profil</li>
          <li>Annonces créées (avec photos et équipements)</li>
          <li>Réservations (en tant que voyageur et hôte)</li>
          <li>Avis donnés et reçus</li>
          <li>Messages et conversations</li>
          <li>Favoris et listes de souhaits</li>
          <li>Notifications et historique de recherche</li>
          <li>Paiements et transactions</li>
          <li>Litiges et consentements</li>
        </ul>
        <p className="text-xs text-blue-700 mt-3">
          Vous pouvez utiliser ces données pour les transférer vers un autre service
          ou les archiver pour vos dossiers personnels.
        </p>
      </div>
    </div>
  );
}
