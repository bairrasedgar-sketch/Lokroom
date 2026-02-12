"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Trash2, Plus, Search } from "lucide-react";
import { logger } from "@/lib/logger";


interface SavedSearch {
  id: string;
  name: string;
  filters: {
    query?: string;
    city?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
  };
  alertEnabled: boolean;
  createdAt: Date;
  lastNotified?: Date;
}

export function SavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/search/saved");
      if (response.ok) {
        const data = await response.json();
        setSearches(data.searches || []);
      }
    } catch (error) {
      logger.error("Erreur chargement recherches sauvegardées:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async (searchId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/search/saved/${searchId}/alert`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setSearches(
          searches.map((s) =>
            s.id === searchId ? { ...s, alertEnabled: enabled } : s
          )
        );
      }
    } catch (error) {
      logger.error("Erreur toggle alerte:", error);
    }
  };

  const deleteSearch = async (searchId: string) => {
    if (!confirm("Supprimer cette recherche sauvegardée ?")) return;

    try {
      const response = await fetch(`/api/search/saved/${searchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSearches(searches.filter((s) => s.id !== searchId));
      }
    } catch (error) {
      logger.error("Erreur suppression recherche:", error);
    }
  };

  const formatFilters = (filters: SavedSearch["filters"]) => {
    const parts: string[] = [];
    if (filters.query) parts.push(`"${filters.query}"`);
    if (filters.city) parts.push(filters.city);
    if (filters.category) parts.push(filters.category);
    if (filters.minPrice || filters.maxPrice) {
      parts.push(
        `${filters.minPrice || 0}€ - ${filters.maxPrice || "∞"}€`
      );
    }
    if (filters.guests) parts.push(`${filters.guests} voyageurs`);
    return parts.join(" • ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Recherches sauvegardées
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle recherche
        </button>
      </div>

      {/* Liste */}
      {searches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune recherche sauvegardée
          </h3>
          <p className="text-gray-600 mb-4">
            Sauvegardez vos recherches pour recevoir des alertes
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Créer une recherche
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {search.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {formatFilters(search.filters)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      Créée le{" "}
                      {new Date(search.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    {search.lastNotified && (
                      <span>
                        Dernière alerte:{" "}
                        {new Date(search.lastNotified).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle alerte */}
                  <button
                    onClick={() =>
                      toggleAlert(search.id, !search.alertEnabled)
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      search.alertEnabled
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      search.alertEnabled
                        ? "Désactiver les alertes"
                        : "Activer les alertes"
                    }
                  >
                    {search.alertEnabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={() => deleteSearch(search.id)}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
