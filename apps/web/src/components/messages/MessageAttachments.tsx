"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { PhotoIcon, DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
};

type MessageAttachmentsProps = {
  conversationId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
};

export default function MessageAttachments({
  conversationId,
  attachments,
  onAttachmentsChange,
  disabled = false,
}: MessageAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setError(null);

      try {
        for (const file of Array.from(files)) {
          // Validation côté client
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            setError(`${file.name} est trop volumineux (max 10MB)`);
            continue;
          }

          // Upload
          const formData = new FormData();
          formData.append("file", file);
          formData.append("conversationId", conversationId);

          const res = await fetch("/api/messages/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Erreur lors de l'upload");
            continue;
          }

          const data = await res.json();

          // Créer un preview pour les images
          let preview: string | undefined;
          if (file.type.startsWith("image/")) {
            preview = URL.createObjectURL(file);
          }

          onAttachmentsChange([
            ...attachments,
            { ...data.attachment, preview },
          ]);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError("Erreur lors de l'upload");
      } finally {
        setUploading(false);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [conversationId, attachments, onAttachmentsChange]
  );

  const removeAttachment = (id: string) => {
    const attachment = attachments.find((a) => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {/* Bouton d'ajout */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Ajouter une pièce jointe"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span>Upload...</span>
            </>
          ) : (
            <>
              <PhotoIcon className="h-4 w-4" />
              <span>Photo / Fichier</span>
            </>
          )}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Prévisualisation des pièces jointes */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              {attachment.type.startsWith("image/") ? (
                // Image preview
                <div className="relative h-20 w-20">
                  <Image
                    src={attachment.preview || attachment.url}
                    alt={attachment.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                // Document preview
                <div className="flex items-center gap-2 px-3 py-2 max-w-[200px]">
                  <DocumentIcon className="h-8 w-8 flex-shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
              )}

              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
