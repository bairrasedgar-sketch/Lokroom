// apps/web/src/components/reviews/ReviewPhotoUpload.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { CameraIcon, XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface ReviewPhoto {
  id: string;
  url: string;
  caption?: string | null;
}

interface ReviewPhotoUploadProps {
  reviewId: string;
  photos: ReviewPhoto[];
  onPhotosChange: (photos: ReviewPhoto[]) => void;
  maxPhotos?: number;
}

export default function ReviewPhotoUpload({
  reviewId,
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: ReviewPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Vérifier le nombre max
    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos autorisées`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        // Validation côté client
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} n'est pas une image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} est trop volumineux (max 5MB)`);
        }

        // 1. Demander une URL signée
        const presignRes = await fetch(`/api/reviews/${reviewId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || "Erreur lors de la préparation de l'upload");
        }

        const { uploadUrl, photo } = await presignRes.json();

        // 2. Upload vers S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Erreur lors de l'upload de l'image");
        }

        // 3. Ajouter la photo à la liste
        onPhotosChange([...photos, photo]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/photos?photoId=${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      onPhotosChange(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <ArrowUpTrayIcon className="w-5 h-5 animate-pulse" />
                <span>Upload en cours...</span>
              </>
            ) : (
              <>
                <CameraIcon className="w-5 h-5" />
                <span>Ajouter des photos ({photos.length}/{maxPhotos})</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Max {maxPhotos} photos, 5MB chacune (JPEG, PNG, WebP)
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Photos grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <Image
                src={photo.url}
                alt={photo.caption || "Photo de l'avis"}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
