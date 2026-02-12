"use client";

import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";


const EMAIL_TYPES = [
  { value: "booking-confirmation", label: "Confirmation de réservation (Voyageur)" },
  { value: "booking-request", label: "Nouvelle réservation (Hôte)" },
  { value: "booking-cancelled", label: "Annulation de réservation" },
  { value: "payment-receipt", label: "Reçu de paiement" },
  { value: "message-notification", label: "Notification de message" },
  { value: "review-request", label: "Demande d'avis" },
  { value: "welcome-email", label: "Email de bienvenue" },
  { value: "password-reset", label: "Réinitialisation de mot de passe" },
  { value: "listing-approved", label: "Annonce approuvée" },
  { value: "payout-notification", label: "Notification de paiement (Hôte)" },
];

export default function TestEmailsPage() {
  const [selectedType, setSelectedType] = useState("booking-confirmation");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendTest = async () => {
    if (!email) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/test-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          to: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Email "${selectedType}" envoyé avec succès !`);
      } else {
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur réseau");
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Test des emails transactionnels
            </h1>
            <p className="text-gray-600">
              Testez tous les templates d'emails de Lok'Room
            </p>
          </div>

          <div className="space-y-6">
            {/* Type d'email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'email
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {EMAIL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email destinataire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email destinataire
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Bouton d'envoi */}
            <button
              onClick={handleSendTest}
              disabled={loading}
              className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Envoi en cours..." : "Envoyer l'email de test"}
            </button>
          </div>

          {/* Informations */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Informations
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Les emails sont envoyés avec des données de test</li>
              <li>• Vérifiez votre boîte de réception et vos spams</li>
              <li>• RESEND_API_KEY doit être configurée dans .env</li>
            </ul>
          </div>

          {/* Liste des templates */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Templates disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EMAIL_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {type.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
