"use client";

import { useState, useCallback, useEffect, useMemo, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Script from "next/script";
import Cropper from "react-easy-crop";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getCroppedImage, type PixelCrop } from "@/lib/cropImage";

// ============================================================================
// TYPES
// ============================================================================

type ListingType =
  | "ROOM"
  | "STUDIO"
  | "APARTMENT"
  | "HOUSE"
  | "OFFICE"
  | "COWORKING"
  | "MEETING_ROOM"
  | "PARKING"
  | "GARAGE"
  | "STORAGE"
  | "EVENT_SPACE"
  | "RECORDING_STUDIO"
  | "OTHER";

type PricingMode = "HOURLY" | "DAILY" | "BOTH";

type Step =
  | "type"
  | "location"
  | "details"
  | "photos"
  | "description"
  | "pricing"
  | "review";

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
};

type FormData = {
  type: ListingType | null;
  country: "France" | "Canada";
  city: string;
  addressFull: string;
  lat: number | null;
  lng: number | null;
  latPublic: number | null;
  lngPublic: number | null;
  maxGuests: number;
  title: string;
  description: string;
  pricingMode: PricingMode;
  price: number;
  hourlyPrice: number | null;
  currency: "EUR" | "CAD";
  isInstantBook: boolean;
  minNights: number | null;
  maxNights: number | null;
};

// ============================================================================
// CONFIG
// ============================================================================

const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

const LISTING_TYPES: { value: ListingType; label: string; icon: string; description: string }[] = [
  { value: "APARTMENT", label: "Appartement", icon: "🏢", description: "Un appartement entier ou une partie" },
  { value: "HOUSE", label: "Maison", icon: "🏠", description: "Une maison entière ou des chambres" },
  { value: "ROOM", label: "Chambre", icon: "🛏️", description: "Une chambre privée chez un hôte" },
  { value: "STUDIO", label: "Studio", icon: "🎨", description: "Un studio de création ou artistique" },
  { value: "OFFICE", label: "Bureau", icon: "💼", description: "Un espace de travail privé" },
  { value: "COWORKING", label: "Coworking", icon: "👥", description: "Un espace de travail partagé" },
  { value: "MEETING_ROOM", label: "Salle de réunion", icon: "📊", description: "Pour vos réunions et présentations" },
  { value: "RECORDING_STUDIO", label: "Studio d'enregistrement", icon: "🎙️", description: "Pour la musique et les podcasts" },
  { value: "EVENT_SPACE", label: "Espace événementiel", icon: "🎉", description: "Pour vos événements et fêtes" },
  { value: "PARKING", label: "Parking", icon: "🅿️", description: "Une place de stationnement" },
  { value: "GARAGE", label: "Garage", icon: "🚗", description: "Un garage ou box fermé" },
  { value: "STORAGE", label: "Stockage", icon: "📦", description: "Un espace de rangement" },
  { value: "OTHER", label: "Autre", icon: "✨", description: "Un autre type d'espace" },
];

const STEPS: { key: Step; title: string; subtitle: string }[] = [
  { key: "type", title: "Type d'espace", subtitle: "Quel type d'espace proposez-vous ?" },
  { key: "location", title: "Localisation", subtitle: "Où se trouve votre espace ?" },
  { key: "details", title: "Caractéristiques", subtitle: "Décrivez les détails de votre espace" },
  { key: "photos", title: "Photos", subtitle: "Ajoutez des photos de votre espace" },
  { key: "description", title: "Description", subtitle: "Donnez envie aux voyageurs" },
  { key: "pricing", title: "Tarification", subtitle: "Définissez vos prix" },
  { key: "review", title: "Vérification", subtitle: "Vérifiez et publiez votre annonce" },
];

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ============================================================================
// HELPERS
// ============================================================================

