/**
 * Page Admin - Gestion des backups de base de données
 * /admin/backups
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
import { logger } from "@/lib/logger";

  Database,
  Download,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Calendar,
  FileArchive,
} from "lucide-react";

interface Backup {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "DELETED";
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  checksum: string | null;
  createdAt: string;
}

interface BackupStats {
  byStatus: Record<string, number>;
  totalSize: number;
  lastBackup: {
    id: string;
    createdAt: string;
    type: string;
    fileSize: number;
  } | null;
}

export default function BackupsPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<{
    type?: string;
    status?: string;
  }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBackups();
  }, [page, filter]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filter.type && { type: filter.type }),
        ...(filter.status && { status: filter.status }),
      });

      const response = await fetch(`/api/admin/backups?${params}`);
      if (!response.ok) throw new Error("Failed to fetch backups");

      const data = await response.json();
      setBackups(data.backups);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      logger.error("Error fetching backups:", error);
      alert("Erreur lors du chargement des backups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm("Créer un backup manuel maintenant ?")) return;

    try {
      setActionLoading("create");
      const response = await fetch("/api/admin/backups", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create backup");
      }

      alert("Backup manuel démarré avec succès");
      fetchBackups();
    } catch (error: any) {
      logger.error("Error creating backup:", error);
      alert(error.message || "Erreur lors de la création du backup");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (backupId: string, filename: string) => {
    try {
      setActionLoading(backupId);
      const response = await fetch(`/api/admin/backups/${backupId}/download`);

      if (!response.ok) throw new Error("Failed to get download URL");

      const data = await response.json();

      // Ouvrir l'URL signée dans un nouvel onglet
      window.open(data.downloadUrl, "_blank");
    } catch (error) {
      logger.error("Error downloading backup:", error);
      alert("Erreur lors du téléchargement du backup");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (backupId: string, filename: string) => {
    if (
      !confirm(
        `⚠️ ATTENTION: Restaurer ce backup va ÉCRASER la base de données actuelle!\n\n` +
        `Backup: ${filename}\n\n` +
        `Êtes-vous ABSOLUMENT SÛR de vouloir continuer?`
      )
    ) {
      return;
    }

    if (
      !confirm(
        "Dernière confirmation: Cette action est IRRÉVERSIBLE.\n\n" +
        "Avez-vous créé un backup récent de la base actuelle?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(backupId);
      const response = await fetch(`/api/admin/backups/${backupId}/restore`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to restore backup");

      alert("Restauration démarrée. La base de données sera restaurée dans quelques minutes.");
      fetchBackups();
    } catch (error) {
      logger.error("Error restoring backup:", error);
      alert("Erreur lors de la restauration du backup");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (backupId: string, filename: string) => {
    if (!confirm(`Supprimer le backup "${filename}" ?`)) return;

    try {
      setActionLoading(backupId);
      const response = await fetch(`/api/admin/backups/${backupId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete backup");

      alert("Backup supprimé avec succès");
      fetchBackups();
    } catch (error) {
      logger.error("Error deleting backup:", error);
      alert("Erreur lors de la suppression du backup");
    } finally {
      setActionLoading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "En attente" },
      IN_PROGRESS: { color: "bg-blue-100 text-blue-800", icon: RefreshCw, label: "En cours" },
      COMPLETED: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Terminé" },
      FAILED: { color: "bg-red-100 text-red-800", icon: AlertCircle, label: "Échec" },
      DELETED: { color: "bg-gray-100 text-gray-800", icon: Trash2, label: "Supprimé" },
    };

    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      DAILY: "bg-blue-100 text-blue-800",
      WEEKLY: "bg-purple-100 text-purple-800",
      MONTHLY: "bg-indigo-100 text-indigo-800",
      MANUAL: "bg-orange-100 text-orange-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.DAILY}`}>
        {type}
      </span>
    );
  };

  if (loading && backups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des backups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="w-8 h-8" />
              Backups de la base de données
            </h1>
            <p className="text-gray-600 mt-2">
              Gestion des sauvegardes automatiques et manuelles
            </p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading === "create"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading === "create" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Backup manuel
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Espace total</p>
                  <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Complétés</p>
                  <p className="text-2xl font-bold">{stats.byStatus.COMPLETED || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Échecs</p>
                  <p className="text-2xl font-bold">{stats.byStatus.FAILED || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Dernier backup</p>
                  <p className="text-sm font-medium">
                    {stats.lastBackup
                      ? formatDate(stats.lastBackup.createdAt)
                      : "Aucun"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filter.type || ""}
                onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="DAILY">Quotidien</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="MANUAL">Manuel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filter.status || ""}
                onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="COMPLETED">Terminé</option>
                <option value="FAILED">Échec</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="PENDING">En attente</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter({});
                  setPage(1);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des backups */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fichier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => {
                const duration = backup.completedAt
                  ? Math.round(
                      (new Date(backup.completedAt).getTime() -
                        new Date(backup.startedAt).getTime()) /
                        1000
                    )
                  : null;

                return (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {backup.filename}
                          </div>
                          {backup.checksum && (
                            <div className="text-xs text-gray-500 font-mono">
                              {backup.checksum.substring(0, 16)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(backup.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(backup.status)}
                      {backup.error && (
                        <div className="text-xs text-red-600 mt-1" title={backup.error}>
                          {backup.error.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(backup.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {duration ? `${duration}s` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {backup.status === "COMPLETED" && (
                          <>
                            <button
                              onClick={() => handleDownload(backup.id, backup.filename)}
                              disabled={actionLoading === backup.id}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRestore(backup.id, backup.filename)}
                              disabled={actionLoading === backup.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Restaurer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {backup.status !== "DELETED" && (
                          <button
                            onClick={() => handleDelete(backup.id, backup.filename)}
                            disabled={actionLoading === backup.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {page} sur {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
