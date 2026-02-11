"use client";

import { useState, useCallback, useEffect, type DragEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getCroppedImage, type PixelCrop } from "@/lib/cropImage";
import AmenitiesSelector from "@/components/listings/AmenitiesSelector";
import BedConfiguration from "@/components/listings/BedConfiguration";
import type { BedConfig } from "@/components/listings/BedConfiguration";
import { Plus, Minus } from "lucide-react";

// ============================================================================
// GOOGLE MAPS TYPES (simplified for TypeScript compatibility)
// ============================================================================
type GoogleMapsAPI = {
  maps: {
    Map: new (container: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    Marker: new (options: Record<string, unknown>) => GoogleMarker;
    Size: new (width: number, height: number) => unknown;
    Point: new (x: number, y: number) => unknown;
    Animation: { DROP: unknown };
    event: {
      clearInstanceListeners: (instance: unknown) => void;
      trigger: (instance: unknown, event: string) => void;
    };
    places?: {
      Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => GoogleAutocomplete;
    };
  };
};

type GoogleMap = {
  setCenter: (pos: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  addListener: (event: string, handler: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => void;
};

type GoogleMarker = {
  setPosition: (pos: unknown) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  addListener: (event: string, handler: () => void) => void;
};

type GoogleAutocomplete = {
  addListener: (event: string, handler: () => void) => void;
  getPlace: () => {
    geometry?: { location?: { lat: () => number; lng: () => number } };
    formatted_address?: string;
    address_components?: Array<{ types: string[]; long_name: string }>;
  };
};

type WindowWithGoogle = Window & { google?: GoogleMapsAPI };
type MapElementWithGmap = HTMLElement & { __gmap?: GoogleMap };
/* eslint-enable @typescript-eslint/no-explicit-any */

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

type Section = "info" | "location" | "capacity" | "photos" | "pricing";

type ExistingImage = {
  id: string;
  url: string;
  isCover: boolean;
  position: number;
};

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type ListingData = {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  customType?: string | null;
  price: number;
  hourlyPrice?: number | null;
  pricingMode: PricingMode;
  currency: "EUR" | "CAD";
  country: string;
  city: string;
  addressFull: string;
  addressLine1?: string | null;
  postalCode?: string | null;
  province?: string | null;
  regionFR?: string | null;
  lat: number;
  lng: number;
  latPublic: number;
  lngPublic: number;
  maxGuests?: number | null;
  beds?: number | null;
  desks?: number | null;
  parkings?: number | null;
  bathrooms?: number | null;
  spaceFeatures: string[];
  isInstantBook: boolean;
  minNights?: number | null;
  maxNights?: number | null;
  discountHours3Plus?: number | null;
  discountHours6Plus?: number | null;
  discountDays3Plus?: number | null;
  discountWeekly?: number | null;
  discountMonthly?: number | null;
  images: ExistingImage[];

  // === NOUVEAUX CHAMPS ===
  bedrooms?: number | null;
  bedConfiguration?: Record<string, unknown> | null;
  bathroomsFull?: number | null;
  bathroomsHalf?: number | null;
  spaceType?: string | null;

  floors?: number | null;
  hasGarden?: boolean;
  gardenSize?: number | null;
  hasPool?: boolean;
  poolType?: string | null;
  poolHeated?: boolean;
  hasTerrace?: boolean;
  terraceSize?: number | null;

  studioType?: string | null;
  studioHeight?: number | null;
  hasGreenScreen?: boolean;
  hasSoundproofing?: boolean;

  parkingType?: string | null;
  parkingCovered?: boolean;
  parkingSecured?: boolean;
  parkingLength?: number | null;
  parkingWidth?: number | null;
  parkingHeight?: number | null;
  hasEVCharger?: boolean;

  hourlyIncrement?: number;
  minDurationMinutes?: number | null;
  cleaningFee?: number | null;
  extraGuestFee?: number | null;
  extraGuestThreshold?: number | null;

  discountHours2Plus?: number | null;
  discountHours4Plus?: number | null;
  discountHours8Plus?: number | null;
  discountDays2Plus?: number | null;
  discountDays5Plus?: number | null;
  discountDays14Plus?: number | null;

  spaceDescription?: string;
  guestAccessDescription?: string;
  neighborhoodDescription?: string;
  highlights?: string[];

  amenityIds?: string[];
};

// ============================================================================
// CONFIG
// ============================================================================

const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  {
    key: "info",
    label: "Informations",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
  {
    key: "location",
    label: "Localisation",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    key: "capacity",
    label: "Capacité",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: "photos",
    label: "Photos",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    key: "pricing",
    label: "Tarification",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "ROOM", label: "Chambre" },
  { value: "STUDIO", label: "Studio créatif" },
  { value: "OFFICE", label: "Bureau" },
  { value: "COWORKING", label: "Coworking" },
  { value: "MEETING_ROOM", label: "Salle de réunion" },
  { value: "RECORDING_STUDIO", label: "Studios" },
  { value: "EVENT_SPACE", label: "Espace événementiel" },
  { value: "PARKING", label: "Parking" },
  { value: "GARAGE", label: "Garage" },
  { value: "STORAGE", label: "Stockage" },
  { value: "OTHER", label: "Autre" },
];

const SPACE_FEATURES = [
  { value: "well-located", label: "Bien situé", icon: "📍" },
  { value: "unique", label: "Unique", icon: "✨" },
  { value: "spacious", label: "Spacieux", icon: "🏠" },
  { value: "quiet", label: "Calme", icon: "🤫" },
  { value: "bright", label: "Lumineux", icon: "☀️" },
  { value: "modern", label: "Moderne", icon: "🆕" },
  { value: "charming", label: "Charmant", icon: "💫" },
  { value: "cozy", label: "Cosy", icon: "🛋️" },
  { value: "professional", label: "Professionnel", icon: "💼" },
  { value: "equipped", label: "Bien équipé", icon: "🔧" },
  { value: "secure", label: "Sécurisé", icon: "🔒" },
  { value: "accessible", label: "Accessible", icon: "♿" },
];

const PROVINCES_CA = [
  { value: "QC", label: "Québec" },
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "Colombie-Britannique" },
  { value: "AB", label: "Alberta" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nouvelle-Écosse" },
  { value: "NB", label: "Nouveau-Brunswick" },
  { value: "NL", label: "Terre-Neuve-et-Labrador" },
  { value: "PE", label: "Île-du-Prince-Édouard" },
];

const REGIONS_FR = [
  { value: "IDF", label: "Île-de-France" },
  { value: "ARA", label: "Auvergne-Rhône-Alpes" },
  { value: "NAQ", label: "Nouvelle-Aquitaine" },
  { value: "OCC", label: "Occitanie" },
  { value: "HDF", label: "Hauts-de-France" },
  { value: "GES", label: "Grand Est" },
  { value: "PAC", label: "Provence-Alpes-Côte d'Azur" },
  { value: "PDL", label: "Pays de la Loire" },
  { value: "BRE", label: "Bretagne" },
  { value: "NOR", label: "Normandie" },
  { value: "BFC", label: "Bourgogne-Franche-Comté" },
  { value: "CVL", label: "Centre-Val de Loire" },
  { value: "COR", label: "Corse" },
];

const CAPACITY_CONFIG: Record<ListingType, { fields: string[]; labels: Record<string, string> }> = {
  APARTMENT: { fields: ["maxGuests", "beds", "bathrooms"], labels: { maxGuests: "Voyageurs", beds: "Lits", bathrooms: "Salles de bain" } },
  HOUSE: { fields: ["maxGuests", "beds", "bathrooms"], labels: { maxGuests: "Voyageurs", beds: "Lits", bathrooms: "Salles de bain" } },
  ROOM: { fields: ["maxGuests", "beds"], labels: { maxGuests: "Voyageurs", beds: "Lits" } },
  STUDIO: { fields: ["maxGuests"], labels: { maxGuests: "Personnes max" } },
  OFFICE: { fields: ["maxGuests", "desks"], labels: { maxGuests: "Personnes max", desks: "Bureaux" } },
  COWORKING: { fields: ["maxGuests", "desks"], labels: { maxGuests: "Personnes max", desks: "Postes de travail" } },
  MEETING_ROOM: { fields: ["maxGuests"], labels: { maxGuests: "Participants max" } },
  PARKING: { fields: ["parkings"], labels: { parkings: "Places de parking" } },
  GARAGE: { fields: ["parkings"], labels: { parkings: "Véhicules max" } },
  STORAGE: { fields: ["maxGuests"], labels: { maxGuests: "Personnes accès" } },
  EVENT_SPACE: { fields: ["maxGuests"], labels: { maxGuests: "Participants max" } },
  RECORDING_STUDIO: { fields: ["maxGuests"], labels: { maxGuests: "Personnes max" } },
  OTHER: { fields: ["maxGuests"], labels: { maxGuests: "Personnes max" } },
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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

export default function EditListingClient({ listing }: { listing: ListingData }) {
  // Current section
  const [activeSection, setActiveSection] = useState<Section>("info");

  // Form data
  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description,
    type: listing.type,
    customType: listing.customType || "",
    price: listing.price,
    hourlyPrice: listing.hourlyPrice || null,
    pricingMode: listing.pricingMode || "DAILY",
    currency: listing.currency,
    country: listing.country as "France" | "Canada",
    city: listing.city,
    addressFull: listing.addressFull,
    addressLine1: listing.addressLine1 || "",
    postalCode: listing.postalCode || "",
    province: listing.province || "",
    regionFR: listing.regionFR || "",
    lat: listing.lat,
    lng: listing.lng,
    latPublic: listing.latPublic,
    lngPublic: listing.lngPublic,
    maxGuests: listing.maxGuests || 1,
    beds: listing.beds || null,
    desks: listing.desks || null,
    parkings: listing.parkings || null,
    bathrooms: listing.bathrooms || null,
    spaceFeatures: listing.spaceFeatures || [],
    isInstantBook: listing.isInstantBook,
    minNights: listing.minNights || null,
    maxNights: listing.maxNights || null,
    discountHours3Plus: listing.discountHours3Plus || null,
    discountHours6Plus: listing.discountHours6Plus || null,
    discountDays3Plus: listing.discountDays3Plus || null,
    discountWeekly: listing.discountWeekly || null,
    discountMonthly: listing.discountMonthly || null,

    // === NOUVEAUX CHAMPS ===
    bedrooms: listing.bedrooms || null,
    bedConfiguration: listing.bedConfiguration || null,
    bathroomsFull: listing.bathroomsFull || null,
    bathroomsHalf: listing.bathroomsHalf || null,
    spaceType: listing.spaceType || "ENTIRE_PLACE",

    floors: listing.floors || null,
    hasGarden: listing.hasGarden || false,
    gardenSize: listing.gardenSize || null,
    hasPool: listing.hasPool || false,
    poolType: listing.poolType || null,
    poolHeated: listing.poolHeated || false,
    hasTerrace: listing.hasTerrace || false,
    terraceSize: listing.terraceSize || null,

    studioType: listing.studioType || null,
    studioHeight: listing.studioHeight || null,
    hasGreenScreen: listing.hasGreenScreen || false,
    hasSoundproofing: listing.hasSoundproofing || false,

    parkingType: listing.parkingType || null,
    parkingCovered: listing.parkingCovered || false,
    parkingSecured: listing.parkingSecured || false,
    parkingLength: listing.parkingLength || null,
    parkingWidth: listing.parkingWidth || null,
    parkingHeight: listing.parkingHeight || null,
    hasEVCharger: listing.hasEVCharger || false,

    hourlyIncrement: listing.hourlyIncrement || 60,
    minDurationMinutes: listing.minDurationMinutes || null,
    cleaningFee: listing.cleaningFee || null,
    extraGuestFee: listing.extraGuestFee || null,
    extraGuestThreshold: listing.extraGuestThreshold || null,

    discountHours2Plus: listing.discountHours2Plus || null,
    discountHours4Plus: listing.discountHours4Plus || null,
    discountHours8Plus: listing.discountHours8Plus || null,
    discountDays2Plus: listing.discountDays2Plus || null,
    discountDays5Plus: listing.discountDays5Plus || null,
    discountDays14Plus: listing.discountDays14Plus || null,

    spaceDescription: listing.spaceDescription || "",
    guestAccessDescription: listing.guestAccessDescription || "",
    neighborhoodDescription: listing.neighborhoodDescription || "",
    highlights: listing.highlights || [],

    amenityIds: listing.amenityIds || [],
  });

  // Images
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    listing.images?.sort((a, b) => a.position - b.position) || []
  );
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Drag index for reordering
  const [dragExistingIndex, setDragExistingIndex] = useState<number | null>(null);
  
  const [dragNewIndex, setDragNewIndex] = useState<number | null>(null);

  // Crop modal
  const [cropOpen, setCropOpen] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  // Maps
  const [mapsReady, setMapsReady] = useState(false);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-animate
  const [imagesParent] = useAutoAnimate<HTMLDivElement>({ duration: 300 });
  const [newImagesParent] = useAutoAnimate<HTMLDivElement>({ duration: 300 });

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [formData]);

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const g = (window as WindowWithGoogle).google;
      if (g?.maps?.places) {
        setMapsReady(true);
      }
    }
  }, []);

  // Initialize map for location section
  useEffect(() => {
    if (!mapsReady || activeSection !== "location") return;

    const g = (window as WindowWithGoogle).google;
    if (!g?.maps) return;

    const container = document.getElementById("edit-map");
    if (!container) return;

    // Clean map styles
    const mapStyles = [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#c8e0f0" }] },
      { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f5f5f5" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
    ];

    const center = { lat: formData.lat || 48.8566, lng: formData.lng || 2.3522 };

    const map = new g.maps.Map(container, {
      center,
      zoom: formData.lat ? 16 : 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: mapStyles,
    });

    (container as MapElementWithGmap).__gmap = map;

    const customIcon = {
      url: "/map-marker-lokroom-creation.webp",
      scaledSize: new g.maps.Size(40, 40),
      anchor: new g.maps.Point(20, 40), // Anchor at bottom center (like default pin)
    };

    const marker = new g.maps.Marker({
      position: center,
      map,
      draggable: true,
      animation: g.maps.Animation.DROP,
      icon: customIcon,
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        setFormData((prev) => ({
          ...prev,
          lat,
          lng,
          latPublic: Math.round(lat * 1000) / 1000,
          lngPublic: Math.round(lng * 1000) / 1000,
        }));
      }
    });

    map.addListener("click", (e: { latLng?: { lat: () => number; lng: () => number } }) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        g.maps.event.trigger(marker, "dragend");
      }
    });

    return () => {
      g.maps.event.clearInstanceListeners(map);
      g.maps.event.clearInstanceListeners(marker);
    };
    // Note: formData.lat/lng are intentionally excluded to avoid recreating the map on every position change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, activeSection]);

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

    setNewImages((prev) => {
      const total = existingImages.length + prev.length + mapped.length;
      if (total > MAX_FILES) {
        toast.message(`Maximum ${MAX_FILES} photos au total`);
        return [...prev, ...mapped].slice(0, MAX_FILES - existingImages.length);
      }
      return [...prev, ...mapped];
    });
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  }

  async function deleteExistingImage(imageId: string) {
    if (!confirm("Supprimer cette image ?")) return;

    try {
      const res = await fetch(
        `/api/listings/${listing.id}/images?imageId=${encodeURIComponent(imageId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Suppression impossible");

      setExistingImages((prev) => prev.filter((im) => im.id !== imageId));
      toast.success("Image supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  async function setCover(imageId: string) {
    try {
      const newOrder = [...existingImages];
      const index = newOrder.findIndex((im) => im.id === imageId);
      if (index === -1) return;

      const [target] = newOrder.splice(index, 1);
      newOrder.unshift(target);
      setExistingImages(newOrder);

      const res = await fetch(`/api/listings/${listing.id}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setCover", imageId }),
      });

      if (!res.ok) {
        toast.error("Impossible de changer la couverture");
      } else {
        toast.success("Photo de couverture mise à jour");
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  }

  const openCropper = (index: number) => {
    const img = newImages[index];
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
      const current = newImages[cropIndex];
      if (!current) return;

      const { blob } = await getCroppedImage(
        cropSrc,
        croppedAreaPixels,
        current.file.type || "image/jpeg",
        { maxWidth: 2560, maxHeight: 2560, quality: 0.92 }
      );

      const croppedFile = new File([blob], current.file.name, { type: current.file.type });
      const newPreviewUrl = URL.createObjectURL(croppedFile);

      setNewImages((prev) =>
        prev.map((img, i) => {
          if (i !== cropIndex) return img;
          URL.revokeObjectURL(img.previewUrl);
          return { ...img, file: croppedFile, previewUrl: newPreviewUrl };
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
  }, [cropOpen, cropIndex, cropSrc, croppedAreaPixels, newImages]);

  // Drag reorder for existing images
  const handleExistingDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragExistingIndex(index);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  };

  const handleExistingDrop = async (index: number) => {
    if (dragExistingIndex === null || dragExistingIndex === index) {
      setDragExistingIndex(null);
      return;
    }

    const current = [...existingImages];
    const [moved] = current.splice(dragExistingIndex, 1);
    if (!moved) return;
    current.splice(index, 0, moved);
    setExistingImages(current);
    setDragExistingIndex(null);

    try {
      const res = await fetch(`/api/listings/${listing.id}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", order: current.map((im) => im.id) }),
      });
      if (res.ok) toast.success("Ordre mis à jour");
    } catch {
      toast.error("Erreur lors du réordonnancement");
    }
  };

  // Upload new images
  async function uploadNewImages() {
    if (!newImages.length) return;
    setUploading(true);

    try {
      for (const img of newImages) {
        const p = await fetch("/api/upload/presign-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            filename: img.file.name,
            contentType: img.file.type || "application/octet-stream",
            fileSize: img.file.size,
          }),
        });

        if (!p.ok) throw new Error("Erreur lors de la préparation");
        const presign = await jsonOrThrow(p);

        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": img.file.type || "application/octet-stream" },
          body: img.file,
        });

        if (!put.ok) throw new Error("Erreur lors de l'upload");

        const save = await fetch(`/api/listings/${listing.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: presign.publicUrl }),
        });

        if (save.ok) {
          const j = await save.json();
          if (j?.image) {
            setExistingImages((prev) => [...prev, j.image]);
          }
        }

        URL.revokeObjectURL(img.previewUrl);
      }

      setNewImages([]);
      toast.success("Images ajoutées avec succès");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  // ============================================================================
  // SAVE
  // ============================================================================

  async function handleSave() {
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        customType: formData.type === "OTHER" ? formData.customType : null,
        price: formData.price,
        hourlyPrice: formData.hourlyPrice,
        pricingMode: formData.pricingMode,
        currency: formData.currency,
        country: formData.country,
        city: formData.city.trim(),
        addressFull: formData.addressFull.trim(),
        addressLine1: formData.addressLine1.trim(),
        postalCode: formData.postalCode.trim(),
        province: formData.country === "Canada" ? formData.province : null,
        regionFR: formData.country === "France" ? formData.regionFR : null,
        lat: formData.lat,
        lng: formData.lng,
        latPublic: formData.latPublic,
        lngPublic: formData.lngPublic,
        maxGuests: formData.maxGuests,
        beds: formData.beds,
        desks: formData.desks,
        parkings: formData.parkings,
        bathrooms: formData.bathrooms,
        spaceFeatures: formData.spaceFeatures,
        isInstantBook: formData.isInstantBook,
        minNights: formData.minNights,
        maxNights: formData.maxNights,
        discountHours3Plus: formData.discountHours3Plus,
        discountHours6Plus: formData.discountHours6Plus,
        discountDays3Plus: formData.discountDays3Plus,
        discountWeekly: formData.discountWeekly,
        discountMonthly: formData.discountMonthly,

        // === NOUVEAUX CHAMPS ===
        bedrooms: formData.bedrooms,
        bedConfiguration: formData.bedConfiguration,
        bathroomsFull: formData.bathroomsFull,
        bathroomsHalf: formData.bathroomsHalf,
        spaceType: formData.spaceType,

        floors: formData.floors,
        hasGarden: formData.hasGarden,
        gardenSize: formData.gardenSize,
        hasPool: formData.hasPool,
        poolType: formData.poolType,
        poolHeated: formData.poolHeated,
        hasTerrace: formData.hasTerrace,
        terraceSize: formData.terraceSize,

        studioType: formData.studioType,
        studioHeight: formData.studioHeight,
        hasGreenScreen: formData.hasGreenScreen,
        hasSoundproofing: formData.hasSoundproofing,

        parkingType: formData.parkingType,
        parkingCovered: formData.parkingCovered,
        parkingSecured: formData.parkingSecured,
        parkingLength: formData.parkingLength,
        parkingWidth: formData.parkingWidth,
        parkingHeight: formData.parkingHeight,
        hasEVCharger: formData.hasEVCharger,

        hourlyIncrement: formData.hourlyIncrement,
        minDurationMinutes: formData.minDurationMinutes,
        cleaningFee: formData.cleaningFee,
        extraGuestFee: formData.extraGuestFee,
        extraGuestThreshold: formData.extraGuestThreshold,

        discountHours2Plus: formData.discountHours2Plus,
        discountHours4Plus: formData.discountHours4Plus,
        discountHours8Plus: formData.discountHours8Plus,
        discountDays2Plus: formData.discountDays2Plus,
        discountDays5Plus: formData.discountDays5Plus,
        discountDays14Plus: formData.discountDays14Plus,

        spaceDescription: formData.spaceDescription,
        guestAccessDescription: formData.guestAccessDescription,
        neighborhoodDescription: formData.neighborhoodDescription,
        highlights: formData.highlights,

        amenityIds: formData.amenityIds,
      };

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Erreur de mise à jour");
      }

      setHasChanges(false);
      toast.success("Modifications enregistrées");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const totalImages = existingImages.length + newImages.length;

  return (
    <>
      {apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl 2xl:max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href={`/listings/${listing.id}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span className="hidden sm:inline">Retour à l&apos;annonce</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {formData.title || "Modifier l&apos;annonce"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Modifications non enregistrées
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar navigation */}
            <aside className="lg:w-64 shrink-0">
              <nav className="lg:sticky lg:top-24 space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                      activeSection === section.key
                        ? "bg-gray-900 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {section.icon}
                    {section.label}
                    {section.key === "photos" && totalImages > 0 && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        activeSection === section.key ? "bg-white/20" : "bg-gray-200"
                      }`}>
                        {totalImages}
                      </span>
                    )}
                  </button>
                ))}

                {/* Preview link */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Link
                    href={`/listings/${listing.id}`}
                    target="_blank"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Voir l&apos;annonce
                  </Link>
                </div>
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Section: Info */}
                {activeSection === "info" && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Informations générales</h2>
                      <p className="mt-1 text-sm text-gray-500">Modifiez le titre, la description et le type de votre espace</p>
                    </div>

                    {/* Type */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Type d&apos;espace</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {LISTING_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                              formData.type === type.value
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                      {formData.type === "OTHER" && (
                        <input
                          type="text"
                          value={formData.customType}
                          onChange={(e) => setFormData((prev) => ({ ...prev, customType: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Précisez le type d'espace..."
                        />
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Titre de l&apos;annonce
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        maxLength={120}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Un titre accrocheur pour votre espace"
                      />
                      <p className="text-right text-xs text-gray-400">{formData.title.length}/120</p>
                    </div>

                    {/* Points forts */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Points forts (2-3 maximum)
                      </label>
                      <p className="text-xs text-gray-500">
                        Sélectionnez ce qui rend votre espace unique
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          "Vue exceptionnelle",
                          "Proche transports",
                          "Très lumineux",
                          "Calme",
                          "Centre-ville",
                          "Parking inclus",
                          "WiFi rapide",
                          "Équipement pro",
                          "Récemment rénové",
                        ].map((highlight) => {
                          const isSelected = formData.highlights?.includes(highlight);
                          return (
                            <button
                              key={highlight}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  highlights: isSelected
                                    ? (prev.highlights || []).filter((h) => h !== highlight)
                                    : (prev.highlights || []).length < 3
                                    ? [...(prev.highlights || []), highlight]
                                    : prev.highlights || [],
                                }));
                              }}
                              className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                                isSelected
                                  ? "border-gray-900 bg-gray-50"
                                  : "border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              {highlight}
                            </button>
                          );
                        })}
                      </div>
                      {(formData.highlights?.length || 0) > 0 && (
                        <p className="text-xs text-gray-500">
                          {formData.highlights?.length}/3 sélectionné{(formData.highlights?.length || 0) > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Description de l'espace */}
                    <div className="space-y-2">
                      <label htmlFor="spaceDescription" className="block text-sm font-medium text-gray-700">
                        L&apos;espace
                      </label>
                      <textarea
                        id="spaceDescription"
                        value={formData.spaceDescription}
                        onChange={(e) => setFormData((prev) => ({ ...prev, spaceDescription: e.target.value }))}
                        rows={4}
                        maxLength={1000}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Décrivez votre espace : ce qui le rend unique, les équipements disponibles, l'ambiance..."
                      />
                      <p className="text-right text-xs text-gray-400">{formData.spaceDescription?.length || 0}/1000</p>
                    </div>

                    {/* Accès voyageurs */}
                    <div className="space-y-2">
                      <label htmlFor="guestAccessDescription" className="block text-sm font-medium text-gray-700">
                        Accès voyageurs (optionnel)
                      </label>
                      <textarea
                        id="guestAccessDescription"
                        value={formData.guestAccessDescription}
                        onChange={(e) => setFormData((prev) => ({ ...prev, guestAccessDescription: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Comment les voyageurs accèdent-ils à l'espace ? Y a-t-il des zones partagées ?"
                      />
                      <p className="text-right text-xs text-gray-400">{formData.guestAccessDescription?.length || 0}/500</p>
                    </div>

                    {/* Le quartier */}
                    <div className="space-y-2">
                      <label htmlFor="neighborhoodDescription" className="block text-sm font-medium text-gray-700">
                        Le quartier (optionnel)
                      </label>
                      <textarea
                        id="neighborhoodDescription"
                        value={formData.neighborhoodDescription}
                        onChange={(e) => setFormData((prev) => ({ ...prev, neighborhoodDescription: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Décrivez le quartier : ambiance, commerces, restaurants, attractions..."
                      />
                      <p className="text-right text-xs text-gray-400">{formData.neighborhoodDescription?.length || 0}/500</p>
                    </div>

                    {/* Description principale (fallback) */}
                    <div className="space-y-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description générale
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={2000}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Toute autre information importante..."
                      />
                      <p className="text-right text-xs text-gray-400">{formData.description.length}/2000</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Caractéristiques de l&apos;espace
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SPACE_FEATURES.map((feature) => {
                          const isSelected = formData.spaceFeatures.includes(feature.value);
                          return (
                            <button
                              key={feature.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  spaceFeatures: isSelected
                                    ? prev.spaceFeatures.filter((f) => f !== feature.value)
                                    : [...prev.spaceFeatures, feature.value],
                                }));
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
                                isSelected
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <span>{feature.icon}</span>
                              {feature.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Amenities Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Équipements disponibles
                      </label>
                      <AmenitiesSelector
                        selectedIds={formData.amenityIds || []}
                        onChange={(ids) => setFormData((prev) => ({ ...prev, amenityIds: ids }))}
                      />
                    </div>

                    {/* Instant booking */}
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">Réservation instantanée</p>
                        <p className="text-sm text-gray-500">Les voyageurs peuvent réserver sans attendre votre approbation</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, isInstantBook: !prev.isInstantBook }))}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          formData.isInstantBook ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            formData.isInstantBook ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Section: Location */}
                {activeSection === "location" && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Localisation</h2>
                      <p className="mt-1 text-sm text-gray-500">Modifiez l&apos;adresse et l&apos;emplacement de votre espace</p>
                    </div>

                    {/* Country */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Pays</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["France", "Canada"] as const).map((country) => (
                          <button
                            key={country}
                            type="button"
                            onClick={() => setFormData((prev) => ({
                              ...prev,
                              country,
                              currency: country === "Canada" ? "CAD" : "EUR",
                              province: "",
                              regionFR: "",
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

                    {/* Address fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Adresse complète</label>
                        <input
                          type="text"
                          value={formData.addressLine1}
                          onChange={(e) => setFormData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="123 rue de la Paix"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Ville</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Paris"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Code postal</label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="75001"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {formData.country === "France" ? "Région" : "Province"}
                        </label>
                        <select
                          value={formData.country === "France" ? formData.regionFR : formData.province}
                          onChange={(e) => {
                            if (formData.country === "France") {
                              setFormData((prev) => ({ ...prev, regionFR: e.target.value }));
                            } else {
                              setFormData((prev) => ({ ...prev, province: e.target.value }));
                            }
                          }}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="">Sélectionner...</option>
                          {(formData.country === "France" ? REGIONS_FR : PROVINCES_CA).map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Map */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Position sur la carte
                      </label>
                      <div className="relative">
                        <div
                          id="edit-map"
                          className="h-[350px] w-full rounded-xl border border-gray-200 bg-gray-100 overflow-hidden"
                        >
                          {!mapsReady && (
                            <div className="flex h-full items-center justify-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
                            </div>
                          )}
                        </div>
                        {mapsReady && (
                          <div className="absolute right-3 top-3 flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const mapEl = document.getElementById("edit-map");
                                if (mapEl && (mapEl as MapElementWithGmap).__gmap) {
                                  (mapEl as MapElementWithGmap).__gmap!.setZoom((mapEl as MapElementWithGmap).__gmap!.getZoom() + 1);
                                }
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const mapEl = document.getElementById("edit-map");
                                if (mapEl && (mapEl as MapElementWithGmap).__gmap) {
                                  (mapEl as MapElementWithGmap).__gmap!.setZoom((mapEl as MapElementWithGmap).__gmap!.getZoom() - 1);
                                }
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Glissez le marqueur pour ajuster l&apos;emplacement exact. L&apos;adresse exacte ne sera visible que par les voyageurs ayant confirmé une réservation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Section: Capacity */}
                {activeSection === "capacity" && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Capacité et équipements</h2>
                      <p className="mt-1 text-sm text-gray-500">Définissez la capacité de votre espace</p>
                    </div>

                    {/* Dynamic capacity fields based on listing type */}
                    {CAPACITY_CONFIG[formData.type] && (
                      <div className="space-y-6">
                        {CAPACITY_CONFIG[formData.type].fields.map((field) => {
                          const label = CAPACITY_CONFIG[formData.type].labels[field];
                          const fieldKey = field as keyof typeof formData;
                          const value = (formData[fieldKey] as number | null) || 1;

                          return (
                            <div key={field} className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                              <div>
                                <p className="font-medium text-gray-900">{label}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.max(1, value - 1);
                                    setFormData((prev) => ({ ...prev, [field]: newValue }));
                                  }}
                                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 transition-colors"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-12 text-center text-lg font-semibold">{value}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.min(50, value + 1);
                                    setFormData((prev) => ({ ...prev, [field]: newValue }));
                                  }}
                                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 transition-colors"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* === CHAMPS SPÉCIFIQUES APARTMENT/HOUSE === */}
                    {(formData.type === "APARTMENT" || formData.type === "HOUSE") && (
                      <>
                        {/* Nombre de chambres */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nombre de chambres</label>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, bedrooms: Math.max(0, (prev.bedrooms || 0) - 1) }))}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            <span className="w-20 text-center text-lg font-medium">
                              {formData.bedrooms || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, bedrooms: Math.min(20, (prev.bedrooms || 0) + 1) }))}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Configuration des lits */}
                        {(formData.bedrooms || 0) > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Configuration des lits</label>
                            <BedConfiguration
                              value={(formData.bedConfiguration as unknown as BedConfig[]) || []}
                              onChange={(config) => setFormData((prev) => ({ ...prev, bedConfiguration: config as unknown as Record<string, unknown> | null }))}
                              bedrooms={formData.bedrooms || 1}
                            />
                          </div>
                        )}

                        {/* Salles de bain */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Salles de bain complètes</label>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, bathroomsFull: Math.max(0, (prev.bathroomsFull || 0) - 1) }))}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                              >
                                <Minus className="h-5 w-5" />
                              </button>
                              <span className="w-12 text-center text-lg font-medium">
                                {formData.bathroomsFull || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, bathroomsFull: Math.min(10, (prev.bathroomsFull || 0) + 1) }))}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Salles d&apos;eau</label>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, bathroomsHalf: Math.max(0, (prev.bathroomsHalf || 0) - 1) }))}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                              >
                                <Minus className="h-5 w-5" />
                              </button>
                              <span className="w-12 text-center text-lg font-medium">
                                {formData.bathroomsHalf || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, bathroomsHalf: Math.min(10, (prev.bathroomsHalf || 0) + 1) }))}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Type d'accès */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Type d&apos;accès</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: "ENTIRE_PLACE", label: "Logement entier" },
                              { value: "PRIVATE_ROOM", label: "Chambre privée" },
                              { value: "SHARED_ROOM", label: "Chambre partagée" },
                              { value: "SHARED_SPACE", label: "Espace partagé" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, spaceType: option.value }))}
                                className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                                  formData.spaceType === option.value
                                    ? "border-gray-900 bg-gray-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* === CHAMPS SPÉCIFIQUES HOUSE === */}
                    {formData.type === "HOUSE" && (
                      <>
                        {/* Nombre d'étages */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nombre d&apos;étages</label>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, floors: Math.max(1, (prev.floors || 1) - 1) }))}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            <span className="w-20 text-center text-lg font-medium">
                              {formData.floors || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, floors: Math.min(10, (prev.floors || 1) + 1) }))}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Jardin */}
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, hasGarden: !prev.hasGarden }))}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                              formData.hasGarden ? "border-gray-900 bg-gray-50" : "border-gray-200"
                            }`}
                          >
                            <span className="font-medium text-gray-900">Jardin</span>
                            <div className={`h-6 w-11 rounded-full transition-colors ${formData.hasGarden ? "bg-gray-900" : "bg-gray-200"}`}>
                              <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.hasGarden ? "translate-x-5" : "translate-x-0.5"}`} />
                            </div>
                          </button>
                          {formData.hasGarden && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Surface du jardin (m²)</label>
                              <input
                                type="number"
                                value={formData.gardenSize || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, gardenSize: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="Ex: 100"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              />
                            </div>
                          )}
                        </div>

                        {/* Piscine */}
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, hasPool: !prev.hasPool }))}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                              formData.hasPool ? "border-gray-900 bg-gray-50" : "border-gray-200"
                            }`}
                          >
                            <span className="font-medium text-gray-900">Piscine</span>
                            <div className={`h-6 w-11 rounded-full transition-colors ${formData.hasPool ? "bg-gray-900" : "bg-gray-200"}`}>
                              <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.hasPool ? "translate-x-5" : "translate-x-0.5"}`} />
                            </div>
                          </button>
                          {formData.hasPool && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Type de piscine</label>
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    { value: "indoor", label: "Intérieure" },
                                    { value: "outdoor", label: "Extérieure" },
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => setFormData((prev) => ({ ...prev, poolType: option.value }))}
                                      className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                                        formData.poolType === option.value
                                          ? "border-gray-900 bg-gray-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, poolHeated: !prev.poolHeated }))}
                                className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                                  formData.poolHeated ? "border-gray-900 bg-gray-50" : "border-gray-200"
                                }`}
                              >
                                <span className="font-medium text-gray-900">Piscine chauffée</span>
                                <div className={`h-6 w-11 rounded-full transition-colors ${formData.poolHeated ? "bg-gray-900" : "bg-gray-200"}`}>
                                  <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.poolHeated ? "translate-x-5" : "translate-x-0.5"}`} />
                                </div>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Terrasse */}
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, hasTerrace: !prev.hasTerrace }))}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                              formData.hasTerrace ? "border-gray-900 bg-gray-50" : "border-gray-200"
                            }`}
                          >
                            <span className="font-medium text-gray-900">Terrasse</span>
                            <div className={`h-6 w-11 rounded-full transition-colors ${formData.hasTerrace ? "bg-gray-900" : "bg-gray-200"}`}>
                              <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.hasTerrace ? "translate-x-5" : "translate-x-0.5"}`} />
                            </div>
                          </button>
                          {formData.hasTerrace && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Surface de la terrasse (m²)</label>
                              <input
                                type="number"
                                value={formData.terraceSize || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, terraceSize: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="Ex: 30"
                                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* === CHAMPS SPÉCIFIQUES STUDIO === */}
                    {(formData.type === "STUDIO" || formData.type === "RECORDING_STUDIO") && (
                      <>
                        {/* Type de studio */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Type de studio</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: "photo", label: "Photo" },
                              { value: "video", label: "Vidéo" },
                              { value: "music", label: "Musique" },
                              { value: "podcast", label: "Podcast" },
                              { value: "dance", label: "Danse" },
                              { value: "art", label: "Art" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, studioType: option.value }))}
                                className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                                  formData.studioType === option.value
                                    ? "border-gray-900 bg-gray-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hauteur sous plafond */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Hauteur sous plafond (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.studioHeight || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, studioHeight: e.target.value ? parseFloat(e.target.value) : null }))}
                            placeholder="Ex: 3.5"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>

                        {/* Fond vert */}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hasGreenScreen: !prev.hasGreenScreen }))}
                          className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                            formData.hasGreenScreen ? "border-gray-900 bg-gray-50" : "border-gray-200"
                          }`}
                        >
                          <span className="font-medium text-gray-900">Fond vert (green screen)</span>
                          <div className={`h-6 w-11 rounded-full transition-colors ${formData.hasGreenScreen ? "bg-gray-900" : "bg-gray-200"}`}>
                            <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.hasGreenScreen ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </button>

                        {/* Isolation phonique */}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hasSoundproofing: !prev.hasSoundproofing }))}
                          className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                            formData.hasSoundproofing ? "border-gray-900 bg-gray-50" : "border-gray-200"
                          }`}
                        >
                          <span className="font-medium text-gray-900">Isolation phonique</span>
                          <div className={`h-6 w-11 rounded-full transition-colors ${formData.hasSoundproofing ? "bg-gray-900" : "bg-gray-200"}`}>
                            <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.hasSoundproofing ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </button>
                      </>
                    )}

                    {/* === CHAMPS SPÉCIFIQUES PARKING/GARAGE === */}
                    {(formData.type === "PARKING" || formData.type === "GARAGE") && (
                      <>
                        {/* Type de parking */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Type de parking</label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: "outdoor", label: "Extérieur" },
                              { value: "indoor", label: "Intérieur" },
                              { value: "underground", label: "Souterrain" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, parkingType: option.value }))}
                                className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                                  formData.parkingType === option.value
                                    ? "border-gray-900 bg-gray-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Couvert */}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, parkingCovered: !prev.parkingCovered }))}
                          className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                            formData.parkingCovered ? "border-gray-900 bg-gray-50" : "border-gray-200"
                          }`}
                        >
                          <span className="font-medium text-gray-900">Parking couvert</span>
                          <div className={`h-6 w-11 rounded-full transition-colors ${formData.parkingCovered ? "bg-gray-900" : "bg-gray-200"}`}>
                            <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.parkingCovered ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </button>

                        {/* Sécurisé */}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, parkingSecured: !prev.parkingSecured }))}
                          className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                            formData.parkingSecured ? "border-gray-900 bg-gray-50" : "border-gray-200"
                          }`}
                        >
                          <span className="font-medium text-gray-900">Parking sécurisé</span>
                          <div className={`h-6 w-11 rounded-full transition-colors ${formData.parkingSecured ? "bg-gray-900" : "bg-gray-200"}`}>
                            <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.parkingSecured ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </button>

                        {/* Dimensions */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Dimensions (mètres)</label>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500">Longueur</label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.parkingLength || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, parkingLength: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="5.0"
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500">Largeur</label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.parkingWidth || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, parkingWidth: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="2.5"
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500">Hauteur</label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.parkingHeight || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, parkingHeight: e.target.value ? parseFloat(e.target.value) : null }))}
                                placeholder="2.0"
                                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Borne électrique */}
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, hasEVCharger: !prev.hasEVCharger }))}
                          className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                            formData.hasEVCharger ? "border-gray-900 bg-gray-50" : "border-gray-200"
                          }`}
                        >
                          <span className="font-medium text-gray-900">Borne de recharge électrique</span>
                          <div className={`h-6 w-11 rounded-full transition-colors ${formData.hasEVCharger ? "bg-gray-900" : "bg-gray-200"}`}>
                            <div className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${formData.hasEVCharger ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                        </button>
                      </>
                    )}

                    {/* Min/Max nights */}
                    {(formData.pricingMode === "DAILY" || formData.pricingMode === "BOTH") && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Nuits minimum</label>
                          <input
                            type="number"
                            min={1}
                            value={formData.minNights || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, minNights: parseInt(e.target.value) || null }))}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            placeholder="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Nuits maximum</label>
                          <input
                            type="number"
                            min={1}
                            value={formData.maxNights || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, maxNights: parseInt(e.target.value) || null }))}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                            placeholder="30"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Section: Photos */}
                {activeSection === "photos" && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Gérez les photos de votre annonce. La première image sera la couverture.
                      </p>
                    </div>

                    {/* Existing images */}
                    {existingImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Photos actuelles ({existingImages.length})
                          </label>
                          <span className="text-xs text-gray-500">Glissez pour réorganiser</span>
                        </div>
                        <div ref={imagesParent} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {existingImages.map((img, i) => {
                            const isCover = i === 0;
                            const isDragging = i === dragExistingIndex;
                            return (
                              <div
                                key={img.id}
                                className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl border-2 bg-gray-100 transition-all ${
                                  isDragging ? "scale-105 ring-2 ring-gray-900" : "border-gray-200"
                                } ${isCover ? "ring-2 ring-amber-400" : ""}`}
                                draggable
                                onDragStart={(e) => handleExistingDragStart(e, i)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleExistingDrop(i)}
                                onDragEnd={() => setDragExistingIndex(null)}
                              >
                                <Image
                                  src={img.url}
                                  alt={`Image ${i + 1} de l'annonce`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50vw, 25vw"
                                />
                                {isCover && (
                                  <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                                    Couverture
                                  </span>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setCover(img.id)}
                                      className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-900"
                                    >
                                      Couverture
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteExistingImage(img.id)}
                                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black"
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

                    {/* Dropzone for new images */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Ajouter des photos
                      </label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                          dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300"
                        }`}
                      >
                        <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-gray-600">Glissez vos photos ici</p>
                        <p className="mt-1 text-sm text-gray-400">ou</p>
                        <label className="mt-2 cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                          Parcourir
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => addFiles(Array.from(e.target.files || []))}
                            className="hidden"
                          />
                        </label>
                        <p className="mt-3 text-xs text-gray-400">
                          JPG, PNG ou WebP · Max {MAX_SIZE_MB} Mo · {totalImages}/{MAX_FILES} photos
                        </p>
                      </div>
                    </div>

                    {/* New images preview */}
                    {newImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">
                            Nouvelles photos ({newImages.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                              setNewImages([]);
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Tout supprimer
                          </button>
                        </div>
                        <div ref={newImagesParent} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {newImages.map((img, i) => (
                            <div
                              key={img.id}
                              className="group relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-100"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview */}
                              <img
                                src={img.previewUrl}
                                alt={`Nouvelle image ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => openCropper(i)}
                                  className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-gray-900"
                                >
                                  Recadrer
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewImage(i)}
                                className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <span className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
                                Nouveau
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={uploadNewImages}
                          disabled={uploading}
                          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:opacity-50 transition-all"
                        >
                          {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Upload en cours...
                            </span>
                          ) : (
                            `Uploader ${newImages.length} photo${newImages.length > 1 ? "s" : ""}`
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Section: Pricing */}
                {activeSection === "pricing" && (
                  <div className="p-6 sm:p-8 space-y-8">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Tarification</h2>
                      <p className="mt-1 text-sm text-gray-500">Définissez vos prix et réductions</p>
                    </div>

                    {/* Pricing mode */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Mode de tarification</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { value: "DAILY", label: "Par jour" },
                          { value: "HOURLY", label: "À l'heure" },
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

                    {/* Daily price */}
                    {(formData.pricingMode === "DAILY" || formData.pricingMode === "BOTH") && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Prix par jour ({formData.currency})
                        </label>
                        <div className="relative">
                          <input
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

                    {/* Hourly price */}
                    {(formData.pricingMode === "HOURLY" || formData.pricingMode === "BOTH") && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Prix par heure ({formData.currency})
                        </label>
                        <div className="relative">
                          <input
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

                    {/* Discounts */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Réductions (optionnel)
                      </label>

                      {/* Hourly discounts */}
                      {(formData.pricingMode === "HOURLY" || formData.pricingMode === "BOTH") && (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-500 uppercase font-medium">Réductions horaires</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                              <span className="text-sm text-gray-700">3+ heures</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={formData.discountHours3Plus || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, discountHours3Plus: parseInt(e.target.value) || null }))}
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                              <span className="text-sm text-gray-700">6+ heures</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={formData.discountHours6Plus || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, discountHours6Plus: parseInt(e.target.value) || null }))}
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Daily discounts */}
                      {(formData.pricingMode === "DAILY" || formData.pricingMode === "BOTH") && (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-500 uppercase font-medium">Réductions journalières</p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                              <span className="text-sm text-gray-700">3+ jours</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={formData.discountDays3Plus || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, discountDays3Plus: parseInt(e.target.value) || null }))}
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                              <span className="text-sm text-gray-700">Semaine</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={60}
                                  value={formData.discountWeekly || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, discountWeekly: parseInt(e.target.value) || null }))}
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                              <span className="text-sm text-gray-700">Mois</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={70}
                                  value={formData.discountMonthly || ""}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, discountMonthly: parseInt(e.target.value) || null }))}
                                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Currency display */}
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Devise</p>
                          <p className="text-sm text-gray-500">Basée sur le pays de l&apos;annonce</p>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          {formData.currency === "EUR" ? "€ Euro" : "$ CAD"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
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
