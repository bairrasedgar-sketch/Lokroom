"use client";

import { useState, useCallback, useEffect, useMemo, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Script from "next/script";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getCroppedImage, type PixelCrop } from "@/lib/cropImage";

// ============================================================================
// GOOGLE MAPS TYPES (simplified for TypeScript compatibility)
// ============================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
type GoogleGeocoderResult = {
  formatted_address?: string;
  address_components?: Array<{ types: string[]; long_name: string }>;
};

type GoogleGeocoder = {
  geocode: (
    request: { location: { lat: number; lng: number } },
    callback: (results: GoogleGeocoderResult[] | null, status: string) => void
  ) => void;
};

type GoogleMapsAPI = {
  maps: {
    Map: new (container: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    Marker: new (options: Record<string, unknown>) => GoogleMarker;
    Geocoder: new () => GoogleGeocoder;
    Size: new (width: number, height: number) => unknown;
    Point: new (x: number, y: number) => unknown;
    Animation: { DROP: unknown };
    event: {
      clearInstanceListeners: (instance: unknown) => void;
      trigger: (instance: unknown, event: string) => void;
    };
    places: {
      Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => GoogleAutocomplete;
      AutocompleteService: new () => GoogleAutocompleteService;
      PlacesServiceStatus: { OK: string };
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

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: { input: string; types: string[]; componentRestrictions: { country: string | string[] } },
    callback: (predictions: Array<{ place_id: string; description: string; structured_formatting?: { main_text?: string; secondary_text?: string } }> | null, status: string) => void
  ) => void;
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

type Step =
  | "type"
  | "map"
  | "location"
  | "confirmLocation"
  | "details"
  | "features"
  | "photos"
  | "description"
  | "pricing"
  | "discounts"
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
  additionalTypes: ListingType[];
  customType: string;
  country: "France" | "Canada";
  city: string;
  addressFull: string;
  addressLine1: string;
  postalCode: string;
  province: string;
  regionFR: string;
  lat: number | null;
  lng: number | null;
  latPublic: number | null;
  lngPublic: number | null;
  maxGuests: number;
  beds: number | null;
  desks: number | null;
  parkings: number | null;
  bathrooms: number | null;
  spaceFeatures: string[];
  title: string;
  description: string;
  pricingMode: PricingMode;
  price: number;
  hourlyPrice: number | null;
  currency: "EUR" | "CAD";
  isInstantBook: boolean;
  minNights: number | null;
  maxNights: number | null;
  discountHours3Plus: number | null;
  discountHours6Plus: number | null;
  discountDays3Plus: number | null;
  discountWeekly: number | null;
  discountMonthly: number | null;
};

// ============================================================================
// CONFIG
// ============================================================================

const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

// SVG Icons for listing types
const ListingTypeIcons: Record<ListingType, React.ReactNode> = {
  APARTMENT: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  HOUSE: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  ROOM: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  STUDIO: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  OFFICE: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  COWORKING: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  MEETING_ROOM: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
    </svg>
  ),
  PARKING: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  GARAGE: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  ),
  STORAGE: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  EVENT_SPACE: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  RECORDING_STUDIO: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  OTHER: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
};

const LISTING_TYPES: { value: ListingType; label: string; description: string }[] = [
  { value: "APARTMENT", label: "Appartement", description: "Un appartement entier ou une partie" },
  { value: "HOUSE", label: "Maison", description: "Une maison entière ou des chambres" },
  { value: "ROOM", label: "Chambre", description: "Une chambre privée chez un hôte" },
  { value: "STUDIO", label: "Studio", description: "Un studio de création ou artistique" },
  { value: "OFFICE", label: "Bureau", description: "Un espace de travail privé" },
  { value: "COWORKING", label: "Coworking", description: "Un espace de travail partagé" },
  { value: "MEETING_ROOM", label: "Salle de réunion", description: "Pour vos réunions et présentations" },
  { value: "RECORDING_STUDIO", label: "Studios", description: "Pour la musique et les podcasts" },
  { value: "EVENT_SPACE", label: "Espace événementiel", description: "Pour vos événements et fêtes" },
  { value: "PARKING", label: "Parking", description: "Une place de stationnement" },
  { value: "GARAGE", label: "Garage", description: "Un garage ou box fermé" },
  { value: "STORAGE", label: "Stockage", description: "Un espace de rangement" },
  { value: "OTHER", label: "Autre", description: "Un autre type d'espace" },
];

const STEPS: { key: Step; title: string; subtitle: string }[] = [
  { key: "type", title: "Type d'espace", subtitle: "Quel type d'espace proposez-vous ?" },
  { key: "map", title: "Localisation", subtitle: "Où se trouve votre espace ?" },
  { key: "location", title: "Adresse", subtitle: "Complétez l'adresse de votre espace" },
  { key: "confirmLocation", title: "Confirmation", subtitle: "Vérifiez l'emplacement sur la carte" },
  { key: "details", title: "Capacité", subtitle: "Décrivez les détails de votre espace" },
  { key: "features", title: "Caractéristiques", subtitle: "Qu'est-ce qui rend votre espace unique ?" },
  { key: "photos", title: "Photos", subtitle: "Ajoutez des photos de votre espace" },
  { key: "description", title: "Description", subtitle: "Donnez envie aux voyageurs" },
  { key: "pricing", title: "Tarification", subtitle: "Définissez vos prix" },
  { key: "discounts", title: "Réductions", subtitle: "Proposez des réductions attractives" },
  { key: "review", title: "Vérification", subtitle: "Vérifiez et publiez votre annonce" },
];

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Prix recommandés par type d'espace et zone (ville/campagne)
// Ces prix sont des moyennes pour une plateforme débutante, volontairement accessibles
type PriceRecommendation = {
  daily: { min: number; max: number };
  hourly: { min: number; max: number };
};

