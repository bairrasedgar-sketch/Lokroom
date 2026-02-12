/**
 * Page Admin - Codes promo
 * Interface moderne et intuitive
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
import { logger } from "@/lib/logger";

  PlusIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  TagIcon,
  UsersIcon,
  CalendarIcon,
  SparklesIcon,
  PercentBadgeIcon,
  BanknotesIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

type PromoCode = {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  maxPerUser: number;
  validFrom: string;
  validUntil: string | null;
  firstBookingOnly: boolean;
  newUsersOnly: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string | null; email: string };
  totalUsages: number;
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PERCENTAGE: { label: "Pourcentage", icon: PercentBadgeIcon, color: "text-blue-600 bg-blue-50" },
  FIXED_AMOUNT: { label: "Montant fixe", icon: BanknotesIcon, color: "text-green-600 bg-green-50" },
  FREE_SERVICE_FEE: { label: "Frais offerts", icon: GiftIcon, color: "text-purple-600 bg-purple-50" },
};

export default function AdminPromosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; pageCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showCreate, setShowCreate] = useState(false);

  // Form state for new promo
  const [newPromo, setNewPromo] = useState({
    code: "",
    type: "PERCENTAGE",
    value: 10,
    maxUses: "",
    maxPerUser: 1,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    firstBookingOnly: false,
    newUsersOnly: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/promos?${params}`);
      const data = await res.json();

      if (data.promos) setPromos(data.promos);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      logger.error("Erreur chargement promos:", error);
    } finally {
      setLoading(false);
    }
  }, [search, searchParams]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/admin/promos${search ? `?search=${search}` : ""}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPromo,
          maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreate(false);
        setNewPromo({
          code: "",
          type: "PERCENTAGE",
          value: 10,
          maxUses: "",
          maxPerUser: 1,
          validFrom: new Date().toISOString().split("T")[0],
          validUntil: "",
          firstBookingOnly: false,
          newUsersOnly: false,
        });
        fetchPromos();
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const getStatus = (promo: PromoCode) => {
    if (!promo.isActive) return { label: "Inactif", color: "bg-gray-100 text-gray-600", icon: XCircleIcon };
    if (isExpired(promo.validUntil)) return { label: "Expiré", color: "bg-red-50 text-red-600", icon: ClockIcon };
    return { label: "Actif", color: "bg-green-50 text-green-600", icon: CheckCircleIcon };
  };

  const getUsagePercent = (promo: PromoCode) => {
    if (!promo.maxUses) return 0;
    return Math.min((promo.usedCount / promo.maxUses) * 100, 100);
  };

  // Stats
  const activeCount = promos.filter(p => p.isActive && !isExpired(p.validUntil)).length;
  const totalUsages = promos.reduce((acc, p) => acc + p.usedCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes promo</h1>
          <p className="text-gray-500 mt-1">Gérez vos codes promotionnels</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all hover:scale-105"
        >
          <PlusIcon className="h-5 w-5" />
          Nouveau code
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <TicketIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
              <p className="text-sm text-gray-500">Codes au total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-sm text-gray-500">Codes actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalUsages}</p>
              <p className="text-sm text-gray-500">Utilisations totales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* Promos Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            <p className="text-sm text-gray-500">Chargement des codes...</p>
          </div>
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun code promo</h3>
          <p className="text-gray-500 mb-6">Créez votre premier code promotionnel</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Créer un code
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => {
            const status = getStatus(promo);
            const StatusIcon = status.icon;
            const typeConfig = TYPE_CONFIG[promo.type] || TYPE_CONFIG.PERCENTAGE;
            const TypeIcon = typeConfig.icon;
            const usagePercent = getUsagePercent(promo);

            return (
              <div
                key={promo.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all"
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-lg font-bold text-gray-900 truncate">
                          {promo.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-xl ${typeConfig.color}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Value */}
                <div className="px-5 py-4 bg-gray-50">
                  <p className="text-3xl font-bold text-gray-900">
                    {promo.type === "PERCENTAGE" ? `${promo.value}%` :
                     promo.type === "FIXED_AMOUNT" ? `${promo.value} €` :
                     "Gratuit"}
                  </p>
                  <p className="text-sm text-gray-500">{typeConfig.label}</p>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  {/* Usage */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-500">Utilisations</span>
                      <span className="font-medium text-gray-900">
                        {promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ""}
                      </span>
                    </div>
                    {promo.maxUses && (
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usagePercent >= 90 ? "bg-red-500" :
                            usagePercent >= 70 ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {formatDate(promo.validFrom)}
                      {promo.validUntil && ` → ${formatDate(promo.validUntil)}`}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {promo.firstBookingOnly && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        <SparklesIcon className="h-3 w-3" />
                        1ère réservation
                      </span>
                    )}
                    {promo.newUsersOnly && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        <UsersIcon className="h-3 w-3" />
                        Nouveaux utilisateurs
                      </span>
                    )}
                    {promo.maxPerUser > 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        Max {promo.maxPerUser}/user
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nouveau code promo</h2>
                <p className="text-sm text-gray-500">Créez un code promotionnel</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code promotionnel
                </label>
                <input
                  type="text"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-mono uppercase"
                  placeholder="WELCOME20"
                  required
                />
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    value={newPromo.type}
                    onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  >
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED_AMOUNT">Montant fixe</option>
                    <option value="FREE_SERVICE_FEE">Frais offerts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Valeur {newPromo.type === "PERCENTAGE" ? "(%)" : "(€)"}
                  </label>
                  <input
                    type="number"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    min={1}
                    max={newPromo.type === "PERCENTAGE" ? 100 : undefined}
                    required
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Utilisations max
                  </label>
                  <input
                    type="number"
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    placeholder="Illimité"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max par utilisateur
                  </label>
                  <input
                    type="number"
                    value={newPromo.maxPerUser}
                    onChange={(e) => setNewPromo({ ...newPromo, maxPerUser: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    min={1}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={newPromo.validFrom}
                    onChange={(e) => setNewPromo({ ...newPromo, validFrom: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date d&apos;expiration
                  </label>
                  <input
                    type="date"
                    value={newPromo.validUntil}
                    onChange={(e) => setNewPromo({ ...newPromo, validUntil: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Laissez vide pour illimité</p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={newPromo.firstBookingOnly}
                    onChange={(e) => setNewPromo({ ...newPromo, firstBookingOnly: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Première réservation uniquement</p>
                    <p className="text-sm text-gray-500">Le code ne fonctionne que pour la première réservation</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={newPromo.newUsersOnly}
                    onChange={(e) => setNewPromo({ ...newPromo, newUsersOnly: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Nouveaux utilisateurs uniquement</p>
                    <p className="text-sm text-gray-500">Réservé aux comptes créés récemment</p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-5 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Création...
                    </span>
                  ) : (
                    "Créer le code"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
