"use client";

import { useState } from "react";
import { Bell, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setResult({ type: "error", message: "Les notifications ne sont pas supportées par votre navigateur" });
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      setResult({ type: "success", message: "Permission accordée ! Vous pouvez maintenant recevoir des notifications." });
    } else {
      setResult({ type: "error", message: "Permission refusée. Veuillez autoriser les notifications dans les paramètres de votre navigateur." });
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Vérifier la permission
      if (permission !== "granted") {
        setResult({ type: "error", message: "Veuillez d'abord autoriser les notifications" });
        setIsLoading(false);
        return;
      }

      // Envoyer une notification de test via l'API
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "MESSAGE_NEW",
          data: {
            senderName: "Test User",
            messagePreview: "Ceci est une notification de test !",
            conversationId: "test",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          type: "success",
          message: `Notification envoyée avec succès ! (${data.sent || 0} envoyée(s))`,
        });
      } else {
        const error = await response.json();
        setResult({
          type: "error",
          message: error.error || "Erreur lors de l'envoi de la notification",
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setResult({
        type: "error",
        message: "Erreur lors de l'envoi de la notification",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendBrowserNotification = () => {
    if (permission !== "granted") {
      setResult({ type: "error", message: "Veuillez d'abord autoriser les notifications" });
      return;
    }

    // Envoyer une notification directement depuis le navigateur (sans passer par le serveur)
    new Notification("Test Lok'Room", {
      body: "Ceci est une notification de test locale !",
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      tag: "test-notification",
    });

    setResult({
      type: "success",
      message: "Notification locale envoyée !",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Push Notifications</h1>
              <p className="text-gray-600">Page de test pour le système de notifications push</p>
            </div>
          </div>

          {/* Permission Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Statut des notifications</p>
                <p className="text-sm text-gray-600 mt-1">
                  {permission === "granted" && "✅ Autorisées"}
                  {permission === "denied" && "❌ Bloquées"}
                  {permission === "default" && "⚠️ Non configurées"}
                </p>
              </div>
              {permission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Autoriser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions de test</h2>

          <div className="space-y-4">
            {/* Test 1: Browser Notification */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">1. Notification locale (navigateur)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Envoie une notification directement depuis le navigateur, sans passer par le serveur.
              </p>
              <button
                onClick={sendBrowserNotification}
                disabled={permission !== "granted"}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Envoyer notification locale
              </button>
            </div>

            {/* Test 2: Server Push Notification */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">2. Notification push (serveur)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Envoie une notification via le serveur en utilisant le système de push notifications complet.
              </p>
              <button
                onClick={sendTestNotification}
                disabled={isLoading || permission !== "granted"}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer notification push
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`rounded-lg p-4 flex items-start gap-3 ${
              result.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  result.type === "success" ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.type === "success" ? "Succès" : "Erreur"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  result.type === "success" ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de débogage</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Notifications supportées</span>
              <span className="font-medium text-gray-900">
                {typeof window !== "undefined" && "Notification" in window ? "Oui" : "Non"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Service Worker supporté</span>
              <span className="font-medium text-gray-900">
                {typeof window !== "undefined" && "serviceWorker" in navigator ? "Oui" : "Non"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Permission</span>
              <span className="font-medium text-gray-900">{permission}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">User Agent</span>
              <span className="font-medium text-gray-900 text-right max-w-md truncate">
                {typeof window !== "undefined" ? navigator.userAgent : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Cliquez sur "Autoriser" pour accorder la permission de notifications</li>
            <li>Testez la notification locale pour vérifier que le navigateur fonctionne</li>
            <li>Testez la notification push pour vérifier le système complet (serveur + Service Worker)</li>
            <li>Vérifiez que la notification apparaît dans votre système d'exploitation</li>
            <li>Cliquez sur la notification pour vérifier la navigation</li>
          </ol>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Note</strong>: Cette page est destinée au développement uniquement. Supprimez-la en production.
          </p>
        </div>
      </div>
    </div>
  );
}
