"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Smartphone, Mail, MessageSquare, Calendar, CreditCard, Star, AlertCircle, Check, X } from "lucide-react";

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferences: {
    bookingRequest: boolean;
    bookingConfirmed: boolean;
    bookingCancelled: boolean;
    bookingReminder: boolean;
    messageNew: boolean;
    reviewReceived: boolean;
    reviewReminder: boolean;
    payoutSent: boolean;
    listingApproved: boolean;
    listingRejected: boolean;
    disputeOpened: boolean;
    marketing: boolean;
  };
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    preferences: {
      bookingRequest: true,
      bookingConfirmed: true,
      bookingCancelled: true,
      bookingReminder: true,
      messageNew: true,
      reviewReceived: true,
      reviewReminder: true,
      payoutSent: true,
      listingApproved: true,
      listingRejected: true,
      disputeOpened: true,
      marketing: false,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPushPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setSettings({
            pushEnabled: data.preferences.pushEnabled ?? true,
            emailEnabled: data.preferences.emailEnabled ?? true,
            smsEnabled: data.preferences.smsEnabled ?? false,
            preferences: {
              ...settings.preferences,
              ...(typeof data.preferences.preferences === "object" ? data.preferences.preferences : {}),
            },
          });
        }
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPushPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);

      // Vérifier si l'utilisateur a un abonnement actif
      if ("serviceWorker" in navigator && Notification.permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setHasSubscription(!!subscription);
        } catch (error) {
          console.error("Error checking push subscription:", error);
        }
      }
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveMessage({ type: "success", text: "Paramètres enregistrés avec succès" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setSaveMessage({ type: "error", text: "Erreur lors de l'enregistrement" });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePushNotifications = async () => {
    if (!settings.pushEnabled) {
      // Activer les notifications push
      if (pushPermission === "default") {
        // Demander la permission
        const result = await Notification.requestPermission();
        setPushPermission(result);

        if (result === "granted") {
          // Créer l'abonnement
          await createPushSubscription();
          setSettings({ ...settings, pushEnabled: true });
        }
      } else if (pushPermission === "granted") {
        setSettings({ ...settings, pushEnabled: true });
      } else {
        alert("Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.");
      }
    } else {
      // Désactiver les notifications push
      setSettings({ ...settings, pushEnabled: false });
    }
  };

  const createPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
          userAgent: navigator.userAgent,
        }),
      });

      setHasSubscription(true);
    } catch (error) {
      console.error("Error creating push subscription:", error);
    }
  };

  const togglePreference = (key: keyof NotificationSettings["preferences"]) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: !settings.preferences[key],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
          <p className="text-gray-600">
            Gérez vos préférences de notification pour rester informé de vos réservations et messages.
          </p>
        </div>

        {/* Canaux de notification */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Canaux de notification</h3>

          <div className="space-y-4">
            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="font-medium text-gray-900">Notifications push</p>
                  <p className="text-sm text-gray-600">
                    {pushPermission === "granted"
                      ? hasSubscription
                        ? "Activées sur cet appareil"
                        : "Permission accordée"
                      : pushPermission === "denied"
                      ? "Bloquées par le navigateur"
                      : "Non configurées"}
                  </p>
                </div>
              </div>
              <button
                onClick={togglePushNotifications}
                disabled={pushPermission === "denied"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.pushEnabled ? "bg-black" : "bg-gray-300"
                } ${pushPermission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.pushEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="font-medium text-gray-900">Notifications email</p>
                  <p className="text-sm text-gray-600">Recevoir des emails pour les événements importants</p>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailEnabled: !settings.emailEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailEnabled ? "bg-black" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <div>
                  <p className="font-medium text-gray-900">Notifications SMS</p>
                  <p className="text-sm text-gray-600">Recevoir des SMS pour les urgences (bientôt disponible)</p>
                </div>
              </div>
              <button
                disabled
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 opacity-50 cursor-not-allowed"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Préférences détaillées */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de notifications</h3>

          <div className="space-y-6">
            {/* Réservations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Réservations</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Nouvelles demandes de réservation"
                  checked={settings.preferences.bookingRequest}
                  onChange={() => togglePreference("bookingRequest")}
                />
                <NotificationToggle
                  label="Réservations confirmées"
                  checked={settings.preferences.bookingConfirmed}
                  onChange={() => togglePreference("bookingConfirmed")}
                />
                <NotificationToggle
                  label="Réservations annulées"
                  checked={settings.preferences.bookingCancelled}
                  onChange={() => togglePreference("bookingCancelled")}
                />
                <NotificationToggle
                  label="Rappels de réservation"
                  checked={settings.preferences.bookingReminder}
                  onChange={() => togglePreference("bookingReminder")}
                />
              </div>
            </div>

            {/* Messages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Messages</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Nouveaux messages"
                  checked={settings.preferences.messageNew}
                  onChange={() => togglePreference("messageNew")}
                />
              </div>
            </div>

            {/* Avis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Avis</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Avis reçus"
                  checked={settings.preferences.reviewReceived}
                  onChange={() => togglePreference("reviewReceived")}
                />
                <NotificationToggle
                  label="Rappels pour laisser un avis"
                  checked={settings.preferences.reviewReminder}
                  onChange={() => togglePreference("reviewReminder")}
                />
              </div>
            </div>

            {/* Paiements */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Paiements</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Paiements reçus"
                  checked={settings.preferences.payoutSent}
                  onChange={() => togglePreference("payoutSent")}
                />
              </div>
            </div>

            {/* Annonces */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Annonces</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Annonces approuvées"
                  checked={settings.preferences.listingApproved}
                  onChange={() => togglePreference("listingApproved")}
                />
                <NotificationToggle
                  label="Annonces refusées"
                  checked={settings.preferences.listingRejected}
                  onChange={() => togglePreference("listingRejected")}
                />
              </div>
            </div>

            {/* Litiges */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Litiges</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Litiges ouverts"
                  checked={settings.preferences.disputeOpened}
                  onChange={() => togglePreference("disputeOpened")}
                />
              </div>
            </div>

            {/* Marketing */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-gray-700" />
                <h4 className="font-medium text-gray-900">Marketing</h4>
              </div>
              <div className="space-y-2 ml-7">
                <NotificationToggle
                  label="Offres et promotions"
                  checked={settings.preferences.marketing}
                  onChange={() => togglePreference("marketing")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec bouton de sauvegarde */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {saveMessage && (
                <div className={`flex items-center gap-2 text-sm ${
                  saveMessage.type === "success" ? "text-green-600" : "text-red-600"
                }`}>
                  {saveMessage.type === "success" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {saveMessage.text}
                </div>
              )}
            </div>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-700">{label}</label>
      <button
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-black" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// Utilitaires
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
