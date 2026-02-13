/**
 * Page Admin - Liste des litiges
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/logger";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

type Dispute = {
  id: string;
  reason: string;
  status: string;
  priority: number;
  description: string;
  claimedAmountCents: number | null;
  awardedAmountCents: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  openedBy: { id: string; name: string | null; email: string };
  against: { id: string; name: string | null; email: string };
  assignedAdmin: { id: string; name: string | null } | null;
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    listing: { title: string };
  };
  messagesCount: number;
  evidenceCount: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Ouvert", color: "bg-red-100 text-red-800" },
  UNDER_REVIEW: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  AWAITING_HOST: { label: "Attente hôte", color: "bg-orange-100 text-orange-800" },
  AWAITING_GUEST: { label: "Attente voyageur", color: "bg-orange-100 text-orange-800" },
  MEDIATION: { label: "Médiation", color: "bg-blue-100 text-blue-800" },
  RESOLVED_GUEST: { label: "Résolu (voyageur)", color: "bg-green-100 text-green-800" },
  RESOLVED_HOST: { label: "Résolu (hôte)", color: "bg-green-100 text-green-800" },
  RESOLVED_PARTIAL: { label: "Résolu (partiel)", color: "bg-green-100 text-green-800" },
  CLOSED: { label: "Fermé", color: "bg-gray-100 text-gray-800" },
  ESCALATED: { label: "Escaladé", color: "bg-purple-100 text-purple-800" },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "Critique", color: "bg-red-500 text-white" },
  2: { label: "Haute", color: "bg-orange-500 text-white" },
  3: { label: "Moyenne", color: "bg-yellow-500 text-white" },
  4: { label: "Basse", color: "bg-blue-500 text-white" },
  5: { label: "Très basse", color: "bg-gray-500 text-white" },
};

const REASON_LABELS: Record<string, string> = {
  PROPERTY_NOT_AS_DESCRIBED: "Propriété non conforme",
  CLEANLINESS_ISSUE: "Problème de propreté",
  AMENITIES_MISSING: "Équipements manquants",
  HOST_UNRESPONSIVE: "Hôte non réactif",
  GUEST_DAMAGE: "Dégâts causés par le voyageur",
  GUEST_VIOLATION: "Violation des règles",
  PAYMENT_ISSUE: "Problème de paiement",
  CANCELLATION_DISPUTE: "Litige d'annulation",
  SAFETY_CONCERN: "Problème de sécurité",
  NOISE_COMPLAINT: "Nuisances sonores",
  UNAUTHORIZED_GUESTS: "Invités non autorisés",
  OTHER: "Autre",
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; pageCount: number } | null>(null);
  const [stats, setStats] = useState<{ open: number; byPriority: Record<number, number> }>({ open: 0, byPriority: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/disputes?${params}`);
      const data = await res.json();

      if (data.disputes) setDisputes(data.disputes);
      if (data.pagination) setPagination(data.pagination);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      logger.error("Erreur chargement disputes:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchParams]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Litiges</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.open} litiges ouverts
          </p>
        </div>
        <div className="flex gap-2">
          {Object.entries(stats.byPriority || {}).map(([priority, count]) => {
            const config = PRIORITY_CONFIG[Number(priority)];
            if (!config || count === 0) return null;
            return (
              <div key={priority} className={`px-3 py-1 rounded text-xs font-medium ${config.color}`}>
                {config.label}: {count}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              router.push(`/admin/disputes${e.target.value ? `?status=${e.target.value}` : ""}`);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="OPEN">Ouverts</option>
            <option value="UNDER_REVIEW">En cours</option>
            <option value="AWAITING_HOST">Attente hôte</option>
            <option value="AWAITING_GUEST">Attente voyageur</option>
            <option value="MEDIATION">Médiation</option>
            <option value="CLOSED">Fermés</option>
          </select>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-gray-500">Aucun litige trouvé</p>
          </div>
        ) : (
          disputes.map((dispute) => {
            const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.OPEN;
            const priorityConfig = PRIORITY_CONFIG[dispute.priority] || PRIORITY_CONFIG[3];

            return (
              <div
                key={dispute.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.color}`}>
                        P{dispute.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {REASON_LABELS[dispute.reason] || dispute.reason}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">
                      {dispute.booking.listing.title}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {dispute.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <UserCircleIcon className="h-4 w-4" />
                        <span>Ouvert par: {dispute.openedBy.name || dispute.openedBy.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span>Contre: {dispute.against.name || dispute.against.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <ClockIcon className="h-4 w-4" />
                        <span>{formatDate(dispute.createdAt)}</span>
                      </div>
                    </div>

                    {dispute.claimedAmountCents && (
                      <p className="mt-2 text-sm font-medium text-orange-600">
                        Montant réclamé: {(dispute.claimedAmountCents / 100).toFixed(2)} €
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="flex gap-2 text-xs text-gray-500 mb-4">
                      <span>{dispute.messagesCount} messages</span>
                      <span>•</span>
                      <span>{dispute.evidenceCount} preuves</span>
                    </div>

                    {dispute.assignedAdmin ? (
                      <p className="text-xs text-gray-500 mb-2">
                        Assigné à: {dispute.assignedAdmin.name}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-600 mb-2">Non assigné</p>
                    )}

                    <Link
                      href={`/admin/disputes/${dispute.id}`}
                      className="inline-flex px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                    >
                      Gérer
                    </Link>
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
            onClick={() => router.push(`/admin/disputes?page=${pagination.page - 1}`)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="px-4 py-2">
            {pagination.page} / {pagination.pageCount}
          </span>
          <button
            onClick={() => router.push(`/admin/disputes?page=${pagination.page + 1}`)}
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