const PRICE_RECOMMENDATIONS: Record<"urban" | "rural", Record<ListingType, PriceRecommendation>> = {
  urban: {
    APARTMENT: { daily: { min: 60, max: 120 }, hourly: { min: 15, max: 30 } },
    HOUSE: { daily: { min: 80, max: 150 }, hourly: { min: 20, max: 40 } },
    ROOM: { daily: { min: 30, max: 60 }, hourly: { min: 8, max: 15 } },
    STUDIO: { daily: { min: 40, max: 80 }, hourly: { min: 10, max: 20 } },
    OFFICE: { daily: { min: 50, max: 100 }, hourly: { min: 12, max: 25 } },
    COWORKING: { daily: { min: 20, max: 40 }, hourly: { min: 5, max: 12 } },
    MEETING_ROOM: { daily: { min: 80, max: 150 }, hourly: { min: 20, max: 40 } },
    RECORDING_STUDIO: { daily: { min: 100, max: 200 }, hourly: { min: 25, max: 50 } },
    EVENT_SPACE: { daily: { min: 150, max: 300 }, hourly: { min: 35, max: 70 } },
    PARKING: { daily: { min: 10, max: 25 }, hourly: { min: 2, max: 5 } },
    GARAGE: { daily: { min: 15, max: 35 }, hourly: { min: 3, max: 8 } },
    STORAGE: { daily: { min: 10, max: 30 }, hourly: { min: 2, max: 6 } },
    OTHER: { daily: { min: 30, max: 80 }, hourly: { min: 8, max: 20 } },
  },
  rural: {
    APARTMENT: { daily: { min: 40, max: 80 }, hourly: { min: 10, max: 20 } },
    HOUSE: { daily: { min: 50, max: 100 }, hourly: { min: 12, max: 25 } },
    ROOM: { daily: { min: 20, max: 40 }, hourly: { min: 5, max: 10 } },
    STUDIO: { daily: { min: 25, max: 50 }, hourly: { min: 6, max: 12 } },
    OFFICE: { daily: { min: 30, max: 60 }, hourly: { min: 8, max: 15 } },
    COWORKING: { daily: { min: 12, max: 25 }, hourly: { min: 3, max: 8 } },
    MEETING_ROOM: { daily: { min: 50, max: 100 }, hourly: { min: 12, max: 25 } },
    RECORDING_STUDIO: { daily: { min: 60, max: 120 }, hourly: { min: 15, max: 30 } },
    EVENT_SPACE: { daily: { min: 80, max: 180 }, hourly: { min: 20, max: 45 } },
    PARKING: { daily: { min: 5, max: 15 }, hourly: { min: 1, max: 3 } },
    GARAGE: { daily: { min: 8, max: 20 }, hourly: { min: 2, max: 5 } },
    STORAGE: { daily: { min: 5, max: 15 }, hourly: { min: 1, max: 4 } },
    OTHER: { daily: { min: 20, max: 50 }, hourly: { min: 5, max: 12 } },
  },
};

// Liste des grandes villes françaises et canadiennes
const MAJOR_CITIES = [
  // France
  "paris", "marseille", "lyon", "toulouse", "nice", "nantes", "strasbourg", "montpellier",
  "bordeaux", "lille", "rennes", "reims", "toulon", "grenoble", "dijon", "angers", "nîmes",
  // Canada
  "montreal", "montréal", "toronto", "vancouver", "calgary", "ottawa", "edmonton", "québec",
  "quebec", "winnipeg", "hamilton", "kitchener", "london", "victoria", "halifax",
];

function isUrbanArea(city: string): boolean {
  const cityLower = city.toLowerCase().trim();
  return MAJOR_CITIES.some(majorCity => cityLower.includes(majorCity) || majorCity.includes(cityLower));
}

function getPriceRecommendation(type: ListingType | null, city: string): PriceRecommendation | null {
  if (!type) return null;
  const zone = isUrbanArea(city) ? "urban" : "rural";
  return PRICE_RECOMMENDATIONS[zone][type];
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Provinces canadiennes
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
  { value: "NT", label: "Territoires du Nord-Ouest" },
  { value: "YT", label: "Yukon" },
  { value: "NU", label: "Nunavut" },
];

// Régions françaises
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
  { value: "GUA", label: "Guadeloupe" },
  { value: "MTQ", label: "Martinique" },
  { value: "GUF", label: "Guyane" },
  { value: "REU", label: "La Réunion" },
  { value: "MAY", label: "Mayotte" },
];

// Caractéristiques d'espace disponibles
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

// Types d'espace valides pour customType
const VALID_CUSTOM_TYPES = [
  "atelier", "cave", "grenier", "loft", "penthouse", "duplex", "triplex",
  "mezzanine", "terrasse", "rooftop", "jardin", "piscine", "spa", "gym",
  "salle de sport", "cuisine", "laboratoire", "showroom", "galerie",
  "espace photo", "salle de danse", "salle de yoga", "local commercial",
  "entrepôt", "hangar", "box", "container", "mobile home", "tiny house",
  "cabane", "yourte", "tipi", "bateau", "péniche", "camping-car",
];

// Labels des types d'espace pour les titres dynamiques
const LISTING_TYPE_LOCATION_LABELS: Record<ListingType, string> = {
  APARTMENT: "votre appartement",
  HOUSE: "votre maison",
  ROOM: "votre chambre",
  STUDIO: "votre studio",
  OFFICE: "votre bureau",
  COWORKING: "votre espace de coworking",
  MEETING_ROOM: "votre salle de réunion",
  PARKING: "votre parking",
  GARAGE: "votre garage",
  STORAGE: "votre espace de stockage",
  EVENT_SPACE: "votre espace événementiel",
  RECORDING_STUDIO: "votre studio",
  OTHER: "votre espace",
};

