/**
 * Page Admin - Codes promo
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
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

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "Pourcentage",
  FIXED_AMOUNT: "Montant fixe",
  FREE_SERVICE_FEE: "Frais offerts",
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
      console.error("Erreur chargement promos:", error);
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

    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPromo,
          maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
        }),
      });

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
      }
    } catch (error) {
      console.error("Erreur création promo:", error);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes promo</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination?.total || 0} codes au total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <PlusIcon className="h-5 w-5" />
          Nouveau code
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Créer un code promo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="WELCOME20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newPromo.type}
                    onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED_AMOUNT">Montant fixe</option>
                    <option value="FREE_SERVICE_FEE">Frais offerts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeur {newPromo.type === "PERCENTAGE" ? "(%)" : "(€)"}
                  </label>
                  <input
                    type="number"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max utilisations</label>
                  <input
                    type="number"
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Illimité"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max par utilisateur</label>
                  <input
                    type="number"
                    value={newPromo.maxPerUser}
                    onChange={(e) => setNewPromo({ ...newPromo, maxPerUser: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valide à partir du</label>
                  <input
                    type="date"
                    value={newPromo.validFrom}
                    onChange={(e) => setNewPromo({ ...newPromo, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expire le</label>
                  <input
                    type="date"
                    value={newPromo.validUntil}
                    onChange={(e) => setNewPromo({ ...newPromo, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPromo.firstBookingOnly}
                    onChange={(e) => setNewPromo({ ...newPromo, firstBookingOnly: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Première résa uniquement</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPromo.newUsersOnly}
                    onChange={(e) => setNewPromo({ ...newPromo, newUsersOnly: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Nouveaux users</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Rechercher
          </button>
        </form>
      </div>

      {/* Promos Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Valeur</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utilisation</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Validité</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
                </td>
              </tr>
            ) : promos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <TicketIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  Aucun code promo
                </td>
              </tr>
            ) : (
              promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-gray-900">{promo.code}</span>
                    <div className="flex gap-1 mt-1">
                      {promo.firstBookingOnly && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">1ère résa</span>
                      )}
                      {promo.newUsersOnly && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">Nouveaux</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {TYPE_LABELS[promo.type] || promo.type}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {promo.type === "PERCENTAGE" ? `${promo.value}%` :
                     promo.type === "FIXED_AMOUNT" ? `${promo.value} €` :
                     "Gratuit"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium">{promo.usedCount}</span>
                    <span className="text-gray-500">
                      {promo.maxUses ? ` / ${promo.maxUses}` : " (illimité)"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>{formatDate(promo.validFrom)}</p>
                    {promo.validUntil && (
                      <p className="text-gray-400">→ {formatDate(promo.validUntil)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!promo.isActive ? (
                      <span className="flex items-center gap-1 text-gray-500">
                        <XCircleIcon className="h-4 w-4" /> Inactif
                      </span>
                    ) : isExpired(promo.validUntil) ? (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircleIcon className="h-4 w-4" /> Expiré
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="h-4 w-4" /> Actif
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
