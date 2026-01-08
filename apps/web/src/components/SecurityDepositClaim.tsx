// apps/web/src/components/SecurityDepositClaim.tsx
"use client";

import { useState, useCallback } from "react";
import {
  ShieldExclamationIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

type SecurityDepositClaimProps = {
  bookingId: string;
  depositId: string;
  maxAmountCents: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/**
 * Modal/Formulaire pour reclamer le depot de garantie en cas de dommages
 */
export default function SecurityDepositClaim({
  bookingId,
  depositId,
  maxAmountCents,
  currency,
  onSuccess,
  onCancel,
}: SecurityDepositClaimProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const maxAmount = maxAmountCents / 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(value);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permettre uniquement les nombres et un point decimal
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      const numValue = parseFloat(value) || 0;
      if (numValue <= maxAmount) {
        setAmount(value);
      }
    }
  };

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setError(null);

      try {
        const uploadedUrls: string[] = [];

        for (const file of Array.from(files)) {
          // Verifier le type de fichier
          if (!file.type.startsWith("image/")) {
            throw new Error("Seules les images sont acceptees");
          }

          // Verifier la taille (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error("Les images doivent faire moins de 5MB");
          }

          // Upload vers l'API
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "damage_photo");

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error("Erreur lors de l'upload");
          }

          const data = await res.json();
          uploadedUrls.push(data.url);
        }

        setPhotos((prev) => [...prev, ...uploadedUrls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur d'upload");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    if (amountValue > maxAmount) {
      setError(`Le montant ne peut pas depasser ${formatCurrency(maxAmount)}`);
      return;
    }

    if (!reason.trim()) {
      setError("Veuillez decrire les dommages");
      return;
    }

    if (reason.trim().length < 20) {
      setError("La description doit faire au moins 20 caracteres");
      return;
    }

    // Afficher la confirmation
    setShowConfirm(true);
  };

  const confirmCapture = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/bookings/${bookingId}/security-deposit/capture`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parseFloat(amount),
            reason: reason.trim(),
            damagePhotos: photos,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la capture");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Modal de confirmation
  if (showConfirm) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">
              Confirmer la reclamation
            </h3>
            <p className="mt-2 text-sm text-red-700">
              Vous etes sur le point de reclamer{" "}
              <strong>{formatCurrency(parseFloat(amount))}</strong> sur la
              caution du voyageur.
            </p>
            <p className="mt-2 text-sm text-red-700">
              Cette action est irreversible. Le voyageur sera notifie et pourra
              contester cette reclamation.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmCapture}
                disabled={submitting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Traitement..." : "Confirmer la reclamation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <ShieldExclamationIcon className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Reclamer la caution</h3>
          <p className="text-sm text-gray-500">
            Maximum: {formatCurrency(maxAmount)}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="mt-4 space-y-4">
        {/* Montant */}
        <div>
          <label
            htmlFor="claim-amount"
            className="block text-sm font-medium text-gray-700"
          >
            Montant a reclamer
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              id="claim-amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 text-lg font-medium focus:border-amber-500 focus:ring-amber-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {currency}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Entrez le montant correspondant aux dommages constates
          </p>
        </div>

        {/* Raison */}
        <div>
          <label
            htmlFor="claim-reason"
            className="block text-sm font-medium text-gray-700"
          >
            Description des dommages
          </label>
          <textarea
            id="claim-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Decrivez les dommages constates en detail..."
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-amber-500 focus:ring-amber-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {reason.length}/500 caracteres (minimum 20)
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Photos des dommages (optionnel)
          </label>
          <div className="mt-2">
            {/* Photos uploadees */}
            {photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {photos.map((url, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={url}
                      alt={`Dommage ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton upload */}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-amber-400 hover:text-amber-600">
              <PhotoIcon className="h-5 w-5" />
              {uploading ? "Upload en cours..." : "Ajouter des photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || !reason.trim() || submitting}
            className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reclamer {amount ? formatCurrency(parseFloat(amount)) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
