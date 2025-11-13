"use client";

import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ---------- Config upload ----------
const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

// ---------- Validation ----------
const schema = z.object({
  title: z.string().min(3, "Min 3 caractères").max(120),
  description: z.string().min(10, "Min 10 caractères").max(2000),
  // float (devise choisie)
  price: z.coerce.number().nonnegative("Prix ≥ 0").refine(Number.isFinite, "Prix requis"),
  // devise stockée telle quelle (EUR ou CAD)
  currency: z.enum(["EUR", "CAD"]),
  country: z.string().min(2, "Pays requis"),
  city: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// ---------- Helpers ----------
async function jsonOrThrow(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const snippet = text.slice(0, 120);
    throw new Error(`Réponse non-JSON (${res.status}). Corps: ${snippet || "<vide>"}`);
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

export default function NewListingPage() {
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const resolver = zodResolver(schema) as Resolver<FormValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      price: 0,
      currency: "EUR", // valeur par défaut — sera ajustée juste après via le cookie
    },
  });

  // --- Auto-sélection de la devise depuis le cookie placé par le middleware ---
  useEffect(() => {
    // On ne fait ça qu’au montage pour ne pas écraser un choix manuel
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cookieCurrency = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setValue("currency", cookieCurrency, { shouldValidate: true, shouldDirty: false });
  }, [setValue]);

  function addFiles(incoming: File[]) {
    const imagesOnly = incoming.filter((f) => f.type.startsWith("image/"));
    const tooBig = imagesOnly.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig.length) toast.error(`Certaines images dépassent ${MAX_SIZE_MB} Mo`);
    const ok = imagesOnly.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);

    const merged = [...files, ...ok].slice(0, MAX_FILES);
    if (merged.length < files.length + ok.length) {
      toast.message(`Limite de ${MAX_FILES} images atteinte`);
    }
    setFiles(merged);
  }
  function removeAt(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }
  function clearAll() {
    if (!files.length) return;
    if (!confirm("Retirer toutes les images sélectionnées ?")) return;
    setFiles([]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  const totalSizeMb = useMemo(
    () => (files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1),
    [files]
  );

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
    if (!cropOpen || cropIndex === null || !cropSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(
        cropSrc,
        croppedAreaPixels,
        files[cropIndex].type || "image/jpeg"
      );
      const croppedFile = new File([blob], files[cropIndex].name, {
        type: files[cropIndex].type,
      });
      setFiles((prev) => prev.map((f, i) => (i === cropIndex ? croppedFile : f)));
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

  const onValid: SubmitHandler<FormValues> = async (values) => {
    const payload = {
      title: values.title,
      description: values.description,
      price: values.price,        // float direct
      currency: values.currency,  // EUR/CAD explicite
      country: values.country,
      city: values.city?.trim() || undefined,
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Création annonce: erreur serveur");
      }
      const data = await res.json();
      const listingId: string | undefined = data?.listing?.id;
      if (!listingId) throw new Error("ID annonce manquant après création.");

      if (files.length) setUploading(true);

      for (const file of files) {
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
          throw new Error(`presign-listing a échoué (${p.status}). ${body.slice(0, 120)}`);
        }
        const presign = await jsonOrThrow(p);
        if (!presign?.uploadUrl || !presign?.publicUrl) {
          throw new Error("Réponse presign invalide (uploadUrl/publicUrl).");
        }

        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) {
          const body = await put.text().catch(() => "");
          throw new Error(`Upload R2 échoué (${put.status}). ${body}`);
        }

        const save = await fetch(`/api/listings/${listingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: presign.publicUrl }),
        });
        if (!save.ok) {
          const body = await save.text().catch(() => "");
          throw new Error(`Save image échoué (${save.status}). ${body}`);
        }
      }

      toast.success("Annonce créée ✅");
      setFiles([]);
      router.push(`/listings/${listingId}`);
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible de créer l’annonce / uploader les images"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Nouvelle annonce</h1>

      {/* uploader */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            Images (max {MAX_FILES}) · {files.length} sélectionnée(s)
            {files.length ? ` · ${totalSizeMb} Mo` : ""}
          </label>
          <button
            type="button"
            onClick={clearAll}
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
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
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
                  onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs shadow"
                  title="Retirer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onValid)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm mb-1">
            Titre
          </label>
          <input id="title" className="w-full rounded-md border px-3 py-2" {...register("title")} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1">
            Description
          </label>
          <textarea
            id="description"
            className="w-full rounded-md border px-3 py-2"
            rows={5}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="price" className="block text-sm mb-1">
              Prix
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              className="w-full rounded-md border px-3 py-2"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Montant dans la devise choisie ci-contre.
            </p>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm mb-1">
              Devise
            </label>
            <select
              id="currency"
              className="w-full rounded-md border px-3 py-2"
              {...register("currency")}
            >
              <option value="EUR">EUR €</option>
              <option value="CAD">CAD $</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className="block text-sm mb-1">
              Pays
            </label>
            <input id="country" className="w-full rounded-md border px-3 py-2" {...register("country")} />
            {errors.country && <p className="text-sm text-red-600">{errors.country.message}</p>}
          </div>
          <div>
            <label htmlFor="city" className="block text-sm mb-1">
              Ville (optionnel)
            </label>
            <input id="city" className="w-full rounded-md border px-3 py-2" {...register("city")} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="rounded bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {isSubmitting || uploading ? "Création & upload…" : "Créer"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border px-4 py-2 text-sm"
          >
            Annuler
          </button>
        </div>
      </form>

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
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
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
                <button className="rounded bg-black px-3 py-1.5 text-sm text-white" onClick={saveCrop}>
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
