"use client";

import {
  useForm,
  SubmitHandler,
  Resolver,
  Controller,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  type DragEvent,
} from "react";
import Cropper from "react-easy-crop";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from "next/script";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  getCroppedImage,
  type PixelCrop,
} from "@/lib/cropImage";

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
  country: z.enum(["France", "Canada"]),
  city: z.string().min(1, "Ville requise"),
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

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
  | string
  | undefined;

// ---------- Type pour les images locales ----------
type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
        componentRestrictions: { country: ["fr", "ca"] },
      },
      (preds: any[], status: string) => {
        if (!active) return;
        setLoading(false);

        if (!preds || status !== g.maps.places.PlacesServiceStatus.OK) {
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
                e.preventDefault();
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

  const [images, setImages] = useState<LocalImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<PixelCrop | null>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [geo, setGeo] = useState<{
    lat: number;
    lng: number;
    latPublic: number;
    lngPublic: number;
  } | null>(null);

  // auto-animate pour le panneau d’images
  const [filesParent] = useAutoAnimate<HTMLDivElement>({
    duration: 450,
    easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  });

  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);

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
      country: "France",
      city: "",
      addressFull: "",
    },
  });

  // Google déjà chargé ?
  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = (window as any).google;
    if (g?.maps?.places) {
      setMapsReady(true);
    }
  }, []);

  // devise depuis cookie
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cookieCurrency = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setValue("currency", cookieCurrency, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [setValue]);

  // Autocomplete adresse exacte
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

  // --------- gestion fichiers ----------
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

    const mapped: LocalImage[] = ok.map((file) => ({
      id: createId(),
      file,
      previewUrl: URL.createObjectURL(file),
      width: undefined,
      height: undefined,
    }));

    setImages((prev) => {
      const merged = [...prev, ...mapped].slice(0, MAX_FILES);
      if (merged.length < prev.length + mapped.length) {
        toast.message(`Limite de ${MAX_FILES} images atteinte`);
      }
      return merged;
    });
  }

  function removeAt(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return copy;
    });
  }

  function clearAll() {
    if (!images.length) return;
    if (!confirm("Retirer toutes les images sélectionnées ?")) return;
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  const totalSizeMb = useMemo(
    () =>
      (
        images.reduce((acc, img) => acc + img.file.size, 0) /
        (1024 * 1024)
      ).toFixed(1),
    [images]
  );

  const openCropper = async (index: number) => {
    const img = images[index];
    if (!img) return;
    setCropIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropSrc(img.previewUrl);
    setCropOpen(true);
  };

  const saveCrop = useCallback(async () => {
    if (!cropOpen || cropIndex === null || !cropSrc || !croppedAreaPixels)
      return;
    try {
      const current = images[cropIndex];
      if (!current) return;

      const { blob, width, height } = await getCroppedImage(
        cropSrc,
        croppedAreaPixels as PixelCrop,
        current.file.type || "image/jpeg",
        {
          maxWidth: 2560,
          maxHeight: 2560,
          quality: 0.92,
        }
      );

      const croppedFile = new File([blob], current.file.name, {
        type: current.file.type,
      });
      const newPreviewUrl = URL.createObjectURL(croppedFile);

      setImages((prev) =>
        prev.map((img, i) => {
          if (i !== cropIndex) return img;
          URL.revokeObjectURL(img.previewUrl);
          return {
            ...img,
            file: croppedFile,
            previewUrl: newPreviewUrl,
            width,
            height,
          };
        })
      );
      toast.success("Image rognée ✔");
    } catch {
      toast.error("Rognage impossible");
    } finally {
      setCropOpen(false);
      setCropSrc(null);
      setCropIndex(null);
      setCroppedAreaPixels(null);
    }
  }, [cropOpen, cropIndex, cropSrc, croppedAreaPixels, images]);

  // passe une image en couverture = la mettre en index 0
  function makeCover(index: number) {
    setImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const copy = [...prev];
      const [img] = copy.splice(index, 1);
      copy.unshift(img);
      return copy;
    });
  }

  // ---- drag & drop des vignettes ----
  const handleFileDragStart = (
    e: DragEvent<HTMLDivElement>,
    index: number
  ) => {
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

    setImages((prev) => {
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

  // --------- submit ----------
  const onValid: SubmitHandler<FormValues> = async (values) => {
    if (values.price < 2) {
      toast.error("Le prix minimum est de 2 (EUR ou CAD).");
      return;
    }
    if (images.length < 3) {
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

        // ⛔️ non connecté
        if (res.status === 401) {
          throw new Error("Tu dois être connecté pour créer une annonce.");
        }

        // ⛔️ pas hôte
        if (res.status === 403) {
          throw new Error(
            j?.error ||
              "Tu dois avoir un compte hôte Lok'Room pour créer une annonce."
          );
        }

        throw new Error(j?.error || "Création annonce: erreur serveur");
      }

      const data = await res.json();
      const listingId: string | undefined = data?.listing?.id;
      if (!listingId) throw new Error("ID annonce manquant après création.");

      if (images.length) setUploading(true);

      // On envoie les images dans l'ordre du tableau `images`
      for (const img of images) {
        const file = img.file;

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

        const saveBody: any = {
          url: presign.publicUrl,
        };
        if (
          typeof img.width === "number" &&
          typeof img.height === "number"
        ) {
          saveBody.width = img.width;
          saveBody.height = img.height;
        }

        const save = await fetch(`/api/listings/${listingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveBody),
        });
        if (!save.ok) {
          const body = await save.text().catch(() => "");
          throw new Error(`Save image échoué (${save.status}). ${body}`);
        }
      }

      toast.success("Annonce créée ✅");
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
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
      {/* 🔧 Override auto-animate : uniquement le déplacement (pas de fade) */}
      <style jsx global>{`
        [data-auto-animate] > * {
          transition-property: transform !important;
          transition-duration: 450ms !important;
          transition-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1) !important;
        }
      `}</style>

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

      <section className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Nouvelle annonce</h1>

        {/* uploader */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">
              Images (max {MAX_FILES}) · {images.length} sélectionnée(s)
              {images.length ? ` · ${totalSizeMb} Mo` : ""}
            </label>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs underline disabled:opacity-50"
              disabled={!images.length}
              title="Retirer toutes les images sélectionnées"
            >
              Retirer tout
            </button>
          </div>

          {/* dropzone */}
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

          {/* panneau d’images */}
          {images.length > 0 && (
            <div className="mt-2 rounded-2xl bg-gray-100 px-4 py-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200">
              <p className="mb-3 text-xs text-gray-700 sm:text-sm">
                👉{" "}
                <span className="font-semibold">La première image</span>{" "}
                (tout à gauche) est utilisée comme{" "}
                <span className="font-semibold">photo de couverture</span>. Tu
                peux cliquer sur{" "}
                <span className="font-semibold">“Mettre en couverture”</span> ou{" "}
                <span className="font-semibold">glisser les vignettes</span> pour
                changer l’ordre.
              </p>

              <div ref={filesParent} className="flex flex-wrap gap-3">
                {images.map((img, i) => {
                  const isCover = i === 0;
                  const isDragging = i === dragFileIndex;
                  return (
                    <div
                      key={img.id}
                      className={`group relative h-28 w-36 cursor-grab overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
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
                        src={img.previewUrl}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        alt=""
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

                      {/* close */}
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/80 px-1 text-xs text-white shadow transition hover:bg-black"
                        title="Retirer"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Formulaire texte */}
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
              <p className="text-sm text-red-600">{errors.title.message}</p>
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
              <label htmlFor="currency" className="mb-1 block text.sm">
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
              Commence à taper et choisis une adresse proposée. Cette adresse
              sert à positionner le logement mais ne sera pas affichée telle
              quelle (seule une position approximative est montrée sur la
              carte).
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

        {/* modale crop pleine page blanche */}
        {cropOpen && cropSrc && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex h-full w-full flex-col items-center justify-center px-4">
              <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Rogner l’image</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Clique-déplace pour recadrer, utilise le slider pour
                      zoomer.
                    </p>
                  </div>
                </div>

                <div className="relative mx-auto w-full max-h-[70vh] overflow-hidden rounded-xl bg-white">
                  <div className="relative aspect-[4/3] w-full">
                    <Cropper
                      image={cropSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={4 / 3}
                      cropShape="rect"
                      showGrid={false}
                      objectFit="contain"
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_, areaPixels) =>
                        setCroppedAreaPixels(areaPixels as PixelCrop)
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 sm:w-1/2">
                    <span className="text-xs text-gray-500">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-1 w-full cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setCropOpen(false);
                        setCropSrc(null);
                        setCropIndex(null);
                        setCroppedAreaPixels(null);
                      }}
                      className="rounded-md border px-3 py-1.5 text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
                      onClick={saveCrop}
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
