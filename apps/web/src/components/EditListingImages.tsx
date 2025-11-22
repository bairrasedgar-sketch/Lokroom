"use client";

import {
  useState,
  useMemo,
  useCallback,
  type DragEvent,
} from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { useAutoAnimate } from "@formkit/auto-animate/react";

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

  // auto-animate pour les panneaux
  const [existingParent] = useAutoAnimate<HTMLDivElement>({
    duration: 450,
    easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  });
  const [filesParent] = useAutoAnimate<HTMLDivElement>({
    duration: 450,
    easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  });

  // Drag & drop pour images existantes (BDD)
  const [dragExistingIndex, setDragExistingIndex] =
    useState<number | null>(null);
  // Drag & drop pour nouvelles images (files)
  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);

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

  // 👉 Mettre une image en couverture côté BDD (images existantes)
  async function setCover(imageId: string) {
    try {
      const newOrder = [...images];
      const index = newOrder.findIndex((im) => im.id === imageId);
      if (index === -1) return;

      const [target] = newOrder.splice(index, 1);
      newOrder.unshift(target);
      setImages(newOrder);

      const res = await fetch(`/api/listings/${listingId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setCover", imageId }),
      });

      if (!res.ok) {
        toast.error("Impossible de changer la couverture");
      } else {
        toast.success("Photo de couverture mise à jour ✔");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour de la couverture");
    }
  }

  // 👉 Mettre une image en couverture *avant upload* (files)
  function makeCover(index: number) {
    setFiles((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const copy = [...prev];
      const [file] = copy.splice(index, 1);
      copy.unshift(file);
      return copy;
    });
  }

  // --- Drag & drop EXISTING images (BDD) : réordonnancement au DROP ---
  const handleExistingDragStart = (
    e: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDragExistingIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      const target = e.currentTarget;
      e.dataTransfer.setDragImage(
        target,
        target.clientWidth / 2,
        target.clientHeight / 2
      );
    }
  };

  const handleExistingDrop = async (index: number) => {
    if (dragExistingIndex === null || dragExistingIndex === index) {
      setDragExistingIndex(null);
      return;
    }

    const current = [...images];
    if (
      dragExistingIndex < 0 ||
      dragExistingIndex >= current.length ||
      index < 0 ||
      index >= current.length
    ) {
      setDragExistingIndex(null);
      return;
    }

    const [moved] = current.splice(dragExistingIndex, 1);
    if (!moved) {
      setDragExistingIndex(null);
      return;
    }

    current.splice(index, 0, moved);
    setImages(current);
    setDragExistingIndex(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          order: current.map((im) => im.id),
        }),
      });

      if (!res.ok) {
        toast.error("Impossible de réordonner les images");
      } else {
        toast.success("Ordre des images mis à jour ✔");
      }
    } catch {
      toast.error("Erreur lors du réordonnancement des images");
    }
  };

  const handleExistingDragEnd = () => {
    setDragExistingIndex(null);
  };

  // --- Drag & drop FILES (avant upload) : réordonnancement au DROP ---
  const handleFileDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragFileIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      const target = e.currentTarget;
      e.dataTransfer.setDragImage(
        target,
        target.clientWidth / 2,
        target.clientHeight / 2
      );
    }
  };

  const handleFileDrop = (index: number) => {
    if (dragFileIndex === null || dragFileIndex === index) {
      setDragFileIndex(null);
      return;
    }

    setFiles((prev) => {
      if (
        dragFileIndex === null ||
        dragFileIndex < 0 ||
        dragFileIndex >= prev.length ||
        index < 0 ||
        index >= prev.length
      ) {
        return prev;
      }
      const copy = [...prev];
      const [moved] = copy.splice(dragFileIndex, 1);
      if (!moved) return prev;
      copy.splice(index, 0, moved);
      return copy;
    });

    setDragFileIndex(null);
  };

  const handleFileDragEnd = () => {
    setDragFileIndex(null);
  };

  async function uploadAll() {
    if (!files.length) return;
    setUploading(true);
    try {
      // ⚠️ On envoie les fichiers dans l'ordre du tableau `files`
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];

        // 1) presign
        const p = await fetch("/api/upload/presign-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            fileSize: file.size,
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
          body: JSON.stringify({
            url: presign.publicUrl,
          }),
        });
        if (!save.ok) {
          const body = await save.text().catch(() => "");
          throw new Error(`Save image échoué (${save.status}). ${body}`);
        }

        const j = await save.json().catch(() => null);
        const newImg = j?.image as Img | undefined;
        if (newImg) {
          setImages((prev) => [...prev, newImg]);
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
    <section className="space-y-4">
      {/* même override que sur /listings/new : uniquement déplacement, pas de fade */}
      <style jsx global>{`
        [data-auto-animate] > * {
          transition-property: transform !important;
          transition-duration: 450ms !important;
          transition-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1) !important;
        }
      `}</style>

      <h2 className="text-lg font-medium">Images</h2>

      {/* Panneau images existantes (BDD) */}
      <div className="rounded-2xl bg-gray-100 px-4 py-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200">
        <p className="mb-3 text-xs text-gray-700 sm:text-sm">
          👉 <span className="font-semibold">La première image</span>{" "}
          (tout à gauche) est utilisée comme{" "}
          <span className="font-semibold">photo de couverture</span>. Tu peux
          cliquer sur{" "}
          <span className="font-semibold">“Mettre en couverture”</span> ou{" "}
          <span className="font-semibold">glisser les vignettes</span> pour
          changer l’ordre.
        </p>

        {images.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune image pour le moment.</p>
        ) : (
          <div ref={existingParent} className="flex flex-wrap gap-3">
            {images.map((im, index) => {
              const isCover = index === 0;
              const isDragging = index === dragExistingIndex;
              return (
                <div
                  key={im.id}
                  className={`group relative h-28 w-36 cursor-grab overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                    isDragging
                      ? "ring-2 ring-black/60 scale-[1.02]"
                      : "border-gray-200"
                  }`}
                  draggable
                  onDragStart={(e) => handleExistingDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleExistingDrop(index)}
                  onDragEnd={handleExistingDragEnd}
                >
                  <img
                    src={im.url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />

                  {/* bouton supprimer */}
                  <button
                    type="button"
                    onClick={() => deleteImage(im.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/80 px-1 text-xs text-white shadow transition hover:bg-black"
                    title="Supprimer"
                  >
                    ×
                  </button>

                  {/* badge / bouton couverture */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center pb-1">
                    {isCover ? (
                      <span className="pointer-events-none inline-flex rounded-full bg-black/85 px-2 py-0.5 text-[11px] font-medium text-white shadow">
                        Couverture
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCover(im.id)}
                        className="inline-flex rounded-full bg-black/75 px-2 py-0.5 text-[11px] text-white shadow transition hover:bg-black"
                        title="Mettre en couverture"
                      >
                        Mettre en couverture
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Uploader + crop pour nouvelles images (même style que /listings/new) */}
      <div className="space-y-3">
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
          className={`rounded-md border border-dashed p-4 text-center text-sm transition ${
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
          <div ref={filesParent} className="flex flex-wrap gap-3">
            {files.map((f, i) => {
              const isCover = i === 0;
              const isDragging = i === dragFileIndex;
              return (
                <div
                  key={`${f.name}-${i}`}
                  className={`group relative h-24 w-32 cursor-grab overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                    isDragging
                      ? "ring-2 ring-black/60 scale-[1.02]"
                      : "border-gray-200"
                  }`}
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleFileDrop(i)}
                  onDragEnd={handleFileDragEnd}
                >
                  <img
                    src={URL.createObjectURL(f)}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    alt=""
                    onLoad={(e) =>
                      URL.revokeObjectURL(
                        (e.target as HTMLImageElement).src
                      )
                    }
                  />

                  {/* bouton Rogner */}
                  <div className="absolute left-1 top-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => openCropper(i)}
                      className="rounded bg-black/75 px-1 text-[11px] text-white shadow"
                      title="Rogner"
                    >
                      Rogner
                    </button>
                  </div>

                  {/* Couverture / Mettre en couverture */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center pb-1">
                    {isCover ? (
                      <span className="pointer-events-none inline-flex rounded-full bg-black/85 px-2 py-0.5 text-[11px] font-medium text-white shadow">
                        Couverture
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeCover(i)}
                        className="inline-flex rounded-full bg-black/75 px-2 py-0.5 text-[11px] text-white shadow transition hover:bg-black"
                        title="Mettre en couverture"
                      >
                        Mettre en couverture
                      </button>
                    )}
                  </div>

                  {/* bouton retirer */}
                  <button
                    type="button"
                    onClick={() => removeFileAt(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/80 px-1 text-xs text-white shadow transition hover:bg-black"
                    title="Retirer"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={uploadAll}
          disabled={!files.length || uploading}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
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