async function jsonOrThrow(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Réponse non-JSON (${res.status})`);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewListingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Vérifier si l'utilisateur est hôte
  const isHost = (session?.user as any)?.isHost || (session?.user as any)?.role === "HOST" || (session?.user as any)?.role === "BOTH";

  // Rediriger les non-hôtes vers la page "devenir hôte"
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/listings/new");
      return;
    }

    if (status === "authenticated" && !isHost) {
      toast.error("Tu dois être hôte pour créer une annonce");
      router.push("/become-host");
    }
  }, [status, isHost, router]);

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>("type");

  // Form data
  const [formData, setFormData] = useState<FormData>({
    type: null,
    country: "France",
    city: "",
    addressFull: "",
    lat: null,
    lng: null,
    latPublic: null,
    lngPublic: null,
    maxGuests: 1,
    title: "",
    description: "",
    pricingMode: "DAILY",
    price: 0,
    hourlyPrice: null,
    currency: "EUR",
    isInstantBook: false,
    minNights: null,
    maxNights: null,
  });

  // Images
  const [images, setImages] = useState<LocalImage[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Crop modal
  const [cropOpen, setCropOpen] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  // Maps
  const [mapsReady, setMapsReady] = useState(false);

  // Loading
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Auto-animate
  const [filesParent] = useAutoAnimate<HTMLDivElement>({ duration: 300 });
  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);

  // Currency from cookie
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cookieCurrency = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setFormData((prev) => ({ ...prev, currency: cookieCurrency }));
  }, []);

  // Récupérer le type pré-sélectionné depuis become-host
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedType = sessionStorage.getItem("lokroom_listing_type");
      if (savedType && LISTING_TYPES.some(t => t.value === savedType)) {
        setFormData((prev) => ({ ...prev, type: savedType as ListingType }));
        setCurrentStep("location");
        sessionStorage.removeItem("lokroom_listing_type");
      }
    }
  }, []);

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const g = (window as any).google;
      if (g?.maps?.places) {
        setMapsReady(true);
      }
    }
  }, []);

  // Setup address autocomplete
  useEffect(() => {
    if (!mapsReady || currentStep !== "location") return;

    const g = (window as any).google;
    if (!g?.maps?.places?.Autocomplete) return;

    const input = document.getElementById("addressFull") as HTMLInputElement | null;
    if (!input) return;

    const autocomplete = new g.maps.places.Autocomplete(input, {
      types: ["geocode"],
      fields: ["formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) {
        toast.error("Impossible de récupérer la position pour cette adresse.");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const latPublic = Math.round(lat * 1000) / 1000;
      const lngPublic = Math.round(lng * 1000) / 1000;

      setFormData((prev) => ({
        ...prev,
        addressFull: place.formatted_address || prev.addressFull,
        lat,
        lng,
        latPublic,
        lngPublic,
      }));
    });

    return () => {
      g.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [mapsReady, currentStep]);

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================

  function addFiles(incoming: File[]) {
    const imagesOnly = incoming.filter((f) => f.type.startsWith("image/"));
    const tooBig = imagesOnly.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig.length) {
      toast.error(`Certaines images dépassent ${MAX_SIZE_MB} Mo`);
    }
    const ok = imagesOnly.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024);

    const mapped: LocalImage[] = ok.map((file) => ({
      id: createId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => {
      const merged = [...prev, ...mapped].slice(0, MAX_FILES);
      if (merged.length < prev.length + mapped.length) {
        toast.message(`Maximum ${MAX_FILES} photos`);
      }
      return merged;
    });
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  const openCropper = (index: number) => {
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
    if (!cropOpen || cropIndex === null || !cropSrc || !croppedAreaPixels) return;

    try {
      const current = images[cropIndex];
      if (!current) return;

      const { blob, width, height } = await getCroppedImage(
        cropSrc,
        croppedAreaPixels,
        current.file.type || "image/jpeg",
        { maxWidth: 2560, maxHeight: 2560, quality: 0.92 }
      );

      const croppedFile = new File([blob], current.file.name, { type: current.file.type });
      const newPreviewUrl = URL.createObjectURL(croppedFile);

      setImages((prev) =>
        prev.map((img, i) => {
          if (i !== cropIndex) return img;
          URL.revokeObjectURL(img.previewUrl);
          return { ...img, file: croppedFile, previewUrl: newPreviewUrl, width, height };
        })
      );
      toast.success("Image recadrée");
    } catch {
      toast.error("Erreur lors du recadrage");
    } finally {
      setCropOpen(false);
      setCropSrc(null);
      setCropIndex(null);
    }
  }, [cropOpen, cropIndex, cropSrc, croppedAreaPixels, images]);

  function makeCover(index: number) {
    setImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const copy = [...prev];
      const [img] = copy.splice(index, 1);
      copy.unshift(img);
      return copy;
    });
  }

  // Drag & drop reorder
  const handleFileDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragFileIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleFileDrop = (index: number) => {
    if (dragFileIndex === null || dragFileIndex === index) {
      setDragFileIndex(null);
      return;
    }
    setImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(dragFileIndex, 1);
      if (!moved) return prev;
      copy.splice(index, 0, moved);
      return copy;
    });
    setDragFileIndex(null);
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;

  function canProceed(): boolean {
    switch (currentStep) {
      case "type":
        return formData.type !== null;
      case "location":
        return formData.city.trim().length > 0 && formData.addressFull.trim().length >= 5;
      case "details":
        return formData.maxGuests >= 1;
      case "photos":
        return images.length >= 3;
      case "description":
        return formData.title.trim().length >= 3 && formData.description.trim().length >= 10;
      case "pricing":
        return formData.price >= 2;
      case "review":
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (!canProceed()) {
      toast.error("Veuillez compléter cette étape");
      return;
    }
    if (!isLastStep) {
      setCurrentStep(STEPS[stepIndex + 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (!isFirstStep) {
      setCurrentStep(STEPS[stepIndex - 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ============================================================================
  // SUBMIT
  // ============================================================================

  async function handleSubmit() {
    if (!canProceed()) return;

    setSubmitting(true);

    try {
      // Create listing
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        price: formData.price,
        hourlyPrice: formData.hourlyPrice,
        pricingMode: formData.pricingMode,
        currency: formData.currency,
        country: formData.country,
        city: formData.city.trim(),
        addressFull: formData.addressFull.trim(),
        lat: formData.lat,
        lng: formData.lng,
        latPublic: formData.latPublic,
        lngPublic: formData.lngPublic,
        maxGuests: formData.maxGuests,
        isInstantBook: formData.isInstantBook,
        minNights: formData.minNights,
        maxNights: formData.maxNights,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        if (res.status === 401) throw new Error("Vous devez être connecté");
        if (res.status === 403) throw new Error(j?.error || "Vous devez être hôte");
        throw new Error(j?.error || "Erreur serveur");
      }

      const data = await res.json();
      const listingId = data?.listing?.id;
      if (!listingId) throw new Error("ID de l'annonce manquant");

      // Upload images
      if (images.length) {
        setUploading(true);

        for (const img of images) {
          const p = await fetch("/api/upload/presign-listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId,
              filename: img.file.name,
              contentType: img.file.type || "application/octet-stream",
              fileSize: img.file.size,
            }),
          });

          if (!p.ok) throw new Error("Erreur lors de la préparation de l'upload");
          const presign = await jsonOrThrow(p);

          const put = await fetch(presign.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": img.file.type || "application/octet-stream" },
            body: img.file,
          });

          if (!put.ok) throw new Error("Erreur lors de l'upload de l'image");

          await fetch(`/api/listings/${listingId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: presign.publicUrl,
              width: img.width,
              height: img.height,
            }),
          });
        }
      }

      toast.success("Annonce créée avec succès !");
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      router.push(`/listings/${listingId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const totalSizeMb = useMemo(
    () => (images.reduce((acc, img) => acc + img.file.size, 0) / (1024 * 1024)).toFixed(1),
    [images]
  );

  // Afficher un loader pendant la vérification de session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Ne pas afficher le formulaire si l'utilisateur n'est pas hôte (en attendant la redirection)
  if (status === "unauthenticated" || !isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
          <p className="mt-4 text-sm text-gray-500">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
        />
      )}

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <button
              onClick={() => router.push("/host/listings")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Quitter
            </button>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i <= stepIndex ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="w-16" />
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-2xl px-4 py-8">
          {/* Step title */}
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-gray-500">
              Étape {stepIndex + 1} sur {STEPS.length}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              {STEPS[stepIndex].title}
            </h1>
            <p className="mt-1 text-gray-500">{STEPS[stepIndex].subtitle}</p>
          </div>

          {/* ========== STEP: TYPE ========== */}
          {currentStep === "type" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: t.value }))}
                  className={`group flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-gray-400 ${
                    formData.type === t.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <span className="font-medium text-gray-900">{t.label}</span>
                    <p className="mt-0.5 text-sm text-gray-500">{t.description}</p>
                  </div>
                  {formData.type === t.value && (
                    <div className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ========== STEP: LOCATION ========== */}
          {currentStep === "location" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pays</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["France", "Canada"] as const).map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        country,
                        currency: country === "Canada" ? "CAD" : "EUR",
                      }))}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        formData.country === country
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {country === "France" ? "🇫🇷 France" : "🇨🇦 Canada"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-gray-700">
                  Ville
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Paris, Lyon, Montréal..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="addressFull" className="text-sm font-medium text-gray-700">
                  Adresse exacte
                </label>
                <input
                  id="addressFull"
                  type="text"
                  value={formData.addressFull}
                  onChange={(e) => setFormData((prev) => ({ ...prev, addressFull: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="123 rue de la Paix, 75001 Paris"
                />
                <p className="text-xs text-gray-500">
                  L&apos;adresse exacte ne sera visible que par les voyageurs ayant réservé.
                </p>
                {formData.lat && formData.lng && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Position détectée
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========== STEP: DETAILS ========== */}
          {currentStep === "details" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Capacité d&apos;accueil
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, maxGuests: Math.max(1, prev.maxGuests - 1) }))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-16 text-center text-lg font-medium">
                    {formData.maxGuests} {formData.maxGuests > 1 ? "personnes" : "personne"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, maxGuests: Math.min(50, prev.maxGuests + 1) }))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Réservation instantanée
                </label>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, isInstantBook: !prev.isInstantBook }))}
                  className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                    formData.isInstantBook ? "border-gray-900 bg-gray-50" : "border-gray-200"
                  }`}
                >
                  <div className="text-left">
                    <span className="font-medium text-gray-900">Activer la réservation instantanée</span>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Les voyageurs peuvent réserver sans attendre votre approbation
                    </p>
                  </div>
                  <div className={`h-6 w-11 rounded-full transition-colors ${formData.isInstantBook ? "bg-gray-900" : "bg-gray-200"}`}>
                    <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.isInstantBook ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP: PHOTOS ========== */}
          {currentStep === "photos" && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300"
                }`}
              >
                <svg className="mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-gray-600">Glissez vos photos ici</p>
                <p className="mt-1 text-sm text-gray-400">ou</p>
                <label className="mt-3 cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                  Parcourir les fichiers
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => addFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
                <p className="mt-4 text-xs text-gray-400">
                  JPG, PNG ou WebP · Max {MAX_SIZE_MB} Mo par image · {images.length}/{MAX_FILES} photos
                </p>
              </div>

              {/* Images grid */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {images.length} photo{images.length > 1 ? "s" : ""} · {totalSizeMb} Mo
                    </span>
                    <span className="text-xs text-gray-400">
                      Glissez pour réorganiser
                    </span>
                  </div>

                  <div ref={filesParent} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img, i) => {
                      const isCover = i === 0;
                      const isDragging = i === dragFileIndex;
                      return (
                        <div
                          key={img.id}
                          className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl border-2 bg-gray-100 transition-all ${
                            isDragging ? "scale-105 ring-2 ring-gray-900" : "border-gray-200"
                          } ${isCover ? "sm:col-span-2 sm:row-span-2" : ""}`}
                          draggable
                          onDragStart={(e) => handleFileDragStart(e, i)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleFileDrop(i)}
                          onDragEnd={() => setDragFileIndex(null)}
                        >
                          <img
                            src={img.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />

                          {/* Cover badge */}
                          {isCover && (
                            <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-medium shadow">
                              Photo de couverture
                            </span>
                          )}

                          {/* Actions overlay */}
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openCropper(i)}
                              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-900"
                            >
                              Recadrer
                            </button>
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => makeCover(i)}
                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-900"
                              >
                                Couverture
                              </button>
                            )}
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {images.length < 3 && (
                <p className="text-center text-sm text-amber-600">
                  Ajoutez au moins 3 photos pour continuer
                </p>
              )}
            </div>
          )}

          {/* ========== STEP: DESCRIPTION ========== */}
          {currentStep === "description" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Titre de l&apos;annonce
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={120}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Ex: Studio lumineux au cœur de Paris"
                />
                <p className="text-right text-xs text-gray-400">{formData.title.length}/120</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  maxLength={2000}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Décrivez votre espace : ce qui le rend unique, les équipements disponibles, l&apos;ambiance, le quartier..."
                />
                <p className="text-right text-xs text-gray-400">{formData.description.length}/2000</p>
              </div>
            </div>
          )}

          {/* ========== STEP: PRICING ========== */}
          {currentStep === "pricing" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mode de tarification</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "DAILY", label: "À la journée" },
                    { value: "HOURLY", label: "À l&apos;heure" },
                    { value: "BOTH", label: "Les deux" },
                  ] as const).map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, pricingMode: mode.value }))}
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                        formData.pricingMode === mode.value
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.pricingMode === "DAILY" || formData.pricingMode === "BOTH") && (
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium text-gray-700">
                    Prix par jour/nuit ({formData.currency})
                  </label>
                  <div className="relative">
                    <input
                      id="price"
                      type="number"
                      min={2}
                      step={1}
                      value={formData.price || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 text-lg font-medium focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.currency === "EUR" ? "€" : "$"} / jour
                    </span>
                  </div>
                </div>
              )}

              {(formData.pricingMode === "HOURLY" || formData.pricingMode === "BOTH") && (
                <div className="space-y-2">
                  <label htmlFor="hourlyPrice" className="text-sm font-medium text-gray-700">
                    Prix par heure ({formData.currency})
                  </label>
                  <div className="relative">
                    <input
                      id="hourlyPrice"
                      type="number"
                      min={1}
                      step={1}
                      value={formData.hourlyPrice || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hourlyPrice: parseFloat(e.target.value) || null }))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 text-lg font-medium focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.currency === "EUR" ? "€" : "$"} / h
                    </span>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Conseil :</span> Regardez les prix des espaces similaires dans votre région pour rester compétitif.
                </p>
              </div>
            </div>
          )}

          {/* ========== STEP: REVIEW ========== */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                {/* Preview image */}
                {images[0] && (
                  <div className="aspect-[16/9] bg-gray-100">
                    <img
                      src={images[0].previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formData.title || "Titre de l&apos;annonce"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.city}, {formData.country}
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {formData.price} {formData.currency === "EUR" ? "€" : "$"} / jour
                    {formData.hourlyPrice && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ou {formData.hourlyPrice} {formData.currency === "EUR" ? "€" : "$"} / h
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                <h4 className="font-medium text-gray-900">Récapitulatif</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type d&apos;espace</span>
                    <span className="font-medium">{LISTING_TYPES.find((t) => t.value === formData.type)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacité</span>
                    <span className="font-medium">{formData.maxGuests} personne{formData.maxGuests > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Photos</span>
                    <span className="font-medium">{images.length} photo{images.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Réservation instantanée</span>
                    <span className="font-medium">{formData.isInstantBook ? "Oui" : "Non"}</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                En publiant, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité.
              </p>
            </div>
          )}
        </main>

        {/* Footer navigation */}
        <footer className="sticky bottom-0 border-t border-gray-200 bg-white">
          <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirstStep}
              className="text-sm font-medium text-gray-900 underline disabled:invisible"
            >
              Retour
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploading || !canProceed()}
                className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting || uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {uploading ? "Upload des photos..." : "Publication..."}
                  </span>
                ) : (
                  "Publier l&apos;annonce"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:bg-black disabled:opacity-50"
              >
                Suivant
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Crop modal */}
      {cropOpen && cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Recadrer l&apos;image</h3>

            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-900">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels as PixelCrop)}
              />
            </div>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-gray-500">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setCropOpen(false); setCropSrc(null); setCropIndex(null); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveCrop}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