// Configuration des capacités par type d'espace
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
  const { data: session, status, update: updateSession } = useSession();

  // Vérifier si l'utilisateur est hôte
  type SessionUser = { isHost?: boolean; role?: string };
  const sessionUser = session?.user as SessionUser | undefined;
  const isHost = sessionUser?.isHost || sessionUser?.role === "HOST" || sessionUser?.role === "BOTH";

  // État pour vérification de permission côté serveur
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Vérifier les permissions côté serveur (plus fiable que le token client)
  useEffect(() => {
    // Ne pas re-vérifier si déjà fait
    if (permissionChecked) return;

    async function checkHostPermission() {
      if (status !== "authenticated") return;

      try {
        // Vérifier côté serveur si l'utilisateur est vraiment hôte
        const res = await fetch("/api/host/activate", { method: "POST" });
        const data = await res.json();

        if (res.ok && (data.success || data.alreadyHost)) {
          setHasPermission(true);
          setPermissionChecked(true);
          // Rafraîchir la session pour mettre à jour le statut hôte côté client
          await updateSession();
        } else {
          toast.error("Tu dois être hôte pour créer une annonce");
          router.push("/become-host");
        }
      } catch {
        // En cas d'erreur, utiliser la vérification locale
        if (isHost) {
          setHasPermission(true);
        } else {
          toast.error("Tu dois être hôte pour créer une annonce");
          router.push("/become-host");
        }
        setPermissionChecked(true);
      }
    }

    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/listings/new");
      return;
    }

    // Si la session dit déjà qu'on est hôte, on peut continuer
    if (isHost) {
      setHasPermission(true);
      setPermissionChecked(true);
    } else {
      // Sinon, vérifier côté serveur (la session peut être en retard)
      checkHostPermission();
    }
  }, [status, isHost, router, updateSession, permissionChecked]);

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>("type");

  // Form data
  const [formData, setFormData] = useState<FormData>({
    type: null,
    additionalTypes: [],
    customType: "",
    country: "France",
    city: "",
    addressFull: "",
    addressLine1: "",
    postalCode: "",
    province: "",
    regionFR: "",
    lat: null,
    lng: null,
    latPublic: null,
    lngPublic: null,
    maxGuests: 1,
    beds: null,
    desks: null,
    parkings: null,
    bathrooms: null,
    spaceFeatures: [],
    title: "",
    description: "",
    pricingMode: "DAILY",
    price: 0,
    hourlyPrice: null,
    currency: "EUR",
    isInstantBook: false,
    minNights: null,
    maxNights: null,
    discountHours3Plus: null,
    discountHours6Plus: null,
    discountDays3Plus: null,
    discountWeekly: null,
    discountMonthly: null,
  });

  // City suggestions for autocomplete
  type CitySuggestion = {
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  };
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Draft choice modal - supports multiple drafts
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState<Array<{ id: string; formData: FormData; currentStep: Step; lastSaved: string; createdAt: string }>>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

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

  // Identity verification
  const [identityStatus, setIdentityStatus] = useState<"UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [loadingIdentity, setLoadingIdentity] = useState(false);

  // Draft management - supports multiple drafts
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  // Clé unique par utilisateur pour isoler les brouillons
  const userEmail = session?.user?.email || "";
  const DRAFTS_KEY = userEmail ? `lokroom_listing_drafts_${userEmail}` : "";
  const DRAFT_EXPIRY_DAYS = 90;

  // Auto-animate
  const [filesParent] = useAutoAnimate<HTMLDivElement>({ duration: 300 });
  const [dragFileIndex, setDragFileIndex] = useState<number | null>(null);

  // Currency from cookie
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const cookieCurrency = (m?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    setFormData((prev) => ({ ...prev, currency: cookieCurrency }));
  }, []);

  // Load identity status
  useEffect(() => {
    async function checkIdentity() {
      try {
        const res = await fetch("/api/account/security/status");
        if (res.ok) {
          const data = await res.json();
          setIdentityStatus(data.identityStatus || "UNVERIFIED");
        }
      } catch (e) {
        console.error("Error checking identity status:", e);
      }
    }
    if (status === "authenticated") {
      checkIdentity();
    }
  }, [status]);

  // Load drafts from localStorage - show modal if drafts exist
  useEffect(() => {
    // Attendre d'avoir l'email de l'utilisateur pour isoler les brouillons
    if (typeof window === "undefined" || !DRAFTS_KEY) return;

    const savedDrafts = localStorage.getItem(DRAFTS_KEY);
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out expired drafts (older than 90 days)
          const now = new Date();
          type DraftData = {
            id: string;
            formData: FormData;
            currentStep: Step;
            lastSaved: string;
            createdAt?: string;
          };
          const validDrafts = parsed.filter((draft: DraftData) => {
            if (!draft.createdAt) return false;
            const createdDate = new Date(draft.createdAt);
            const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff < DRAFT_EXPIRY_DAYS;
          }).map((draft: DraftData) => ({
            ...draft,
            createdAt: draft.createdAt!, // We know it exists after the filter
            formData: {
              ...draft.formData,
              additionalTypes: Array.isArray(draft.formData?.additionalTypes) ? draft.formData.additionalTypes : [],
              spaceFeatures: Array.isArray(draft.formData?.spaceFeatures) ? draft.formData.spaceFeatures : [],
            },
          }));

          // Update localStorage with only valid drafts
          if (validDrafts.length !== parsed.length) {
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(validDrafts));
          }

          if (validDrafts.length > 0) {
            setAvailableDrafts(validDrafts);
            setShowDraftModal(true);
          }
        }
      } catch (e) {
        console.error("Error loading drafts:", e);
        localStorage.removeItem(DRAFTS_KEY);
      }
    }
  }, [DRAFTS_KEY]);

  // Restore a specific draft from the modal
  const handleRestoreDraft = useCallback((draftId: string) => {
    const selectedDraft = availableDrafts.find(d => d.id === draftId);
    if (selectedDraft) {
      // Fusionner avec les valeurs par défaut pour éviter les champs manquants
      const defaultFormData: FormData = {
        type: null,
        additionalTypes: [],
        customType: "",
        country: "France",
        city: "",
        addressFull: "",
        addressLine1: "",
        postalCode: "",
        province: "",
        regionFR: "",
        lat: null,
        lng: null,
        latPublic: null,
        lngPublic: null,
        maxGuests: 1,
        beds: null,
        desks: null,
        parkings: null,
        bathrooms: null,
        spaceFeatures: [],
        title: "",
        description: "",
        pricingMode: "DAILY",
        price: 0,
        hourlyPrice: null,
        currency: "EUR",
        isInstantBook: false,
        minNights: null,
        maxNights: null,
        discountHours3Plus: null,
        discountHours6Plus: null,
        discountDays3Plus: null,
        discountWeekly: null,
        discountMonthly: null,
      };

      // Fusionner les données sauvegardées avec les valeurs par défaut
      const safeFormData: FormData = {
        ...defaultFormData,
        ...selectedDraft.formData,
        // S'assurer que les arrays sont bien des arrays
        additionalTypes: Array.isArray(selectedDraft.formData?.additionalTypes) ? selectedDraft.formData.additionalTypes : [],
        spaceFeatures: Array.isArray(selectedDraft.formData?.spaceFeatures) ? selectedDraft.formData.spaceFeatures : [],
      };

      setFormData(safeFormData);
      setCurrentDraftId(draftId);

      // Restaurer l'étape - vérifier que c'est une étape valide
      const validSteps: Step[] = ["type", "map", "location", "confirmLocation", "details", "features", "photos", "description", "pricing", "discounts", "review"];
      if (selectedDraft.currentStep && validSteps.includes(selectedDraft.currentStep)) {
        setCurrentStep(selectedDraft.currentStep);
      } else {
        // Si l'étape n'est pas valide, déterminer la bonne étape basée sur les données
        if (safeFormData.title && safeFormData.description) {
          setCurrentStep("pricing");
        } else if (safeFormData.spaceFeatures.length > 0) {
          setCurrentStep("photos");
        } else if (safeFormData.maxGuests > 1 || safeFormData.beds || safeFormData.desks) {
          setCurrentStep("features");
        } else if (safeFormData.lat && safeFormData.lng) {
          setCurrentStep("details");
        } else if (safeFormData.city) {
          setCurrentStep("map");
        } else if (safeFormData.type) {
          setCurrentStep("map");
        } else {
          setCurrentStep("type");
        }
      }

      if (selectedDraft.lastSaved) {
        setLastSaved(new Date(selectedDraft.lastSaved));
      }
      toast.success("Brouillon restauré !");
    }
    setShowDraftModal(false);
  }, [availableDrafts]);

  // Start fresh - create new draft without deleting existing ones
  const handleStartFresh = useCallback(() => {
    // Generate new draft ID for the new listing
    const newDraftId = createId();
    setCurrentDraftId(newDraftId);
    setShowDraftModal(false);
  }, []);

  // Delete a specific draft
  const handleDeleteDraft = useCallback((draftId: string) => {
    const updatedDrafts = availableDrafts.filter(d => d.id !== draftId);
    setAvailableDrafts(updatedDrafts);
    if (typeof window !== "undefined") {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    }
    toast.success("Brouillon supprimé");
    if (updatedDrafts.length === 0) {
      setShowDraftModal(false);
    }
  }, [availableDrafts, DRAFTS_KEY]);

  // Save draft function - saves to array of drafts
  const saveDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      const now = new Date().toISOString();
      const draftId = currentDraftId || createId();

      // If we don't have a draft ID yet, set it
      if (!currentDraftId) {
        setCurrentDraftId(draftId);
      }

      const newDraft = {
        id: draftId,
        formData,
        currentStep,
        lastSaved: now,
        createdAt: availableDrafts.find(d => d.id === draftId)?.createdAt || now,
      };

      // Get existing drafts from localStorage
      let existingDrafts: typeof availableDrafts = [];
      try {
        const stored = localStorage.getItem(DRAFTS_KEY);
        if (stored) {
          existingDrafts = JSON.parse(stored);
        }
      } catch {
        existingDrafts = [];
      }

      // Update or add the draft
      const draftIndex = existingDrafts.findIndex(d => d.id === draftId);
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = newDraft;
      } else {
        existingDrafts.push(newDraft);
      }

      localStorage.setItem(DRAFTS_KEY, JSON.stringify(existingDrafts));
      setAvailableDrafts(existingDrafts);
      setLastSaved(new Date());
    }
  }, [formData, currentStep, currentDraftId, availableDrafts, DRAFTS_KEY]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.type || formData.city || formData.title) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, saveDraft]);

  // Manual save draft
  const handleSaveDraft = useCallback(() => {
    setSavingDraft(true);
    saveDraft();
    toast.success("Brouillon enregistré !");
    setTimeout(() => {
      setSavingDraft(false);
      router.push("/");
    }, 500);
  }, [saveDraft, router]);

  // Clear current draft after successful publish
  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined" && currentDraftId) {
      try {
        const stored = localStorage.getItem(DRAFTS_KEY);
        if (stored) {
          const drafts = JSON.parse(stored) as Array<{ id: string }>;
          const updatedDrafts = drafts.filter((d) => d.id !== currentDraftId);
          localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
          setAvailableDrafts(updatedDrafts as typeof availableDrafts);
        }
      } catch {
        // Ignore errors
      }
    }
  }, [currentDraftId, DRAFTS_KEY]);

  // Start identity verification
  const handleStartIdentity = async () => {
    try {
      setLoadingIdentity(true);
      const res = await fetch("/api/identity/start", { method: "POST" });
      if (!res.ok) {
        toast.error("Erreur lors du démarrage de la vérification");
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Erreur lors de la vérification d'identité");
    } finally {
      setLoadingIdentity(false);
    }
  };

  // Récupérer le type pré-sélectionné depuis become-host
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedType = sessionStorage.getItem("lokroom_listing_type");
      if (savedType && LISTING_TYPES.some(t => t.value === savedType)) {
        setFormData((prev) => ({ ...prev, type: savedType as ListingType }));
        setCurrentStep("map");
        sessionStorage.removeItem("lokroom_listing_type");
      }
    }
  }, []);

  // Check if Google Maps is already loaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const g = (window as { google?: { maps?: { places?: unknown } } }).google;
      if (g?.maps?.places) {
        setMapsReady(true);
      }
    }
  }, []);

  // Poll for Google Maps to be ready (in case it's loaded by another component)
  useEffect(() => {
    if (mapsReady) return;

    const checkGoogleMaps = () => {
      const g = (window as { google?: { maps?: { places?: unknown } } }).google;
      if (g?.maps?.places) {
        setMapsReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMaps()) return;

    // Poll every 100ms for up to 10 seconds
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [mapsReady]);

  // Setup address autocomplete for map step
  useEffect(() => {
    if (!mapsReady || currentStep !== "map") return;

    const g = (window as WindowWithGoogle).google;
    if (!g?.maps?.places?.Autocomplete) return;

    const input = document.getElementById("addressSearch") as HTMLInputElement | null;
    if (!input) return;

    const autocomplete = new g.maps.places.Autocomplete(input, {
      types: ["geocode"],
      fields: ["formatted_address", "geometry", "address_components"],
      componentRestrictions: { country: formData.country === "France" ? "fr" : "ca" },
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

      // Extract address components
      let streetNumber = "";
      let route = "";
      let city = "";
      let postalCode = "";

      for (const comp of place.address_components || []) {
        if (comp.types.includes("street_number")) streetNumber = comp.long_name;
        if (comp.types.includes("route")) route = comp.long_name;
        if (comp.types.includes("locality")) city = comp.long_name;
        if (comp.types.includes("postal_code")) postalCode = comp.long_name;
      }

      setFormData((prev) => ({
        ...prev,
        addressFull: place.formatted_address || prev.addressFull,
        addressLine1: streetNumber ? `${streetNumber} ${route}` : route,
        city: city || prev.city,
        postalCode: postalCode || prev.postalCode,
        lat,
        lng,
        latPublic,
        lngPublic,
      }));

      // Update map view and move marker to the new position
      const mapElement = document.getElementById("google-map");
      if (mapElement) {
        const mapWithRefs = mapElement as MapElementWithGmap & { __marker?: GoogleMarker };
        if (mapWithRefs.__gmap) {
          mapWithRefs.__gmap.setCenter({ lat, lng });
          mapWithRefs.__gmap.setZoom(16);
        }
        // Move marker to the new position
        if (mapWithRefs.__marker) {
          mapWithRefs.__marker.setPosition({ lat, lng });
        }
      }
    });

    return () => {
      g.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [mapsReady, currentStep, formData.country]);

  // Initialize map when entering map step
  useEffect(() => {
    if (!mapsReady || (currentStep !== "map" && currentStep !== "confirmLocation")) return;

    const g = (window as WindowWithGoogle).google;
    if (!g?.maps) return;

    const containerId = currentStep === "map" ? "google-map" : "confirm-google-map";
    const container = document.getElementById(containerId);
    if (!container) return;

    // Default center based on country
    const defaultCenter = formData.country === "France"
      ? { lat: 48.8566, lng: 2.3522 }
      : { lat: 45.5017, lng: -73.5673 };

    const center = formData.lat && formData.lng
      ? { lat: formData.lat, lng: formData.lng }
      : defaultCenter;

    // Style écologique pour la map (même que les autres pages Lokroom)
    const mapStyles = [
      // Fond général - beige chaud et reposant
      { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f5efe6" }] },
      { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#f0e9de" }] },
      { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#f7f2ea" }] },
      // Parcs et espaces verts - vert écologique #a5d8a1
      { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5d8a1" }] },
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4a7c47" }] },
      // Forêts et végétation
      { featureType: "landscape.natural.terrain", elementType: "geometry.fill", stylers: [{ color: "#b8e0b4" }] },
      { featureType: "landscape.natural.landcover", elementType: "geometry.fill", stylers: [{ color: "#c2e8be" }] },
      // Autres POI - beige avec touches subtiles
      { featureType: "poi.attraction", elementType: "geometry.fill", stylers: [{ color: "#ebe4d8" }] },
      { featureType: "poi.business", elementType: "geometry.fill", stylers: [{ color: "#f5efe6" }] },
      { featureType: "poi.school", elementType: "geometry.fill", stylers: [{ color: "#f0e9de" }] },
      { featureType: "poi.medical", elementType: "geometry.fill", stylers: [{ color: "#f7f2ea" }] },
      { featureType: "poi.sports_complex", elementType: "geometry.fill", stylers: [{ color: "#a5d8a1" }] },
      { featureType: "poi.government", elementType: "geometry.fill", stylers: [{ color: "#ebe4d8" }] },
      { featureType: "poi.place_of_worship", elementType: "geometry.fill", stylers: [{ color: "#f0e9de" }] },
      // Cacher les icônes POI
      { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8a7a65" }] },
      // Eau - bleu doux #cae8f2
      { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#cae8f2" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5a9aaa" }] },
      // Routes
      { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e8e0d5" }] },
      { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#fdfbf8" }] },
      { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#ebe4d8" }] },
      { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#faf7f2" }] },
      { featureType: "road.local", elementType: "geometry.stroke", stylers: [{ color: "#ebe4d8" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a7a65" }] },
      // Transit
      { featureType: "transit.station", elementType: "geometry.fill", stylers: [{ color: "#ebe4d8" }] },
      { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#e0d8cc" }] },
      { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      // Labels
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#5a5045" }] },
      { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#7a6a5a" }] },
      { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#9a8a7a" }] },
    ];

    const map = new g.maps.Map(container, {
      center,
      zoom: formData.lat ? 16 : 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false, // Disable default zoom controls
      styles: mapStyles,
    });

    // Store map reference
    (container as MapElementWithGmap).__gmap = map;

    // Custom marker icon
    const customIcon = {
      url: "/map-marker-lokroom création d'annonce.png",
      scaledSize: new g.maps.Size(60, 60),
      anchor: new g.maps.Point(30, 30), // Anchor at center
    };

    const marker = new g.maps.Marker({
      position: center,
      map,
      draggable: true,
      animation: g.maps.Animation.DROP,
      icon: customIcon,
    });

    // Store marker reference for external access
    (container as MapElementWithGmap & { __marker?: GoogleMarker }).__marker = marker;

    // Update position when marker is dragged
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        const latPublic = Math.round(lat * 1000) / 1000;
        const lngPublic = Math.round(lng * 1000) / 1000;

        // Reverse geocoding pour obtenir l'adresse à partir des coordonnées
        const geocoder = new g.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: GoogleGeocoderResult[] | null, status: string) => {
          if (status === "OK" && results && results[0]) {
            const place = results[0];
            let streetNumber = "";
            let route = "";
            let city = "";
            let postalCode = "";

            for (const comp of place.address_components || []) {
              if (comp.types.includes("street_number")) streetNumber = comp.long_name;
              if (comp.types.includes("route")) route = comp.long_name;
              if (comp.types.includes("locality")) city = comp.long_name;
              if (comp.types.includes("postal_code")) postalCode = comp.long_name;
            }

            setFormData((prev) => ({
              ...prev,
              addressFull: place.formatted_address || prev.addressFull,
              addressLine1: streetNumber ? `${streetNumber} ${route}` : route || prev.addressLine1,
              city: city || prev.city,
              postalCode: postalCode || prev.postalCode,
              lat,
              lng,
              latPublic,
              lngPublic,
            }));

            // Mettre à jour le champ de recherche avec l'adresse
            const input = document.getElementById("addressSearch") as HTMLInputElement | null;
            if (input) {
              input.value = place.formatted_address || "";
            }
          } else {
            // Si le geocoding échoue, on met juste à jour les coordonnées
            setFormData((prev) => ({
              ...prev,
              lat,
              lng,
              latPublic,
              lngPublic,
            }));
          }
        });
      }
    });

    // Update map when clicking
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
  }, [mapsReady, currentStep, formData.country]);

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

  // Validation du type personnalisé
  function isValidCustomType(customType: string): boolean {
    const normalized = customType.toLowerCase().trim();
    if (normalized.length < 2) return false;
    // Bloquer les mots interdits
    const blockedWords = ["enfant", "bougie", "drogue", "arme", "sexe", "xxx", "porno", "illegal"];
    if (blockedWords.some(word => normalized.includes(word))) return false;
    // Autoriser si dans la liste ou ressemble à un type d'espace
    return VALID_CUSTOM_TYPES.some(type => normalized.includes(type) || type.includes(normalized)) || normalized.length >= 3;
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case "type":
        if (formData.type === "OTHER") {
          return formData.customType.trim().length >= 2 && isValidCustomType(formData.customType);
        }
        return formData.type !== null;
      case "map":
        return formData.lat !== null && formData.lng !== null;
      case "location": {
        const hasAddress = formData.addressLine1.trim().length >= 3;
        const hasPostalCode = formData.postalCode.trim().length >= 4;
        const hasRegion = formData.country === "France"
          ? formData.regionFR.trim().length > 0
          : formData.province.trim().length > 0;
        return hasAddress && hasPostalCode && hasRegion && formData.city.trim().length > 0;
      }
      case "confirmLocation":
        return formData.lat !== null && formData.lng !== null;
      case "details":
        return formData.maxGuests >= 1 || (formData.type === "PARKING" || formData.type === "GARAGE" ? (formData.parkings || 0) >= 1 : false);
      case "features":
        return true; // Optionnel
      case "photos":
        return images.length >= 3;
      case "description":
        return formData.title.trim().length >= 3 && formData.description.trim().length >= 10;
      case "pricing":
        return formData.price >= 2 || (formData.pricingMode === "HOURLY" && (formData.hourlyPrice || 0) >= 1);
      case "discounts":
        return true; // Optionnel
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

    // Check identity verification
    if (identityStatus !== "VERIFIED") {
      setShowIdentityModal(true);
      return;
    }

    setSubmitting(true);

    try {
      // Create listing
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        additionalTypes: formData.additionalTypes,
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
      clearDraft(); // Clear the draft after successful publish
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));

      // Rafraîchir la session pour mettre à jour isHost
      await updateSession();

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

  // Afficher un loader pendant la vérification de session ou de permission
  if (status === "loading" || !permissionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Ne pas afficher le formulaire si l'utilisateur n'a pas la permission (en attendant la redirection)
  if (status === "unauthenticated" || !hasPermission) {
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
      {apiKey && !mapsReady && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setMapsReady(true)}
        />
      )}

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl 2xl:max-w-6xl items-center justify-between px-4 sm:px-6">
            <button
              onClick={() => router.push("/")}
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
        <main className="mx-auto max-w-2xl 2xl:max-w-3xl px-4 sm:px-6 py-8">
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
            <div className="space-y-6">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Multi-catégorie :</span> Tu peux sélectionner plusieurs types si ton espace combine plusieurs usages (ex: maison avec studio intégré). Le premier sélectionné sera le type principal.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LISTING_TYPES.map((t) => {
                  const isPrimary = formData.type === t.value;
                  const isAdditional = formData.additionalTypes.includes(t.value);
                  const isSelected = isPrimary || isAdditional;

                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          // Si c'est le type principal actuel, on le désélectionne
                          if (prev.type === t.value) {
                            // Le prochain type additionnel devient principal (ou null si aucun)
                            const newPrimary = prev.additionalTypes[0] || null;
                            return {
                              ...prev,
                              type: newPrimary,
                              additionalTypes: prev.additionalTypes.slice(1),
                              customType: "",
                            };
                          }

                          // Si c'est déjà un type additionnel, on le retire
                          if (prev.additionalTypes.includes(t.value)) {
                            return {
                              ...prev,
                              additionalTypes: prev.additionalTypes.filter(at => at !== t.value),
                            };
                          }

                          // Si c'est "OTHER", on le met en type principal uniquement
                          if (t.value === "OTHER") {
                            return {
                              ...prev,
                              type: t.value,
                              additionalTypes: prev.additionalTypes.filter(at => at !== "OTHER"),
                              customType: prev.customType,
                            };
                          }

                          // Si pas encore de type principal, ce sera le type principal
                          if (!prev.type) {
                            return { ...prev, type: t.value, customType: "" };
                          }

                          // Sinon, on l'ajoute comme type additionnel (max 4 pour 5 catégories au total)
                          if (prev.additionalTypes.length < 4) {
                            return {
                              ...prev,
                              additionalTypes: [...prev.additionalTypes, t.value],
                            };
                          }

                          return prev;
                        });
                      }}
                      className={`group relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-gray-400 ${
                        isPrimary
                          ? "border-gray-900 bg-gray-50"
                          : isAdditional
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Badge pour indiquer principal/secondaire */}
                      {isSelected && (
                        <span className={`absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isPrimary ? "bg-gray-900 text-white" : "bg-blue-500 text-white"
                        }`}>
                          {isPrimary ? "Principal" : `+${formData.additionalTypes.indexOf(t.value) + 1}`}
                        </span>
                      )}

                      <div className={`flex-shrink-0 ${isSelected ? "text-gray-900" : "text-gray-400"}`}>
                        {ListingTypeIcons[t.value]}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{t.label}</span>
                        <p className="mt-0.5 text-sm text-gray-500">{t.description}</p>
                      </div>
                      {isSelected && (
                        <div className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          isPrimary ? "bg-gray-900" : "bg-blue-500"
                        }`}>
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Résumé des types sélectionnés */}
              {formData.type && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Types sélectionnés :</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                      {LISTING_TYPES.find(lt => lt.value === formData.type)?.label}
                      <span className="text-gray-400">(principal)</span>
                    </span>
                    {formData.additionalTypes.map((at) => (
                      <span key={at} className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                        {LISTING_TYPES.find(lt => lt.value === at)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom type input when OTHER is selected */}
              {formData.type === "OTHER" && (
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <label htmlFor="customType" className="text-sm font-medium text-gray-700">
                    Précisez le type d&apos;espace
                  </label>
                  <input
                    id="customType"
                    type="text"
                    value={formData.customType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Ex: Atelier, Loft, Rooftop, Cave..."
                  />
                  <p className="text-xs text-gray-500">
                    Décrivez votre type d&apos;espace en quelques mots (min. 2 caractères)
                  </p>
                  {formData.customType.trim().length >= 2 && !isValidCustomType(formData.customType) && (
                    <p className="text-xs text-red-500">
                      Ce type d&apos;espace n&apos;est pas valide. Veuillez décrire un espace locatif.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========== STEP: MAP ========== */}
          {currentStep === "map" && (
            <div className="space-y-6">
              {/* Dynamic title based on space type */}
              <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Où se trouve {formData.type ? LISTING_TYPE_LOCATION_LABELS[formData.type] : "votre espace"} ?
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Entrez l&apos;adresse ou placez le marqueur sur la carte
                </p>
              </div>

              {/* Country selection */}
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
                        province: "",
                        regionFR: "",
                      }))}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        formData.country === country
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {country === "France" ? "France" : "Canada"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address search with autocomplete */}
              <div className="space-y-2">
                <label htmlFor="addressSearch" className="text-sm font-medium text-gray-700">
                  Rechercher une adresse
                </label>
                <div className="relative">
                  <input
                    id="addressSearch"
                    type="text"
                    value={formData.addressFull}
                    onChange={(e) => setFormData((prev) => ({ ...prev, addressFull: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="Commencez à taper une adresse..."
                  />
                  <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
              </div>

              {/* Map container */}
              <div className="space-y-2">
                <div className="relative">
                  <div
                    id="map-container"
                    className="h-[300px] w-full rounded-xl border border-gray-200 bg-gray-100 overflow-hidden"
                    style={{ minHeight: "300px" }}
                  >
                    {!mapsReady ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
                          <p className="mt-2 text-sm text-gray-500">Chargement de la carte...</p>
                        </div>
                      </div>
                    ) : (
                      <div id="google-map" className="h-full w-full" />
                    )}
                  </div>

                  {/* Custom zoom controls */}
                  {mapsReady && (
                    <div className="absolute right-3 top-3 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const mapElement = document.getElementById("google-map");
                          if (mapElement && (mapElement as MapElementWithGmap).__gmap) {
                            const map = (mapElement as MapElementWithGmap).__gmap!;
                            map.setZoom(map.getZoom() + 1);
                          }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label="Zoomer"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const mapElement = document.getElementById("google-map");
                          if (mapElement && (mapElement as MapElementWithGmap).__gmap) {
                            const map = (mapElement as MapElementWithGmap).__gmap!;
                            map.setZoom(map.getZoom() - 1);
                          }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label="Dézoomer"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Glissez le marqueur pour ajuster l&apos;emplacement exact
                </p>
              </div>

              {/* Location info */}
              {formData.lat && formData.lng && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Emplacement sélectionné</p>
                      <p className="mt-0.5 text-sm text-green-700">{formData.addressFull || "Position sur la carte"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== STEP: LOCATION (Address details) ========== */}
          {currentStep === "location" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Adresse sélectionnée :</span> {formData.addressFull || "Non définie"}
                </p>
              </div>

              {/* Street address */}
              <div className="space-y-2">
                <label htmlFor="addressLine1" className="text-sm font-medium text-gray-700">
                  Adresse (numéro et rue)
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="123 rue de la Paix"
                />
              </div>

              {/* City with autocomplete */}
              <div className="space-y-2 relative">
                <label htmlFor="city" className="text-sm font-medium text-gray-700">
                  Ville
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, city: e.target.value }));
                    // Trigger city autocomplete
                    if (mapsReady && e.target.value.length >= 2) {
                      const g = (window as WindowWithGoogle).google;
                      if (g?.maps?.places?.AutocompleteService) {
                        const service = new g.maps.places.AutocompleteService();
                        service.getPlacePredictions(
                          {
                            input: e.target.value,
                            types: ["(cities)"],
                            componentRestrictions: { country: formData.country === "France" ? "fr" : "ca" },
                          },
                          (predictions: CitySuggestion[] | null) => {
                            setCitySuggestions(predictions || []);
                            setShowCitySuggestions(true);
                          }
                        );
                      }
                    } else {
                      setCitySuggestions([]);
                      setShowCitySuggestions(false);
                    }
                  }}
                  onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder={formData.country === "France" ? "Paris, Lyon, Marseille..." : "Montréal, Toronto, Vancouver..."}
                />
                {/* City suggestions dropdown */}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                    {citySuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onClick={() => {
                          const cityName = suggestion.structured_formatting?.main_text || suggestion.description.split(",")[0];
                          setFormData((prev) => ({ ...prev, city: cityName }));
                          setShowCitySuggestions(false);
                          setCitySuggestions([]);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <span className="font-medium">{suggestion.structured_formatting?.main_text}</span>
                        <span className="text-gray-500 ml-1">{suggestion.structured_formatting?.secondary_text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Postal code */}
              <div className="space-y-2">
                <label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                  Code postal
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder={formData.country === "France" ? "75001" : "H2X 1Y4"}
                />
              </div>

              {/* Province/Region */}
              <div className="space-y-2">
                <label htmlFor="region" className="text-sm font-medium text-gray-700">
                  {formData.country === "France" ? "Région" : "Province/Territoire"}
                </label>
                <select
                  id="region"
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

              <p className="text-xs text-gray-500">
                L&apos;adresse exacte ne sera visible que par les voyageurs ayant confirmé une réservation.
              </p>
            </div>
          )}

          {/* ========== STEP: CONFIRM LOCATION ========== */}
          {currentStep === "confirmLocation" && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Confirmez l&apos;emplacement de {formData.type ? LISTING_TYPE_LOCATION_LABELS[formData.type] : "votre espace"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Vérifiez que le marqueur est bien placé sur votre espace
                </p>
              </div>

              {/* Address summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Adresse complète</h3>
                <p className="text-sm text-gray-700">
                  {formData.addressLine1}<br />
                  {formData.postalCode} {formData.city}<br />
                  {formData.country === "France"
                    ? REGIONS_FR.find(r => r.value === formData.regionFR)?.label
                    : PROVINCES_CA.find(p => p.value === formData.province)?.label}, {formData.country}
                </p>
              </div>

              {/* Confirmation map */}
              <div className="space-y-2">
                <div className="relative">
                  <div
                    id="confirm-map-container"
                    className="h-[350px] w-full rounded-xl border border-gray-200 bg-gray-100 overflow-hidden"
                  >
                    {!mapsReady ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
                      </div>
                    ) : (
                      <div id="confirm-google-map" className="h-full w-full" />
                    )}
                  </div>

                  {/* Custom zoom controls */}
                  {mapsReady && (
                    <div className="absolute right-3 top-3 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const mapElement = document.getElementById("confirm-google-map");
                          if (mapElement && (mapElement as MapElementWithGmap).__gmap) {
                            const map = (mapElement as MapElementWithGmap).__gmap!;
                            map.setZoom(map.getZoom() + 1);
                          }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label="Zoomer"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const mapElement = document.getElementById("confirm-google-map");
                          if (mapElement && (mapElement as MapElementWithGmap).__gmap) {
                            const map = (mapElement as MapElementWithGmap).__gmap!;
                            map.setZoom(map.getZoom() - 1);
                          }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        aria-label="Dézoomer"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Vous pouvez ajuster le marqueur si nécessaire
                </p>
              </div>

              {/* Confirmation checkbox */}
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  id="confirmAddress"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  defaultChecked
                />
                <label htmlFor="confirmAddress" className="text-sm text-gray-700">
                  Je confirme que l&apos;emplacement indiqué correspond bien à mon espace
                </label>
              </div>
            </div>
          )}

          {/* ========== STEP: DETAILS ========== */}
          {currentStep === "details" && (
            <div className="space-y-6">
              {/* Dynamic capacity fields based on space type */}
              {formData.type && CAPACITY_CONFIG[formData.type] && (
                <>
                  {CAPACITY_CONFIG[formData.type].fields.map((field) => {
                    const label = CAPACITY_CONFIG[formData.type!].labels[field];
                    const currentValue = formData[field as keyof FormData] as number || (field === "maxGuests" ? formData.maxGuests : 1);

                    return (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              const newValue = Math.max(1, (currentValue || 1) - 1);
                              setFormData((prev) => ({ ...prev, [field]: newValue }));
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-20 text-center text-lg font-medium">
                            {currentValue || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newValue = Math.min(50, (currentValue || 1) + 1);
                              setFormData((prev) => ({ ...prev, [field]: newValue }));
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Instant booking toggle */}
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

          {/* ========== STEP: FEATURES ========== */}
          {currentStep === "features" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Sélectionnez les caractéristiques qui décrivent le mieux votre espace (optionnel)
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SPACE_FEATURES.map((feature) => {
                  const features = Array.isArray(formData.spaceFeatures) ? formData.spaceFeatures : [];
                  const isSelected = features.includes(feature.value);
                  return (
                    <button
                      key={feature.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          const currentFeatures = Array.isArray(prev.spaceFeatures) ? prev.spaceFeatures : [];
                          return {
                            ...prev,
                            spaceFeatures: isSelected
                              ? currentFeatures.filter((f) => f !== feature.value)
                              : [...currentFeatures, feature.value],
                          };
                        });
                      }}
                      className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="text-lg">{feature.icon}</span>
                      <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                        {feature.label}
                      </span>
                      {isSelected && (
                        <svg className="ml-auto h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {Array.isArray(formData.spaceFeatures) && formData.spaceFeatures.length > 0 && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{formData.spaceFeatures.length}</span> caractéristique{formData.spaceFeatures.length > 1 ? "s" : ""} sélectionnée{formData.spaceFeatures.length > 1 ? "s" : ""}
                  </p>
                </div>
              )}
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
                          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview */}
                          <img
                            src={img.previewUrl}
                            alt={`Image ${i + 1} de l'annonce`}
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
                  placeholder="Décrivez votre espace : ce qui le rend unique, les équipements disponibles, l'ambiance, le quartier..."
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
                    { value: "DAILY", label: "Par nuitée" },
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

              {(formData.pricingMode === "DAILY" || formData.pricingMode === "BOTH") && (
                <div className="space-y-4">
                  <label htmlFor="price" className="text-sm font-medium text-gray-700">
                    Prix par jour/nuit ({formData.currency})
                  </label>

                  {/* Price slider */}
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={2}
                      max={1000}
                      step={1}
                      value={formData.price || 2}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>2{formData.currency === "EUR" ? "€" : "$"}</span>
                      <span>1000{formData.currency === "EUR" ? "€" : "$"}</span>
                    </div>
                  </div>

                  {/* Manual price input */}
                  <div className="relative">
                    <input
                      id="price"
                      type="text"
                      value={formData.price || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                        const numValue = parseFloat(value) || 0;
                        setFormData((prev) => ({ ...prev, price: Math.min(100000, numValue) }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 text-lg font-medium focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.currency === "EUR" ? "€" : "$"} / jour
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Vous pouvez saisir un prix supérieur à 1000{formData.currency === "EUR" ? "€" : "$"} manuellement
                  </p>
                </div>
              )}

              {(formData.pricingMode === "HOURLY" || formData.pricingMode === "BOTH") && (
                <div className="space-y-4">
                  <label htmlFor="hourlyPrice" className="text-sm font-medium text-gray-700">
                    Prix par heure ({formData.currency})
                  </label>

                  {/* Hourly price slider */}
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={1}
                      max={200}
                      step={1}
                      value={formData.hourlyPrice || 1}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hourlyPrice: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1{formData.currency === "EUR" ? "€" : "$"}</span>
                      <span>200{formData.currency === "EUR" ? "€" : "$"}</span>
                    </div>
                  </div>

                  {/* Manual hourly price input */}
                  <div className="relative">
                    <input
                      id="hourlyPrice"
                      type="text"
                      value={formData.hourlyPrice || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                        const numValue = parseFloat(value) || 0;
                        setFormData((prev) => ({ ...prev, hourlyPrice: Math.min(10000, numValue) || null }));
                      }}
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

              {/* Recommandation de prix */}
              {formData.type && formData.city && (
                (() => {
                  const recommendation = getPriceRecommendation(formData.type, formData.city);
                  if (!recommendation) return null;
                  const isUrban = isUrbanArea(formData.city);
                  const symbol = formData.currency === "EUR" ? "€" : "$";

                  return (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-900">
                            Prix recommandés pour {formData.city}
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {isUrban ? "Zone urbaine" : "Zone rurale"}
                            </span>
                          </h4>
                          <div className="mt-2 space-y-1.5 text-sm text-blue-800">
                            {(formData.pricingMode === "DAILY" || formData.pricingMode === "BOTH") && (
                              <p>
                                <span className="font-medium">Par nuitée :</span>{" "}
                                {recommendation.daily.min}{symbol} - {recommendation.daily.max}{symbol}
                                {formData.price > 0 && (
                                  <span className={`ml-2 text-xs ${
                                    formData.price >= recommendation.daily.min && formData.price <= recommendation.daily.max
                                      ? "text-green-600"
                                      : formData.price < recommendation.daily.min
                                      ? "text-amber-600"
                                      : "text-amber-600"
                                  }`}>
                                    {formData.price >= recommendation.daily.min && formData.price <= recommendation.daily.max
                                      ? "✓ Dans la fourchette"
                                      : formData.price < recommendation.daily.min
                                      ? "↓ En dessous"
                                      : "↑ Au dessus"}
                                  </span>
                                )}
                              </p>
                            )}
                            {(formData.pricingMode === "HOURLY" || formData.pricingMode === "BOTH") && (
                              <p>
                                <span className="font-medium">Par heure :</span>{" "}
                                {recommendation.hourly.min}{symbol} - {recommendation.hourly.max}{symbol}
                                {formData.hourlyPrice && formData.hourlyPrice > 0 && (
                                  <span className={`ml-2 text-xs ${
                                    formData.hourlyPrice >= recommendation.hourly.min && formData.hourlyPrice <= recommendation.hourly.max
                                      ? "text-green-600"
                                      : formData.hourlyPrice < recommendation.hourly.min
                                      ? "text-amber-600"
                                      : "text-amber-600"
                                  }`}>
                                    {formData.hourlyPrice >= recommendation.hourly.min && formData.hourlyPrice <= recommendation.hourly.max
                                      ? "✓ Dans la fourchette"
                                      : formData.hourlyPrice < recommendation.hourly.min
                                      ? "↓ En dessous"
                                      : "↑ Au dessus"}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-blue-600">
                            Ces prix sont indicatifs. Tu es libre de fixer le tarif que tu souhaites.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* ========== STEP: DISCOUNTS ========== */}
          {currentStep === "discounts" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Proposez des réductions pour encourager les réservations plus longues (optionnel)
              </p>

              {/* Hourly discounts */}
              {(formData.pricingMode === "HOURLY" || formData.pricingMode === "BOTH") && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Réductions à l&apos;heure</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">3 heures ou plus</p>
                        <p className="text-sm text-gray-500">Réduction appliquée automatiquement</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={formData.discountHours3Plus || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountHours3Plus: parseInt(e.target.value) || null }))}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">6 heures ou plus</p>
                        <p className="text-sm text-gray-500">Idéal pour les demi-journées</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={formData.discountHours6Plus || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountHours6Plus: parseInt(e.target.value) || null }))}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none"
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
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Réductions à la journée</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">3 jours ou plus</p>
                        <p className="text-sm text-gray-500">Pour les séjours de quelques jours</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={formData.discountDays3Plus || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountDays3Plus: parseInt(e.target.value) || null }))}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">Semaine (7+ jours)</p>
                        <p className="text-sm text-gray-500">Attirez les séjours d&apos;une semaine</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={formData.discountWeekly || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountWeekly: parseInt(e.target.value) || null }))}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                      <div>
                        <p className="font-medium text-gray-900">Mois (28+ jours)</p>
                        <p className="text-sm text-gray-500">Pour les longs séjours</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={70}
                          value={formData.discountMonthly || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountMonthly: parseInt(e.target.value) || null }))}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-gray-900 focus:outline-none"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview of discounts */}
              {(formData.discountHours3Plus || formData.discountHours6Plus || formData.discountDays3Plus || formData.discountWeekly || formData.discountMonthly) && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Aperçu des réductions</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    {formData.discountHours3Plus && <p>3+ heures : -{formData.discountHours3Plus}%</p>}
                    {formData.discountHours6Plus && <p>6+ heures : -{formData.discountHours6Plus}%</p>}
                    {formData.discountDays3Plus && <p>3+ jours : -{formData.discountDays3Plus}%</p>}
                    {formData.discountWeekly && <p>Semaine : -{formData.discountWeekly}%</p>}
                    {formData.discountMonthly && <p>Mois : -{formData.discountMonthly}%</p>}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Conseil :</span> Les réductions de 10-20% sont efficaces pour attirer plus de réservations longues.
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
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview */}
                    <img
                      src={images[0].previewUrl}
                      alt="Apercu de l'annonce"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formData.title || "Titre de l'annonce"}
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
          {/* Draft status bar */}
          {lastSaved && (
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-1.5">
              <p className="text-center text-xs text-gray-500">
                Brouillon enregistré à {lastSaved.toLocaleTimeString()}
              </p>
            </div>
          )}
          <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isFirstStep}
                className="text-sm font-medium text-gray-900 underline disabled:invisible"
              >
                Retour
              </button>
              {/* Save draft button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {savingDraft ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                )}
                Finir plus tard
              </button>
            </div>

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
                  "Publier l'annonce"
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

      {/* Draft Choice Modal - Multi-draft support */}
      {showDraftModal && availableDrafts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Close button (X) in top right corner */}
            <button
              type="button"
              onClick={handleStartFresh}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Fermer et créer une nouvelle annonce"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {availableDrafts.length === 1 ? "Tu as un brouillon en cours" : `Tu as ${availableDrafts.length} brouillons`}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {availableDrafts.length === 1
                ? "Souhaites-tu continuer ce brouillon ou créer une nouvelle annonce ?"
                : "Sélectionne un brouillon pour le continuer ou crée une nouvelle annonce."}
            </p>

            {/* Drafts list */}
            <div className="mt-4 space-y-2 overflow-y-auto flex-1 max-h-[300px]">
              {availableDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 group-hover:bg-amber-300 transition-colors">
                      <svg className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {draft.formData.title || "Annonce sans titre"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {draft.formData.type ? LISTING_TYPES.find(t => t.value === draft.formData.type)?.label : "Type non défini"}
                        {draft.formData.city && ` · ${draft.formData.city}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Étape : {STEPS.find(s => s.key === draft.currentStep)?.title || draft.currentStep}
                        {draft.lastSaved && (
                          <> · Modifié le {new Date(draft.lastSaved).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer ce brouillon"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestoreDraft(draft.id)}
                        className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                      >
                        Continuer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleStartFresh}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Créer une nouvelle annonce
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Les brouillons sont automatiquement supprimés après 90 jours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Identity Verification Modal */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Vérification d&apos;identité requise
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Pour publier une annonce sur Lok&apos;Room, tu dois d&apos;abord vérifier ton identité. C&apos;est une mesure de sécurité pour protéger tous les utilisateurs.
            </p>
            {identityStatus === "PENDING" && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Ta vérification est en cours de traitement. Réessaie dans quelques minutes.
              </div>
            )}
            {identityStatus === "REJECTED" && (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                Ta précédente vérification a été refusée. Tu peux réessayer avec des documents valides.
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowIdentityModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={handleStartIdentity}
                disabled={loadingIdentity}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {loadingIdentity ? "Redirection..." : "Vérifier mon identité"}
              </button>
            </div>
          </div>
        </div>
      )}

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
