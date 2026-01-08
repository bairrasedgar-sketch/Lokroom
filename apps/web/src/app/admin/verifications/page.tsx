/**
 * Page Admin - Vérifications d'identité
 * Gestion des KYC, approbation/rejet des vérifications
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  HomeModernIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

type User = {
  id: string;
  name: string | null;
  email: string;
  identityStatus: string;
  identityStripeSessionId: string | null;
  identityLastVerifiedAt: string | null;
  emailVerified: string | null;
  createdAt: string;
  country: string | null;
  profile: {
    avatarUrl: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    birthDate: string | null;
  } | null;
  hostProfile: {
    kycStatus: string;
    payoutsEnabled: boolean;
    stripeAccountId: string | null;
  } | null;
  listingsCount: number;
  bookingsCount: number;
};

type Stats = {
  pending: number;
  verified: number;
  rejected: number;
  unverified: number;
  total: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  PENDING: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100", icon: ClockIcon },
  VERIFIED: { label: "Vérifié", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircleIcon },
  REJECTED: { label: "Refusé", color: "text-red-700", bgColor: "bg-red-100", icon: XCircleIcon },
  UNVERIFIED: { label: "Non vérifié", color: "text-gray-700", bgColor: "bg-gray-100", icon: ShieldExclamationIcon },
};

export default function AdminVerificationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<string>("");
  const [actionReason, setActionReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchVerifications(1, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchVerifications = async (page = 1, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/verifications?${params}`, { signal });
      const data = await res.json();

      setUsers(data.users || []);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: actionType,
          reason: actionReason,
        }),
      });
      if (res.ok) {
        fetchVerifications(pagination?.page || 1);
        setShowActionModal(false);
        setSelectedUser(null);
        setActionType("");
        setActionReason("");
      }
    } finally {
      setSaving(false);
    }
  };

  const openActionModal = (user: User, action: string) => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerifications(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vérifications d&apos;identité</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les demandes de vérification d&apos;identité des utilisateurs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "PENDING" ? "border-yellow-500 ring-2 ring-yellow-200" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("VERIFIED")}
          className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "VERIFIED" ? "border-green-500 ring-2 ring-green-200" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.verified || 0}</p>
              <p className="text-sm text-gray-500">Vérifiés</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "REJECTED" ? "border-red-500 ring-2 ring-red-200" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.rejected || 0}</p>
              <p className="text-sm text-gray-500">Refusés</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("")}
          className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
            statusFilter === "" ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <IdentificationIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </form>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="VERIFIED">Vérifiés</option>
            <option value="REJECTED">Refusés</option>
            <option value="UNVERIFIED">Non vérifiés</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {users.map((user) => {
              const statusConfig = STATUS_CONFIG[user.identityStatus] || STATUS_CONFIG.UNVERIFIED;
              const StatusIcon = statusConfig.icon;

              return (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.profile?.avatarUrl ? (
                        <div className="relative w-14 h-14 rounded-full overflow-hidden">
                          <Image
                            src={user.profile.avatarUrl}
                            alt={`Avatar de ${user.name || "utilisateur"}`}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-medium">
                          {user.name?.charAt(0) || "?"}
                        </div>
                      )}
                      {user.identityStatus === "VERIFIED" && (
                        <CheckBadgeIcon className="absolute -bottom-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-semibold text-gray-900 hover:text-red-600"
                        >
                          {user.name || "Sans nom"}
                        </Link>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          {user.email}
                        </span>
                        {user.profile?.phone && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="h-4 w-4" />
                            {user.profile.phone}
                          </span>
                        )}
                        {user.country && (
                          <span>{user.country}</span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="h-3.5 w-3.5" />
                          Inscrit {formatDate(user.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HomeModernIcon className="h-3.5 w-3.5" />
                          {user.listingsCount} annonce(s)
                        </span>
                        <span>{user.bookingsCount} réservation(s)</span>
                        {user.emailVerified && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            Email vérifié
                          </span>
                        )}
                        {user.hostProfile?.payoutsEnabled && (
                          <span className="text-blue-600 flex items-center gap-1">
                            <DocumentCheckIcon className="h-3.5 w-3.5" />
                            Stripe OK
                          </span>
                        )}
                      </div>

                      {user.identityLastVerifiedAt && (
                        <p className="mt-1 text-xs text-green-600">
                          Vérifié le {formatDate(user.identityLastVerifiedAt)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.identityStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => openActionModal(user, "approve")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Approuver
                          </button>
                          <button
                            onClick={() => openActionModal(user, "reject")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Refuser
                          </button>
                        </>
                      )}
                      {user.identityStatus === "VERIFIED" && (
                        <button
                          onClick={() => openActionModal(user, "reset")}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Révoquer
                        </button>
                      )}
                      {user.identityStatus === "REJECTED" && (
                        <button
                          onClick={() => openActionModal(user, "request_documents")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          <DocumentCheckIcon className="h-4 w-4" />
                          Redemander
                        </button>
                      )}
                      {user.identityStatus === "UNVERIFIED" && (
                        <button
                          onClick={() => openActionModal(user, "request_documents")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          Demander vérif.
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="p-8 text-center">
                <ShieldCheckIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Aucune vérification trouvée</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchVerifications(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => fetchVerifications(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === "approve" && "Approuver la vérification"}
                {actionType === "reject" && "Refuser la vérification"}
                {actionType === "reset" && "Révoquer la vérification"}
                {actionType === "request_documents" && "Demander des documents"}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedUser.name || "Sans nom"}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            {actionType === "approve" && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  L&apos;utilisateur recevra le badge &quot;Identité vérifiée&quot; et sera notifié.
                </p>
              </div>
            )}

            {(actionType === "reject" || actionType === "request_documents") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison / Message
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder={
                    actionType === "reject"
                      ? "Raison du refus..."
                      : "Message pour l'utilisateur..."
                  }
                />
              </div>
            )}

            {actionType === "reset" && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                  Le badge sera retiré et l&apos;utilisateur devra se re-vérifier.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={saving || ((actionType === "reject" || actionType === "request_documents") && !actionReason.trim())}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === "approve"
                    ? "bg-green-500 hover:bg-green-600"
                    : actionType === "reject"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {saving ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
