/**
 * Page Admin - Logs d'audit
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClockIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { logger } from "@/lib/logger";


type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  USER_CREATED: { label: "Utilisateur créé", color: "bg-blue-100 text-blue-800" },
  USER_UPDATED: { label: "Utilisateur modifié", color: "bg-blue-100 text-blue-800" },
  USER_BANNED: { label: "Utilisateur banni", color: "bg-red-100 text-red-800" },
  USER_UNBANNED: { label: "Utilisateur débanni", color: "bg-green-100 text-green-800" },
  USER_ROLE_CHANGED: { label: "Rôle modifié", color: "bg-purple-100 text-purple-800" },
  LISTING_APPROVED: { label: "Annonce approuvée", color: "bg-green-100 text-green-800" },
  LISTING_REJECTED: { label: "Annonce rejetée", color: "bg-red-100 text-red-800" },
  LISTING_SUSPENDED: { label: "Annonce suspendue", color: "bg-orange-100 text-orange-800" },
  LISTING_UNSUSPENDED: { label: "Annonce réactivée", color: "bg-green-100 text-green-800" },
  CONFIG_CHANGED: { label: "Configuration modifiée", color: "bg-yellow-100 text-yellow-800" },
  PROMO_CREATED: { label: "Code promo créé", color: "bg-blue-100 text-blue-800" },
  DISPUTE_ASSIGNED: { label: "Litige assigné", color: "bg-blue-100 text-blue-800" },
  DISPUTE_RESOLVED: { label: "Litige résolu", color: "bg-green-100 text-green-800" },
};

export default function AdminLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; pageCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState(searchParams.get("action") || "");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      params.set("pageSize", "50");
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();

      if (data.logs) setLogs(data.logs);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      logger.error("Erreur chargement logs:", error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, searchParams]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs d&apos;audit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historique de toutes les actions administratives
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              router.push(`/admin/logs${e.target.value ? `?action=${e.target.value}` : ""}`);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Toutes les actions</option>
            <option value="USER_BANNED">Bannissements</option>
            <option value="USER_ROLE_CHANGED">Changements de rôle</option>
            <option value="LISTING_APPROVED">Annonces approuvées</option>
            <option value="LISTING_REJECTED">Annonces rejetées</option>
            <option value="LISTING_SUSPENDED">Annonces suspendues</option>
            <option value="CONFIG_CHANGED">Modifications config</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            Aucun log trouvé
          </div>
        ) : (
          logs.map((log) => {
            const actionConfig = ACTION_LABELS[log.action] || {
              label: log.action,
              color: "bg-gray-100 text-gray-800",
            };

            return (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionConfig.color}`}>
                        {actionConfig.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {log.entityType} • {log.entityId.substring(0, 8)}...
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">
                      Par <span className="font-medium">{log.admin.name || log.admin.email}</span>
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatDate(log.createdAt)}
                      </span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => router.push(`/admin/logs?page=${pagination.page - 1}`)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="px-4 py-2">
            {pagination.page} / {pagination.pageCount}
          </span>
          <button
            onClick={() => router.push(`/admin/logs?page=${pagination.page + 1}`)}
            disabled={pagination.page === pagination.pageCount}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
