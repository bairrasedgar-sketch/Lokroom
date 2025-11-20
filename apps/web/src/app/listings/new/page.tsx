// apps/web/src/app/listings/new/page.tsx
"use client";

import {
  useForm,
  SubmitHandler,
  Resolver,
  Controller,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";

// ---------- Config upload ----------
const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

// ---------- Validation ----------
const schema = z.object({
  title: z.string().min(3, "Min 3 caractères").max(120),
  description: z.string().min(10, "Min 10 caractères").max(2000),
  price: z.coerce
    .number()
    .min(2, "Prix minimum 2 (EUR ou CAD)")
    .refine(Number.isFinite, "Prix requis"),
  currency: z.enum(["EUR", "CAD"]),

  // UNIQUEMENT France ou Canada
  country: z.enum(["France", "Canada"]),

  // Ville obligatoire (suggestion FR/CA via Google Places)
  city: z.string().min(1, "Ville requise"),

  // Adresse exacte obligatoire
  addressFull: z.string().min(5, "Adresse exacte requise"),
});
type FormValues = z.infer<typeof schema>;

// ---------- Helpers ----------
async function jsonOrThrow(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const snippet = text.slice(0, 120);
    throw new Error(
      `Réponse non-JSON (${res.status}). Corps: ${snippet || "<vide>"}`
    );
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

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
  | string
  | undefined;

// ---------- Autocomplete des villes FR/CA ----------
type CityAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  mapsReady: boolean;
};

function CityAutocomplete({
  value,
  onChange,
  mapsReady,
}: CityAutocompleteProps) {
  const [input, setInput] = useState(value || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // sync externe → interne
  useEffect(() => {
    setInput(value || "");
  }, [value]);

  useEffect(() => {
    if (!mapsReady) return;
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const g = (window as any).google;
    const svc = g?.maps?.places?.AutocompleteService
      ? new g.maps.places.AutocompleteService()
      : null;
    if (!svc) return;

    let active = true;
    setLoading(true);

    svc.getPlacePredictions(
      {
        input,
        types: ["(cities)"],
        // On limite aux villes France + Canada
        componentRestrictions: { country: ["fr", "ca"] },
      },
      (preds: any[], status: string) => {
        if (!active) return;
        setLoading(false);

        if (
          !preds ||
          status !== g.maps.places.PlacesServiceStatus.OK
        ) {
          setSuggestions([]);
          return;
        }

        setSuggestions(preds.slice(0, 6).map((p: any) => p.description));
      }
    );

    return () => {
      active = false;
    };
  }, [input, mapsReady]);

  return (
    <div className="relative">
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Ville (France ou Canada)"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onChange(e.target.value);
        }}
      />

      {loading && (
        <div className="pointer-events-none absolute right-3 top-2 text-xs text-gray-400">
          …
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-white text-sm shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s}
              className="cursor-pointer px-3 py-1 hover:bg-gray-100"
              onMouseDown={(e) => {
                e.preventDefault(); // évite la perte de focus avant le click
                onChange(s);
                setInput(s);
                setSuggestions([]);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
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
    useState<{ x: number; y: number; width: number; height: number } | null>(
      null
    );

  const [mapsReady, setMapsReady] = useState(false);
  const [geo, setGeo] = useState<{
    lat: number;
    lng: number;
    latPublic: number;
    lngPublic: number;
  } | null>(null);

  const resolver = zodResolver(schema) as Resolver<FormValues>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      price: 0,
      currency: "EUR",
      country: "France", // par défaut France
      city: "",
      addressFull: "",
    },
  });

  // --- Fix : si Google Maps est déjà chargé (navigation client), on active directement mapsReady
  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = (window as any).google;
    if (g?.maps?.places) {
      setMapsReady(true);
    }
  }, []);

  // --- Auto-sélection devise depuis cookie ---
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cookieCurrency = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setValue("currency", cookieCurrency, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [setValue]);

  // --- Google Places Autocomplete sur l'adresse exacte ---
  useEffect(() => {
    if (!mapsReady) return;
    if (typeof window === "undefined") return;

    const g = (window as any).google as any;
    if (!g?.maps?.places?.Autocomplete) return;

    const input = document.getElementById(
      "addressFull"
    ) as HTMLInputElement | null;
    if (!input) return;

    const autocomplete = new g.maps.places.Autocomplete(input, {
      types: ["geocode"],
      fields: ["formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        toast.error(
          "Impossible de récupérer la position pour cette adresse."
        );
        return;
      }

      const loc = place.geometry.location;
      const lat = loc.lat();
      const lng = loc.lng();

      const latPublic = Math.round(lat * 1000) / 1000;
      const lngPublic = Math.round(lng * 1000) / 1000;

      setGeo({ lat, lng, latPublic, lngPublic });

      if (place.formatted_address) {
        setValue("addressFull", place.formatted_address, {
          shouldValidate: true,
        });
      }
    });

    return () => {
      g.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [mapsReady, setValue]);

  function addFiles(incoming: File[]) {
    const imagesOnly = incoming.filter((f) => f.type.startsWith("image/"));
    const tooBig = imagesOnly.filter(
      (f) => f.size > MAX_SIZE_MB * 1024 * 1024
    );
    if (tooBig.length)
      toast.error(`Certaines images dépassent ${MAX_SIZE_MB} Mo`);
    const ok = imagesOnly.filter(
      (f) => f.size <= MAX_SIZE_MB * 1024 * 1024
    );

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
    () =>
      (
        files.reduce((acc, f) => acc + f.size, 0) /
        (1024 * 1024)
      ).toFixed(1),
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
    if (!cropOpen || cropIndex === null || !cropSrc || !croppedAreaPixels)
      return;
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

  const onValid: SubmitHandler<FormValues> = async (values) => {
    // Garde-fous front
    if (values.price < 2) {
      toast.error("Le prix minimum est de 2 (EUR ou CAD).");
      return;
    }
    if (files.length < 3) {
      toast.error("Ajoute au moins 3 photos (minimum 3).");
      return;
    }

    const payload: any = {
      title: values.title,
      description: values.description,
      price: values.price,
      currency: values.currency,
      country: values.country,
      city: values.city.trim(),
      addressFull: values.addressFull.trim(),
    };

    if (geo) {
      payload.lat = geo.lat;
      payload.lng = geo.lng;
      payload.latPublic = geo.latPublic;
      payload.lngPublic = geo.lngPublic;
    }

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
          throw new Error(
            `presign-listing a échoué (${p.status}). ${body.slice(0, 120)}`
          );
        }
        const presign = await jsonOrThrow(p);
        if (!presign?.uploadUrl || !presign?.publicUrl) {
          throw new Error(
            "Réponse presign invalide (uploadUrl/publicUrl)."
          );
        }

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
        e instanceof Error
          ? e.message
          : "Impossible de créer l’annonce / uploader les images"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Script Google Maps pour l'autocomplete (adresse + villes) */}
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
          onError={(e) => {
            console.error("Erreur chargement Google Maps (new listing)", e);
            toast.error("Google Maps n'a pas pu se charger (autocomplete).");
          }}
        />
      )}

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
                onChange={(e) =>
                  addFiles(Array.from(e.target.files || []))
                }
                className="hidden"
              />
            </label>
            <div className="mt-2 text-xs text-gray-500">
              Formats image uniquement. Taille max {MAX_SIZE_MB} Mo /
              image.
            </div>
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="relative h-24 w-32 overflow-hidden rounded border bg-white p-1"
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
            <label htmlFor="title" className="mb-1 block text-sm">
              Titre
            </label>
            <input
              id="title"
              className="w-full rounded-md border px-3 py-2"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm">
              Description
            </label>
            <textarea
              id="description"
              className="w-full rounded-md border px-3 py-2"
              rows={5}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="price" className="mb-1 block text-sm">
                Prix
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                className="w-full rounded-md border px-3 py-2"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Montant dans la devise choisie ci-contre (min 2).
              </p>
            </div>

            <div>
              <label htmlFor="currency" className="mb-1 block text-sm">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="country" className="mb-1 block text-sm">
                Pays
              </label>
              <select
                id="country"
                className="w-full rounded-md border px-3 py-2"
                {...register("country")}
              >
                <option value="France">France</option>
                <option value="Canada">Canada</option>
              </select>
              {errors.country && (
                <p className="text-sm text-red-600">
                  {errors.country.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="mb-1 block text-sm">
                Ville *
              </label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <CityAutocomplete
                    value={field.value || ""}
                    onChange={field.onChange}
                    mapsReady={mapsReady}
                  />
                )}
              />
              {errors.city && (
                <p className="text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>
          </div>

          {/* Adresse exacte obligatoire + autocomplete */}
          <div>
            <label htmlFor="addressFull" className="mb-1 block text-sm">
              Adresse exacte de l’espace *
            </label>
            <input
              id="addressFull"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Numéro + rue, code postal..."
              {...register("addressFull")}
            />
            {errors.addressFull && (
              <p className="text-sm text-red-600">
                {errors.addressFull.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Commence à taper et choisis une adresse proposée. Cette
              adresse sert à positionner le logement mais ne sera pas
              affichée telle quelle (seule une position approximative est
              montrée sur la carte).
            </p>
            {geo && (
              <p className="mt-1 text-xs text-gray-400">
                Coordonnées détectées : {geo.lat.toFixed(5)},{" "}
                {geo.lng.toFixed(5)} (publiques ≈ {geo.latPublic},{" "}
                {geo.lngPublic})
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {isSubmitting || uploading
                ? "Création & upload…"
                : "Créer"}
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
    </>
  );
}
