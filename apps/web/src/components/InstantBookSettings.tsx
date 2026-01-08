// apps/web/src/components/InstantBookSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BoltIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import {
  IdentificationIcon,
  StarIcon,
  CameraIcon,
  PhoneIcon,
  ClockIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

type InstantBookSettingsData = {
  requireVerifiedId: boolean;
  requirePositiveReviews: boolean;
  minGuestRating: number | null;
  requireProfilePhoto: boolean;
  requirePhoneVerified: boolean;
  maxNights: number | null;
  minNights: number | null;
  advanceNoticeHours: number;
  autoMessage: string | null;
};

type InstantBookSettingsProps = {
  listingId: string;
  initialEnabled: boolean;
  initialSettings?: InstantBookSettingsData | null;
  onSave?: (enabled: boolean, settings: InstantBookSettingsData) => void;
};

const DEFAULT_SETTINGS: InstantBookSettingsData = {
  requireVerifiedId: false,
  requirePositiveReviews: false,
  minGuestRating: null,
  requireProfilePhoto: false,
  requirePhoneVerified: false,
  maxNights: null,
  minNights: null,
  advanceNoticeHours: 24,
  autoMessage: null,
};

/**
 * Formulaire de configuration des paramètres Instant Book pour les hôtes
 */
export default function InstantBookSettings({
  listingId,
  initialEnabled,
  initialSettings,
  onSave,
}: InstantBookSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [settings, setSettings] = useState<InstantBookSettingsData>(
    initialSettings ?? DEFAULT_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Détecter les changements
  useEffect(() => {
    const settingsChanged =
      JSON.stringify(settings) !== JSON.stringify(initialSettings ?? DEFAULT_SETTINGS);
    const enabledChanged = enabled !== initialEnabled;
    setHasChanges(settingsChanged || enabledChanged);
  }, [settings, enabled, initialSettings, initialEnabled]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch(`/api/host/listings/${listingId}/instant-book`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          ...settings,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erreur lors de la sauvegarde");
      }

      toast.success("Paramètres enregistrés");
      setHasChanges(false);
      onSave?.(enabled, settings);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof InstantBookSettingsData>(
    key: K,
    value: InstantBookSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Toggle principal */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <BoltIcon className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Réservation instantanée</h3>
            <p className="text-sm text-gray-500">
              Les voyageurs peuvent réserver sans attendre votre approbation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            enabled ? "bg-amber-500" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Paramètres (affichés seulement si activé) */}
      {enabled && (
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Critères d&apos;acceptation</h4>
            <p className="text-sm text-gray-500">
              Définissez les conditions que les voyageurs doivent remplir
            </p>
          </div>

          {/* Critères */}
          <div className="space-y-4">
            {/* Identité vérifiée */}
            <CriteriaToggle
              icon={<IdentificationIcon className="h-5 w-5" />}
              title="Identité vérifiée"
              description="Le voyageur doit avoir vérifié son identité"
              checked={settings.requireVerifiedId}
              onChange={(v) => updateSetting("requireVerifiedId", v)}
            />

            {/* Avis positifs */}
            <CriteriaToggle
              icon={<StarIcon className="h-5 w-5" />}
              title="Avis positifs"
              description="Le voyageur doit avoir des avis positifs d'autres hôtes"
              checked={settings.requirePositiveReviews}
              onChange={(v) => updateSetting("requirePositiveReviews", v)}
            />

            {/* Note minimum */}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <StarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Note minimum</p>
                  <p className="text-sm text-gray-500">
                    Note moyenne minimum requise du voyageur
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={settings.minGuestRating ?? ""}
                  onChange={(e) =>
                    updateSetting(
                      "minGuestRating",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="Ex: 4.0"
                  className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-500">/5</span>
              </div>
            </div>

            {/* Photo de profil */}
            <CriteriaToggle
              icon={<CameraIcon className="h-5 w-5" />}
              title="Photo de profil"
              description="Le voyageur doit avoir une photo de profil"
              checked={settings.requireProfilePhoto}
              onChange={(v) => updateSetting("requireProfilePhoto", v)}
            />

            {/* Téléphone vérifié */}
            <CriteriaToggle
              icon={<PhoneIcon className="h-5 w-5" />}
              title="Téléphone vérifié"
              description="Le voyageur doit avoir vérifié son numéro de téléphone"
              checked={settings.requirePhoneVerified}
              onChange={(v) => updateSetting("requirePhoneVerified", v)}
            />
          </div>

          {/* Restrictions */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Restrictions</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Préavis minimum */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="h-5 w-5 text-gray-600" />
                  <p className="font-medium text-gray-900">Préavis minimum</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={settings.advanceNoticeHours}
                    onChange={(e) =>
                      updateSetting("advanceNoticeHours", parseInt(e.target.value) || 0)
                    }
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-500">heures avant l&apos;arrivée</span>
                </div>
              </div>

              {/* Durée min/max */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                  <p className="font-medium text-gray-900">Durée du séjour</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings.minNights ?? ""}
                    onChange={(e) =>
                      updateSetting("minNights", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Min"
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min={1}
                    value={settings.maxNights ?? ""}
                    onChange={(e) =>
                      updateSetting("maxNights", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Max"
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-500">nuits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message automatique */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Message automatique</h4>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Ce message sera envoyé automatiquement au voyageur après une réservation instantanée
            </p>
            <textarea
              value={settings.autoMessage ?? ""}
              onChange={(e) => updateSetting("autoMessage", e.target.value || null)}
              rows={4}
              placeholder="Ex: Bonjour ! Merci pour votre réservation. Je vous enverrai les détails d'accès quelques jours avant votre arrivée..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
            />
          </div>
        </div>
      )}

      {/* Prévisualisation */}
      {enabled && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Prévisualisation des critères</h4>
          <div className="space-y-2">
            <CriteriaPreviewItem
              label="Identité vérifiée"
              required={settings.requireVerifiedId}
            />
            <CriteriaPreviewItem
              label="Avis positifs"
              required={settings.requirePositiveReviews}
            />
            <CriteriaPreviewItem
              label={`Note minimum: ${settings.minGuestRating ?? "Non requis"}/5`}
              required={settings.minGuestRating !== null}
            />
            <CriteriaPreviewItem
              label="Photo de profil"
              required={settings.requireProfilePhoto}
            />
            <CriteriaPreviewItem
              label="Téléphone vérifié"
              required={settings.requirePhoneVerified}
            />
            <CriteriaPreviewItem
              label={`Préavis: ${settings.advanceNoticeHours}h`}
              required={settings.advanceNoticeHours > 0}
            />
            {(settings.minNights || settings.maxNights) && (
              <CriteriaPreviewItem
                label={`Durée: ${settings.minNights ?? 1} - ${settings.maxNights ?? "∞"} nuits`}
                required={true}
              />
            )}
          </div>
        </div>
      )}

      {/* Bouton de sauvegarde */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-black disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Toggle pour un critère
 */
function CriteriaToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-amber-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Item de prévisualisation d'un critère
 */
function CriteriaPreviewItem({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {required ? (
        <CheckCircleIcon className="h-4 w-4 text-amber-500" />
      ) : (
        <XCircleIcon className="h-4 w-4 text-gray-300" />
      )}
      <span className={required ? "text-gray-900" : "text-gray-400"}>{label}</span>
    </div>
  );
}
