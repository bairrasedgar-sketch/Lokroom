/**
 * Composant Kit Lokeur - Programme de récompense hôtes
 * Affiche la progression et permet de réclamer les kits
 */
"use client";

import { useState, useEffect } from "react";
import {
  GiftIcon,
  CheckCircleIcon,
  LockClosedIcon,
  TruckIcon,
  SparklesIcon,
  KeyIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

type KitConfig = {
  minBookings: number;
  minDurationHours: number;
  displayValueCents: number;
  displayValue: string;
  name: string;
  description: string;
  items: string[];
  canClaim: boolean;
  progress: number;
  bookingsNeeded: number;
  locked: boolean;
  lockedReason: string | null;
};

type ClaimedKit = {
  type: "ESSENTIAL" | "SUPERHOST";
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  claimedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  config: KitConfig;
};

type KitEligibilityResponse = {
  totalQualifyingBookings: number;
  hasClaimedKit: boolean;
  claimedKit: ClaimedKit | null;
  kits: {
    essential: KitConfig;
    superhost: KitConfig;
  };
  decisionHelper: {
    message: string;
    bookingsUntilSuperhost: number;
  } | null;
};

type ShippingAddress = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export default function HostKitReward() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KitEligibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedKit, setSelectedKit] = useState<"ESSENTIAL" | "SUPERHOST" | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
  });

  useEffect(() => {
    fetchEligibility();
  }, []);

  async function fetchEligibility() {
    try {
      setLoading(true);
      const res = await fetch("/api/host/kit");
      if (!res.ok) throw new Error("Erreur de chargement");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!selectedKit || !data) return;

    // Valider l'adresse
    if (!address.firstName || !address.lastName || !address.addressLine1 || !address.city || !address.postalCode) {
      alert("Veuillez remplir tous les champs obligatoires de l'adresse");
      return;
    }

    try {
      setClaiming(true);
      const res = await fetch("/api/host/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitType: selectedKit,
          shippingAddress: address,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erreur lors de la réclamation");
      }

      // Rafraîchir les données
      await fetchEligibility();
      setShowClaimModal(false);
      setSelectedKit(null);

      // Afficher un message de succès
      alert(`🎉 ${result.message}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la réclamation");
    } finally {
      setClaiming(false);
    }
  }

  function openClaimModal(kitType: "ESSENTIAL" | "SUPERHOST") {
    setSelectedKit(kitType);
    setShowClaimModal(true);
  }

  // Status badge pour le kit réclamé
  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: GiftIcon },
      PROCESSING: { label: "En préparation", color: "bg-blue-100 text-blue-800", icon: SparklesIcon },
      SHIPPED: { label: "Expédié", color: "bg-purple-100 text-purple-800", icon: TruckIcon },
      DELIVERED: { label: "Livré", color: "bg-green-100 text-green-800", icon: CheckCircleSolidIcon },
      CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-800", icon: LockClosedIcon },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error || "Erreur de chargement"}</p>
        <button
          onClick={fetchEligibility}
          className="mt-3 text-sm font-medium text-red-700 hover:text-red-800"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Si l'hôte a déjà réclamé un kit
  if (data.hasClaimedKit && data.claimedKit) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <GiftIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {data.claimedKit.config.name}
              </h3>
              <p className="text-sm text-gray-500">
                Valeur {data.claimedKit.config.displayValue}
              </p>
            </div>
          </div>
          {getStatusBadge(data.claimedKit.status)}
        </div>

        {/* Tracking info */}
        {data.claimedKit.status === "SHIPPED" && data.claimedKit.trackingNumber && (
          <div className="mb-4 p-3 rounded-xl bg-white/60 border border-green-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Numéro de suivi :</span>{" "}
              <span className="font-mono">{data.claimedKit.trackingNumber}</span>
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              data.claimedKit.claimedAt ? "bg-green-500 text-white" : "bg-gray-200"
            }`}>
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Réclamé</span>
          </div>
          <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
            <div
              className="h-full bg-green-500 rounded transition-all"
              style={{
                width: data.claimedKit.status === "PENDING" ? "0%" :
                       data.claimedKit.status === "PROCESSING" ? "33%" :
                       data.claimedKit.status === "SHIPPED" ? "66%" : "100%"
              }}
            />
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ["PROCESSING", "SHIPPED", "DELIVERED"].includes(data.claimedKit.status)
                ? "bg-green-500 text-white" : "bg-gray-200"
            }`}>
              <SparklesIcon className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Préparation</span>
          </div>
          <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
            <div
              className="h-full bg-green-500 rounded transition-all"
              style={{
                width: ["SHIPPED", "DELIVERED"].includes(data.claimedKit.status) ? "100%" : "0%"
              }}
            />
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ["SHIPPED", "DELIVERED"].includes(data.claimedKit.status)
                ? "bg-green-500 text-white" : "bg-gray-200"
            }`}>
              <TruckIcon className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Expédié</span>
          </div>
          <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
            <div
              className="h-full bg-green-500 rounded transition-all"
              style={{ width: data.claimedKit.status === "DELIVERED" ? "100%" : "0%" }}
            />
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              data.claimedKit.status === "DELIVERED" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}>
              <HomeIcon className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Livré</span>
          </div>
        </div>

        {/* Contenu du kit */}
        <div className="mt-6 pt-4 border-t border-green-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Contenu de votre kit :</p>
          <ul className="space-y-1">
            {data.claimedKit.config.items.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Afficher les options de kit
  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <GiftIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Programme Kit Lokeur</h3>
            <p className="text-sm text-gray-500">
              {data.totalQualifyingBookings} réservation{data.totalQualifyingBookings > 1 ? "s" : ""} qualifiée{data.totalQualifyingBookings > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Alerte de décision */}
        {data.decisionHelper && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <SparklesIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Choix important !
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {data.decisionHelper.message}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Plus que {data.decisionHelper.bookingsUntilSuperhost} réservation{data.decisionHelper.bookingsUntilSuperhost > 1 ? "s" : ""} pour le Kit Super Hôte
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cartes des kits */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Kit Essentiel */}
          <div className={`relative p-5 rounded-xl border-2 transition-all ${
            data.kits.essential.canClaim
              ? "border-green-500 bg-green-50"
              : data.kits.essential.locked
              ? "border-gray-200 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
          }`}>
            {data.kits.essential.locked && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <LockClosedIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Non disponible</span>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{data.kits.essential.name}</h4>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {data.kits.essential.displayValue}
                </p>
              </div>
              <KeyIcon className="h-8 w-8 text-gray-400" />
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {data.kits.essential.description}
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{data.totalQualifyingBookings} / {data.kits.essential.minBookings} résas</span>
                <span>{Math.round(data.kits.essential.progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.kits.essential.progress}%` }}
                />
              </div>
            </div>

            {/* Items list */}
            <ul className="space-y-1.5 mb-4">
              {data.kits.essential.items.slice(0, 4).map((item, idx) => (
                <li key={idx} className="text-xs text-gray-600">{item}</li>
              ))}
              {data.kits.essential.items.length > 4 && (
                <li className="text-xs text-gray-400">
                  +{data.kits.essential.items.length - 4} autres...
                </li>
              )}
            </ul>

            {data.kits.essential.canClaim ? (
              <button
                onClick={() => openClaimModal("ESSENTIAL")}
                className="w-full py-2.5 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors"
              >
                Réclamer mon kit
              </button>
            ) : data.kits.essential.bookingsNeeded > 0 ? (
              <p className="text-center text-sm text-gray-500">
                Encore {data.kits.essential.bookingsNeeded} résa{data.kits.essential.bookingsNeeded > 1 ? "s" : ""} de 2h+
              </p>
            ) : null}
          </div>

          {/* Kit Super Hôte */}
          <div className={`relative p-5 rounded-xl border-2 transition-all ${
            data.kits.superhost.canClaim
              ? "border-purple-500 bg-purple-50"
              : data.kits.superhost.locked
              ? "border-gray-200 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
          }`}>
            {data.kits.superhost.locked && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500">
                  <LockClosedIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Non disponible</span>
                </div>
              </div>
            )}

            {/* Badge Premium */}
            <div className="absolute -top-3 -right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg">
                <SparklesIcon className="h-3 w-3" />
                PREMIUM
              </span>
            </div>

            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{data.kits.superhost.name}</h4>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {data.kits.superhost.displayValue}
                </p>
              </div>
              <SparklesIcon className="h-8 w-8 text-purple-400" />
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {data.kits.superhost.description}
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{data.totalQualifyingBookings} / {data.kits.superhost.minBookings} résas</span>
                <span>{Math.round(data.kits.superhost.progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.kits.superhost.progress}%` }}
                />
              </div>
            </div>

            {/* Items list */}
            <ul className="space-y-1.5 mb-4">
              {data.kits.superhost.items.slice(0, 4).map((item, idx) => (
                <li key={idx} className="text-xs text-gray-600">{item}</li>
              ))}
              {data.kits.superhost.items.length > 4 && (
                <li className="text-xs text-gray-400">
                  +{data.kits.superhost.items.length - 4} autres...
                </li>
              )}
            </ul>

            {data.kits.superhost.canClaim ? (
              <button
                onClick={() => openClaimModal("SUPERHOST")}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors"
              >
                Réclamer mon kit
              </button>
            ) : data.kits.superhost.bookingsNeeded > 0 ? (
              <p className="text-center text-sm text-gray-500">
                Encore {data.kits.superhost.bookingsNeeded} résa{data.kits.superhost.bookingsNeeded > 1 ? "s" : ""} de 2h+
              </p>
            ) : null}
          </div>
        </div>

        {/* Info */}
        <p className="mt-4 text-xs text-gray-400 text-center">
          Réservations qualifiées : confirmées et d&apos;une durée minimum de 2 heures
        </p>
      </div>

      {/* Modal de réclamation */}
      {showClaimModal && selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedKit === "ESSENTIAL" ? "bg-green-100" : "bg-purple-100"
                }`}>
                  <GiftIcon className={`h-6 w-6 ${
                    selectedKit === "ESSENTIAL" ? "text-green-600" : "text-purple-600"
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Réclamer le {data.kits[selectedKit.toLowerCase() as keyof typeof data.kits].name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Valeur {data.kits[selectedKit.toLowerCase() as keyof typeof data.kits].displayValue}
                  </p>
                </div>
              </div>

              {/* Warning si Kit Essentiel */}
              {selectedKit === "ESSENTIAL" && data.kits.superhost.bookingsNeeded > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    ⚠️ En réclamant ce kit, vous ne pourrez plus obtenir le Kit Super Hôte.
                    Il vous reste {data.kits.superhost.bookingsNeeded} réservations pour y être éligible.
                  </p>
                </div>
              )}

              {/* Formulaire d'adresse */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Adresse de livraison</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={address.firstName}
                      onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={address.lastName}
                      onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Adresse *</label>
                  <input
                    type="text"
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    placeholder="Numéro et rue"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Complément</label>
                  <input
                    type="text"
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                    placeholder="Appartement, étage, etc."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Code postal *</label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ville *</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pays *</label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Canada">Canada</option>
                    <option value="Luxembourg">Luxembourg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="Pour le livreur"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className={`flex-1 py-2.5 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 ${
                    selectedKit === "ESSENTIAL"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {claiming ? "Envoi..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
