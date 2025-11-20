// apps/web/src/components/EditListingImages.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";

type Img = { id: string; url: string };

async function jsonOrThrow(res: Response) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`Réponse non-JSON (${res.status}). ${txt.slice(0, 140)}`);
  }
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  mime: string
): Promise<Blob> {
  const img = document.createElement("img");
  img.src = imageSrc;
  await new Promise((ok, err) => {
    img.onload = () => ok(null);
    img.onerror = err;
  });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), mime, 0.92)
  );
}

const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

export default function EditListingImages({
  listingId,
  initialImages,
}: {
  listingId: string;
  initialImages: Img[];
}) {
  const [images, setImages] = useState<Img[]>(initialImages || []);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Crop modal state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<{ x: number; y: number; width: number; height: number } | null>(
      null
    );

  const totalSizeMb = useMemo(
    () => (files.reduce((a, f) => a + f.size, 0) / (1024 * 1024)).toFixed(1),
    [files]
  );

  function addFiles(incoming: File[]) {
    const imagesOnly = incoming.filter((f) => f.type.startsWith("image/"));
    const tooBig = imagesOnly.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig.length) {
      toast.error(`Certaines images dépassent ${MAX_SIZE_MB} Mo`);
    }
    const ok = imagesOnly.filter(
      (f) => f.size <= MAX_SIZE_MB * 1024 * 1024
    );

    const merged = [...files, ...ok].slice(0, MAX_FILES);
    if (merged.length < files.length + ok.length) {
      toast.message(`Limite de ${MAX_FILES} images atteinte`);
    }
    setFiles(merged);
  }

  function removeFileAt(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function deleteImage(imageId: string) {
    if (!confirm("Supprimer cette image ?")) return;
    const res = await fetch(
      `/api/listings/${listingId}/images?imageId=${encodeURIComponent(
        imageId
      )}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    setImages((prev) => prev.filter((im) => im.id !== imageId));
    toast.success("Image supprimée");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  const openCropper = async (index: number) => {
    const f = files[index];
    if (!f) return;
    setCropIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropSrc(URL.createObjectURL(f));
    setCropOpen(true);
  };

  const saveCrop = useCallback(async () => {
    if (!cropOpen || cropIndex === null || !cropSrc || !croppedAreaPixels) {
      return;
    }
    try {
      const blob = await getCroppedBlob(
        cropSrc,
        croppedAreaPixels,
        files[cropIndex].type || "image/jpeg"
      );
      const croppedFile = new File([blob], files[cropIndex].name, {
        type: files[cropIndex].type,
      });
      setFiles((prev) =>
        prev.map((f, i) => (i === cropIndex ? croppedFile : f))
      );
      toast.success("Image rognée ✔");
    } catch {
      toast.error("Rognage impossible");
    } finally {
      URL.revokeObjectURL(cropSrc!);
      setCropOpen(false);
      setCropSrc(null);
      setCropIndex(null);
    }
  }, [cropOpen, cropIndex, cropSrc, croppedAreaPixels, files]);

  async function uploadAll() {
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        // 1) presign
        const p = await fetch("/api/upload/presign-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });
        if (!p.ok) {
          const body = await p.text();
          throw new Error(
            `presign-listing a échoué (${p.status}). ${body.slice(0, 120)}`
          );
        }
        const presign = await jsonOrThrow(p);
        if (!presign?.uploadUrl || !presign?.publicUrl) {
          throw new Error("Réponse presign invalide (uploadUrl/publicUrl).");
        }

        // 2) upload vers R2
        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });
        if (!put.ok) {
          const body = await put.text().catch(() => "");
          throw new Error(`Upload R2 échoué (${put.status}). ${body}`);
        }

        // 3) save en DB
        const save = await fetch(`/api/listings/${listingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: presign.publicUrl }),
        });
        if (!save.ok) {
          const body = await save.text().catch(() => "");
          throw new Error(`Save image échoué (${save.status}). ${body}`);
        }

        const j = await save.json().catch(() => null);
        const newImg = j?.image as Img | undefined;
        if (newImg) {
          setImages((prev) => [newImg, ...prev]);
        }
      }

      toast.success("Images ajoutées ✔");
      setFiles([]);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Upload images impossible"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Images</h2>

      {/* Images existantes */}
      {images.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune image pour le moment.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((im) => (
            <div
              key={im.id}
              className="relative h-28 w-36 border rounded overflow-hidden bg-white"
            >
              <img
                src={im.url}
                alt=""
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => deleteImage(im.id)}
                className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs shadow"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploader + crop pour nouvelles images */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            Ajouter des images (max {MAX_FILES}) · {files.length} sélectionnée(s)
            {files.length ? ` · ${totalSizeMb} Mo` : ""}
          </label>
          <button
            type="button"
            onClick={() => setFiles([])}
            className="text-xs underline disabled:opacity-50"
            disabled={!files.length}
            title="Retirer toutes les images sélectionnées"
          >
            Retirer tout
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded border border-dashed p-4 text-center text-sm transition ${
            dragOver ? "bg-gray-100" : "bg-gray-50"
          }`}
        >
          Glissez-déposez vos images ici
          <span className="mx-2 text-gray-400">ou</span>
          <label className="cursor-pointer underline">
            choisissez des fichiers
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
          </label>
          <div className="mt-2 text-xs text-gray-500">
            Formats image uniquement. Taille max {MAX_SIZE_MB} Mo / image.
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="relative h-24 w-32 border rounded overflow-hidden bg-white p-1"
              >
                <img
                  src={URL.createObjectURL(f)}
                  className="h-full w-full object-contain"
                  alt=""
                  onLoad={(e) =>
                    URL.revokeObjectURL(
                      (e.target as HTMLImageElement).src
                    )
                  }
                />
                <div className="absolute left-1 top-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => openCropper(i)}
                    className="rounded bg-white/90 px-1 text-xs shadow"
                    title="Rogner"
                  >
                    Rogner
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFileAt(i)}
                  className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs shadow"
                  title="Retirer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={uploadAll}
          disabled={!files.length || uploading}
          className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {uploading ? "Upload…" : "Uploader ces images"}
        </button>
      </div>

      {/* Modale crop */}
      {cropOpen && cropSrc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded bg-white p-4 shadow-lg">
            <h3 className="mb-2 font-medium">Rogner l’image</h3>
            <div className="relative h-[55vh] w-full bg-gray-100">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) =>
                  setCroppedAreaPixels(areaPixels)
                }
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCropOpen(false);
                    setCropSrc(null);
                    setCropIndex(null);
                  }}
                  className="rounded border px-3 py-1.5 text-sm"
                >
                  Annuler
                </button>
                <button
                  className="rounded bg-black px-3 py-1.5 text-sm text-white"
                  onClick={saveCrop}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
