// apps/web/src/app/listings/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { Metadata } from "next";
import dynamicImport from "next/dynamic";
import {
  Home,
  Users,
  Bed,
  Bath,
  Layers,
  Trees,
  Waves,
  Sun,
  Camera,
  Music,
  Mic,
  Palette,
  Car,
  Lock,
  Zap,
  Ruler,
  Clock,
  Sparkles,
  DollarSign,
  Percent,
  MapPin,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import DeleteListingButton from "@/components/DeleteListingButton";
import FavoriteButton from "@/components/FavoriteButton";
import BookingForm from "@/components/BookingForm";
import { getOrigin } from "@/lib/origin";
import MapExpandButton from "@/components/MapExpandButton";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getServerDictionary } from "@/lib/i18n.server";
import ListingJsonLd from "@/components/seo/ListingJsonLd";
import InstantBookBadge from "@/components/InstantBookBadge";
import ShareButton from "@/components/ShareButton";
import AmenitiesModal from "@/components/AmenitiesModal";
import KycWarning from "@/components/KycWarning";
import { ListingViewTracker } from "@/components/listings/ListingViewTracker";

// Lazy load heavy components
const ListingGallery = dynamicImport(() => import("@/components/ListingGallery"), {
  loading: () => <div className="h-[500px] bg-gray-200 animate-pulse rounded-lg" />,
  ssr: true,
});

const Map = dynamicImport(() => import("@/components/Map"), {
  loading: () => <div className="h-[400px] bg-gray-200 animate-pulse rounded-lg" />,
  ssr: false,
});

const MobileBookingModal = dynamicImport(() => import("@/components/MobileBookingModal"), {
  loading: () => null,
  ssr: false,
});

const ListingReviews = dynamicImport(() => import("@/components/ListingReviews"), {
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true,
});

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  country: string;
  city: string | null;
  createdAt: string;

  addressFull: string;
  lat: number | null;
  lng: number | null;
  latPublic: number | null;
  lngPublic: number | null;

  // Instant Book
  isInstantBook?: boolean;

  // Basic fields
  type?: string;
  pricingMode?: string;
  maxGuests?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  desks?: number | null;
  parkings?: number | null;

  // Detailed configuration
  bedrooms?: number | null;
  bedConfiguration?: Record<string, unknown> | null;
  bathroomsFull?: number | null;
  bathroomsHalf?: number | null;
  spaceType?: string | null;

  // House specific
  floors?: number | null;
  hasGarden?: boolean;
  gardenSize?: number | null;
  hasPool?: boolean;
  poolType?: string | null;
  poolHeated?: boolean;
  hasTerrace?: boolean;
  terraceSize?: number | null;

  // Studio specific
  studioType?: string | null;
  studioHeight?: number | null;
  hasGreenScreen?: boolean;
  hasSoundproofing?: boolean;

  // Parking specific
  parkingType?: string | null;
  parkingCovered?: boolean;
  parkingSecured?: boolean;
  parkingLength?: number | null;
  parkingWidth?: number | null;
  parkingHeight?: number | null;
  hasEVCharger?: boolean;

  // Pricing advanced
  hourlyPrice?: number | null;
  hourlyIncrement?: number;
  minDurationMinutes?: number | null;
  cleaningFee?: number | null;
  extraGuestFee?: number | null;
  extraGuestThreshold?: number | null;

  // Discounts
  discountHours2Plus?: number | null;
  discountHours3Plus?: number | null;
  discountHours4Plus?: number | null;
  discountHours6Plus?: number | null;
  discountHours8Plus?: number | null;
  discountDays2Plus?: number | null;
  discountDays3Plus?: number | null;
  discountDays5Plus?: number | null;
  discountWeekly?: number | null;
  discountDays14Plus?: number | null;
  discountMonthly?: number | null;

  // Description enrichie
  spaceDescription?: string | null;
  guestAccessDescription?: string | null;
  neighborhoodDescription?: string | null;
  highlights?: string[];

  amenities?: { key: string; label: string }[];
  reviewSummary?: {
    count: number;
    avgRating: number | null;
  };

  images: { id: string; url: string }[];
  owner: { id: string | null; name: string | null; email: string | null };
};

async function getListing(id: string): Promise<Listing | null> {
  const origin = getOrigin();
  const res = await fetch(`${origin}/api/listings/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return (data.listing ?? null) as Listing | null;
}

// Mapping des types vers les labels français pour SEO
const typeLabels: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  COWORKING: "Espace coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Espace de stockage",
  EVENT_SPACE: "Espace événementiel",
  RECORDING_STUDIO: "Studios",
  OTHER: "Espace",
};

// SEO: generateMetadata pour les meta tags dynamiques (niveau Airbnb)
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const listing = await getListing(params.id);

  if (!listing) {
    return {
      title: "Annonce non trouvée | Lok'Room",
      description: "Cette annonce n'existe pas ou a été supprimée.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";
  const typeLabel = typeLabels[listing.type || "OTHER"] || "Espace";
  const locationLabel = [listing.city, listing.country].filter(Boolean).join(", ");

  // Titre optimisé SEO style Airbnb
  const title = `${listing.title} - ${typeLabel} à ${locationLabel}`;

  // Description enrichie avec caractéristiques
  const features: string[] = [];
  if (listing.maxGuests) features.push(`${listing.maxGuests} voyageur${listing.maxGuests > 1 ? "s" : ""}`);
  if (listing.beds) features.push(`${listing.beds} lit${listing.beds > 1 ? "s" : ""}`);
  if (listing.bathrooms) features.push(`${listing.bathrooms} sdb`);

  const featuresText = features.length > 0 ? ` ${features.join(", ")}.` : "";
  const ratingText = listing.reviewSummary?.avgRating
    ? ` Note: ${listing.reviewSummary.avgRating}/5 (${listing.reviewSummary.count} avis).`
    : "";

  const description = listing.description
    ? `${listing.description.slice(0, 120)}...${featuresText}${ratingText} Réservez sur Lok'Room.`
    : `Louez ce ${typeLabel.toLowerCase()} à ${locationLabel}.${featuresText}${ratingText} Réservation sécurisée sur Lok'Room.`;

  // Images pour Open Graph (jusqu'à 4 images)
  const ogImages = (listing.images || []).slice(0, 4).map((img, index) => ({
    url: img.url,
    width: 1200,
    height: 630,
    alt: index === 0 ? listing.title : `${listing.title} - Photo ${index + 1}`,
    type: "image/jpeg",
  }));

  // Si pas d'images, utiliser l'image par défaut
  if (ogImages.length === 0) {
    ogImages.push({
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: "Lok'Room - Location d'espaces",
      type: "image/png",
    });
  }

  return {
    title,
    description,

    // Keywords dynamiques
    keywords: [
      "location",
      typeLabel.toLowerCase(),
      listing.city || "",
      listing.country,
      "réservation",
      "Lok'Room",
      "location entre particuliers",
      listing.type?.toLowerCase().replace("_", " ") || "",
    ].filter(Boolean),

    // Authors et publisher
    authors: [{ name: listing.owner.name || "Lok'Room" }],
    creator: "Lok'Room",
    publisher: "Lok'Room",

    // Open Graph (Facebook, LinkedIn, WhatsApp)
    openGraph: {
      type: "website",
      siteName: "Lok'Room",
      locale: "fr_FR",
      title,
      description,
      url: `${baseUrl}/listings/${listing.id}`,
      images: ogImages,
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      site: "@lokroom",
      creator: "@lokroom",
      title,
      description,
      images: ogImages.slice(0, 1).map(img => img.url),
    },

    // Alternates et canonical
    alternates: {
      canonical: `${baseUrl}/listings/${listing.id}`,
      languages: {
        "fr-FR": `${baseUrl}/listings/${listing.id}`,
        "en-US": `${baseUrl}/en/listings/${listing.id}`,
      },
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Autres meta
    category: "location",
    classification: typeLabel,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const listing = await getListing(params.id);
  if (!listing) return notFound();

  const session = await getServerSession(authOptions);
  const isOwner =
    !!session?.user?.email && listing.owner.email === session.user.email;

  const { dict: t, locale } = getServerDictionary();

  const displayCurrency =
    (cookies().get("currency")?.value as Currency | undefined) ?? "EUR";

  const priceFormatted = await formatMoneyAsync(
    listing.price,
    listing.currency,
    displayCurrency,
  );

  const locationLabel = [
    listing.city ?? undefined,
    listing.country ?? undefined,
  ]
    .filter(Boolean)
    .join(", ");

  // Coords "utiles" : publiques si dispo, sinon privées
  const lat = listing.latPublic ?? listing.lat;
  const lng = listing.lngPublic ?? listing.lng;

  const hasCoords =
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const publishedDate = new Date(listing.createdAt).toLocaleDateString(locale);

  return (
    <>
      {/* Schema.org JSON-LD pour le SEO (niveau Airbnb) */}
      <ListingJsonLd
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: listing.currency,
          city: listing.city,
          country: listing.country,
          images: listing.images,
          lat: lat,
          lng: lng,
          ownerName: listing.owner.name,
          type: listing.type,
          maxGuests: listing.maxGuests,
          beds: listing.beds,
          bathrooms: listing.bathrooms,
          amenities: listing.amenities,
          reviewSummary: listing.reviewSummary,
          createdAt: listing.createdAt,
        }}
      />

      {/* Track listing view for recommendations */}
      <ListingViewTracker listingId={listing.id} />

      {/* ========== VERSION MOBILE ========== */}
      <div className="lg:hidden min-h-screen bg-white pb-24">
        {/* Galerie avec header overlay */}
        <div className="relative">
          {/* Header sticky sur l'image */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-8 bg-gradient-to-b from-black/40 to-transparent">
            <Link
              href="/listings"
              className="flex items-center justify-center px-5 py-3 rounded-full bg-gray-800/60 backdrop-blur-sm shadow-lg"
            >
              <svg className="h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-white text-base font-medium">Retour aux annonces</span>
            </Link>
            <div className="flex items-center gap-2">
              <ShareButton variant="mobile" />
              <FavoriteButton listingId={listing.id} />
            </div>
          </div>

          {/* Galerie */}
          <div className="aspect-[4/3] bg-gray-100">
            <ListingGallery images={listing.images ?? []} title={listing.title} />
          </div>
        </div>

        {/* Contenu */}
        <div className="px-4">
          {/* Titre et localisation */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{listing.title}</h1>
              {listing.isInstantBook && (
                <InstantBookBadge size="sm" showTooltip={false} />
              )}
            </div>
            {/* Informations du logement style Airbnb */}
            <p className="mt-1 text-sm text-gray-600">
              {[
                typeLabels[listing.type || "OTHER"] || "Espace",
                listing.beds ? `${listing.beds} lit${listing.beds > 1 ? "s" : ""}` : null,
                listing.bathrooms ? `${listing.bathrooms} salle${listing.bathrooms > 1 ? "s" : ""} de bain` : null,
                listing.maxGuests ? `${listing.maxGuests} voyageur${listing.maxGuests > 1 ? "s" : ""} max` : null,
              ].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-sm text-gray-500">{locationLabel}</p>
            {listing.reviewSummary && listing.reviewSummary.count > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <svg className="h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">{listing.reviewSummary.avgRating?.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({listing.reviewSummary.count} {listing.reviewSummary.count === 1 ? 'avis' : 'avis'})</span>
              </div>
            )}
          </div>

          {/* Hôte avec badges de vérification */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white text-lg font-semibold">
                {(listing.owner.name?.[0] || "?").toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900">
                  {t.listingDetail.hostedBy} {listing.owner.name || t.listingDetail.hostLokroom}
                </p>
                <p className="text-sm text-gray-500">{t.listingDetail.respondsIn}</p>

                {/* Badges de vérification */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Identité vérifiée
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email vérifié
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Téléphone vérifié
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Répond en quelques heures
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Superhost
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Membre depuis 2024
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Points forts */}
          {listing.highlights && listing.highlights.length > 0 && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Points forts</h2>
              <div className="space-y-2">
                {listing.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détails de l'espace */}
          {(listing.type === "APARTMENT" || listing.type === "HOUSE") && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Détails du logement</h2>
              <div className="grid grid-cols-2 gap-3">
                {listing.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""}</span>
                  </div>
                )}
                {listing.beds && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.beds} lit{listing.beds > 1 ? "s" : ""}</span>
                  </div>
                )}
                {listing.bathroomsFull && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.bathroomsFull} salle{listing.bathroomsFull > 1 ? "s" : ""} de bain</span>
                  </div>
                )}
                {listing.bathroomsHalf && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.bathroomsHalf} salle{listing.bathroomsHalf > 1 ? "s" : ""} d'eau</span>
                  </div>
                )}
                {listing.maxGuests && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.maxGuests} voyageur{listing.maxGuests > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques maison */}
          {listing.type === "HOUSE" && (listing.floors || listing.hasGarden || listing.hasPool || listing.hasTerrace) && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Caractéristiques de la maison</h2>
              <div className="space-y-2">
                {listing.floors && (
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.floors} étage{listing.floors > 1 ? "s" : ""}</span>
                  </div>
                )}
                {listing.hasGarden && (
                  <div className="flex items-center gap-2">
                    <Trees className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Jardin{listing.gardenSize ? ` (${listing.gardenSize} m²)` : ""}
                    </span>
                  </div>
                )}
                {listing.hasPool && (
                  <div className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Piscine {listing.poolType === "indoor" ? "intérieure" : "extérieure"}
                      {listing.poolHeated ? " chauffée" : ""}
                    </span>
                  </div>
                )}
                {listing.hasTerrace && (
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Terrasse{listing.terraceSize ? ` (${listing.terraceSize} m²)` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques studio */}
          {(listing.type === "STUDIO" || listing.type === "RECORDING_STUDIO") && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Caractéristiques du studio</h2>
              <div className="space-y-2">
                {listing.studioType && (
                  <div className="flex items-center gap-2">
                    {listing.studioType === "photo" && <Camera className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "video" && <Camera className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "music" && <Music className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "podcast" && <Mic className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "art" && <Palette className="h-5 w-5 text-gray-600" />}
                    <span className="text-sm text-gray-700 capitalize">Studio {listing.studioType}</span>
                  </div>
                )}
                {listing.studioHeight && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Hauteur sous plafond: {listing.studioHeight}m</span>
                  </div>
                )}
                {listing.hasGreenScreen && (
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Fond vert disponible</span>
                  </div>
                )}
                {listing.hasSoundproofing && (
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Isolation phonique</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques parking */}
          {(listing.type === "PARKING" || listing.type === "GARAGE") && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Caractéristiques du parking</h2>
              <div className="space-y-2">
                {listing.parkingType && (
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 capitalize">
                      {listing.parkingType === "outdoor" && "Extérieur"}
                      {listing.parkingType === "indoor" && "Intérieur"}
                      {listing.parkingType === "underground" && "Souterrain"}
                    </span>
                  </div>
                )}
                {(listing.parkingLength || listing.parkingWidth || listing.parkingHeight) && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Dimensions: {listing.parkingLength || "?"}m × {listing.parkingWidth || "?"}m × {listing.parkingHeight || "?"}m
                    </span>
                  </div>
                )}
                {listing.parkingCovered && (
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Couvert</span>
                  </div>
                )}
                {listing.parkingSecured && (
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Sécurisé</span>
                  </div>
                )}
                {listing.hasEVCharger && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Borne de recharge électrique</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-2">{t.listingDetail.aboutSpace}</h2>

            {listing.spaceDescription && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1">L'espace</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {listing.spaceDescription}
                </p>
              </div>
            )}

            {listing.guestAccessDescription && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Accès voyageurs</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {listing.guestAccessDescription}
                </p>
              </div>
            )}

            {listing.neighborhoodDescription && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Le quartier</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {listing.neighborhoodDescription}
                </p>
              </div>
            )}

            {!listing.spaceDescription && !listing.guestAccessDescription && !listing.neighborhoodDescription && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {listing.description || t.listingDetail.noDescription}
              </p>
            )}
          </div>

          {/* Tarification */}
          {(listing.hourlyPrice || listing.cleaningFee || listing.extraGuestFee) && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Tarification</h2>
              <div className="space-y-2">
                {listing.hourlyPrice && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {listing.hourlyPrice}€/heure
                      {listing.hourlyIncrement === 30 && " (incréments de 30 min)"}
                    </span>
                  </div>
                )}
                {listing.cleaningFee && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Frais de ménage: {listing.cleaningFee}€</span>
                  </div>
                )}
                {listing.extraGuestFee && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Frais par voyageur supplémentaire: {listing.extraGuestFee}€
                      {listing.extraGuestThreshold && ` (à partir de ${listing.extraGuestThreshold} voyageurs)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Réductions */}
          {(listing.discountHours2Plus || listing.discountHours3Plus || listing.discountHours4Plus ||
            listing.discountHours6Plus || listing.discountHours8Plus || listing.discountDays2Plus ||
            listing.discountDays3Plus || listing.discountDays5Plus || listing.discountWeekly ||
            listing.discountDays14Plus || listing.discountMonthly) && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Réductions disponibles</h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.discountHours2Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours2Plus}% dès 2h</span>
                  </div>
                )}
                {listing.discountHours3Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours3Plus}% dès 3h</span>
                  </div>
                )}
                {listing.discountHours4Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours4Plus}% dès 4h</span>
                  </div>
                )}
                {listing.discountHours6Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours6Plus}% dès 6h</span>
                  </div>
                )}
                {listing.discountHours8Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours8Plus}% dès 8h</span>
                  </div>
                )}
                {listing.discountDays2Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays2Plus}% dès 2 jours</span>
                  </div>
                )}
                {listing.discountDays3Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays3Plus}% dès 3 jours</span>
                  </div>
                )}
                {listing.discountDays5Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays5Plus}% dès 5 jours</span>
                  </div>
                )}
                {listing.discountWeekly && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountWeekly}% dès 7 jours</span>
                  </div>
                )}
                {listing.discountDays14Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays14Plus}% dès 14 jours</span>
                  </div>
                )}
                {listing.discountMonthly && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountMonthly}% dès 28 jours</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ce que propose ce logement */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">{t.listingDetail.amenitiesTitle}</h2>
              <AmenitiesModal amenities={listing.amenities} previewCount={6} />
            </div>
          )}

          {/* Ce qu'il faut savoir */}
          <div className="grid gap-4 border-b pb-4 text-sm sm:grid-cols-3">
            <div className="space-y-1">
              <p className="font-semibold">
                {t.listingDetail.cancellationPolicy}
              </p>
              <p className="text-xs text-gray-600">
                {t.listingDetail.cancellationPolicyDesc}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">{t.listingDetail.spaceRules}</p>
              <p className="text-xs text-gray-600">
                {t.listingDetail.spaceRulesDesc}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">{t.listingDetail.security}</p>
              <p className="text-xs text-gray-600">
                {t.listingDetail.securityDesc}
              </p>
            </div>
          </div>

          {/* Localisation */}
          {hasCoords && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-2">{t.listingDetail.approximateLocationTitle}</h2>
              <p className="text-xs text-gray-500 mb-3">{t.listingDetail.exactLocationNote}</p>
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                <Map
                  useLogoIcon={true}
                  markers={[
                    {
                      id: listing.id,
                      lat: lat as number,
                      lng: lng as number,
                      label: priceFormatted,
                    },
                  ]}
                />
                {/* Overlay cliquable + bouton visible en bas à droite */}
                <MapExpandButton
                  marker={{
                    id: listing.id,
                    lat: lat as number,
                    lng: lng as number,
                    label: priceFormatted,
                    title: listing.title,
                    city: listing.city,
                    country: listing.country,
                    priceFormatted: priceFormatted,
                    imageUrl: listing.images?.[0]?.url,
                  }}
                  locationLabel={locationLabel}
                  fullScreen={true}
                  showButton={true}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600">{locationLabel}</p>
            </div>
          )}

          {/* Avis */}
          <div className="py-4 border-b border-gray-100">
            <ListingReviews listingId={listing.id} />
          </div>

          {/* Politique d'annulation */}
          <div className="py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-2">{t.listingDetail.cancellationPolicy}</h2>
            <p className="text-sm text-gray-600">{t.listingDetail.cancellationPolicyDesc}</p>
          </div>

          {/* Règles */}
          <div className="py-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">{t.listingDetail.spaceRules}</h2>
            <p className="text-sm text-gray-600">{t.listingDetail.spaceRulesDesc}</p>
          </div>

          {/* Avertissement KYC mobile */}
          {!isOwner && (
            <div className="py-4">
              <KycWarning />
            </div>
          )}

          {/* Actions propriétaire mobile */}
          {isOwner && (
            <div className="py-4 flex gap-3">
              <Link
                href={`/listings/${listing.id}/edit`}
                className="flex-1 py-3 text-center rounded-xl bg-gray-900 text-white text-sm font-medium"
              >
                {t.listingDetail.editListing}
              </Link>
              <DeleteListingButton id={listing.id} />
            </div>
          )}
        </div>

        {/* Footer sticky mobile avec prix et bouton réserver */}
        {!isOwner && (
          <MobileBookingModal
            listingId={listing.id}
            price={listing.price}
            currency={listing.currency}
            priceFormatted={priceFormatted}
            isInstantBook={listing.isInstantBook ?? false}
            maxGuests={listing.maxGuests ?? undefined}
            listingTitle={listing.title}
            listingImage={listing.images[0]?.url ?? "/placeholder.jpg"}
            listingRating={listing.reviewSummary?.avgRating ?? null}
            listingReviewCount={listing.reviewSummary?.count ?? 0}
          />
        )}
      </div>

      {/* ========== VERSION DESKTOP (inchangée) ========== */}
      <main className="hidden lg:flex mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6 xl:px-8 pb-8 sm:pb-12 pt-4 sm:pt-6">
      {/* Ligne retour + date */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/60 backdrop-blur-sm text-white hover:bg-gray-800/70 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.listingDetail.backToListings}
        </Link>
        <span>
          {t.listingDetail.publishedOn} {publishedDate}
        </span>
      </div>

      {/* Titre + localisation + badge instant book */}
      <section className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
            {listing.title}
          </h1>
          {listing.isInstantBook && (
            <InstantBookBadge size="md" showTooltip={true} />
          )}
        </div>
        {/* Informations du logement style Airbnb */}
        <p className="text-sm text-gray-600">
          {[
            typeLabels[listing.type || "OTHER"] || "Espace",
            listing.beds ? `${listing.beds} lit${listing.beds > 1 ? "s" : ""}` : null,
            listing.bathrooms ? `${listing.bathrooms} salle${listing.bathrooms > 1 ? "s" : ""} de bain` : null,
            listing.maxGuests ? `${listing.maxGuests} voyageur${listing.maxGuests > 1 ? "s" : ""} max` : null,
          ].filter(Boolean).join(" · ")}
        </p>
        <p className="text-xs sm:text-sm text-gray-500">{locationLabel}</p>
      </section>

      {/* Galerie */}
      <section className="space-y-2 sm:space-y-3">
        <div className="overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border bg-gray-100">
          <ListingGallery images={listing.images ?? []} title={listing.title} />
        </div>

        {/* Boutons sous les photos */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-500">
            {t.listingDetail.protectedByLokroom}
          </span>

          <div className="flex gap-2">
            <ShareButton variant="desktop" />

            <FavoriteButton listingId={listing.id} />
          </div>
        </div>
      </section>

      {/* Corps : deux colonnes */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Colonne gauche : détails + hôte */}
        <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
          {/* Bloc hôte résumé */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold truncate">
                {t.listingDetail.hostedBy}{" "}
                {listing.owner.name || t.listingDetail.hostLokroom}
              </h2>
              <p className="text-sm text-gray-600">{locationLabel}</p>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border px-3 py-2 text-xs text-gray-600 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
                {(listing.owner.name?.[0] || "?").toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <p className="font-medium">
                  {listing.owner.name || t.listingDetail.hostLokroom}
                </p>
                <p className="text-[11px] text-gray-500">
                  {t.listingDetail.respondsIn}
                </p>
              </div>
            </div>
          </div>

          {/* Points forts */}
          {listing.highlights && listing.highlights.length > 0 && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Points forts</h3>
              <div className="space-y-2">
                {listing.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détails de l'espace */}
          {(listing.type === "APARTMENT" || listing.type === "HOUSE") && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Détails du logement</h3>
              <div className="grid grid-cols-2 gap-3">
                {listing.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""}</span>
                  </div>
                )}
                {listing.beds && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.beds} lit{listing.beds > 1 ? "s" : ""}</span>
                  </div>
                )}
                {listing.bathroomsFull && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.bathroomsFull} salle{listing.bathroomsFull > 1 ? "s" : ""} de bain</span>
                  </div>
                )}
                {listing.bathroomsHalf && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.bathroomsHalf} salle{listing.bathroomsHalf > 1 ? "s" : ""} d'eau</span>
                  </div>
                )}
                {listing.maxGuests && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.maxGuests} voyageur{listing.maxGuests > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques maison */}
          {listing.type === "HOUSE" && (listing.floors || listing.hasGarden || listing.hasPool || listing.hasTerrace) && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Caractéristiques de la maison</h3>
              <div className="space-y-2">
                {listing.floors && (
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{listing.floors} étage{listing.floors > 1 ? "s" : ""}</span>
                  </div>
                )}
                {listing.hasGarden && (
                  <div className="flex items-center gap-2">
                    <Trees className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Jardin{listing.gardenSize ? ` (${listing.gardenSize} m²)` : ""}
                    </span>
                  </div>
                )}
                {listing.hasPool && (
                  <div className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Piscine {listing.poolType === "indoor" ? "intérieure" : "extérieure"}
                      {listing.poolHeated ? " chauffée" : ""}
                    </span>
                  </div>
                )}
                {listing.hasTerrace && (
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Terrasse{listing.terraceSize ? ` (${listing.terraceSize} m²)` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques studio */}
          {(listing.type === "STUDIO" || listing.type === "RECORDING_STUDIO") && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Caractéristiques du studio</h3>
              <div className="space-y-2">
                {listing.studioType && (
                  <div className="flex items-center gap-2">
                    {listing.studioType === "photo" && <Camera className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "video" && <Camera className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "music" && <Music className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "podcast" && <Mic className="h-5 w-5 text-gray-600" />}
                    {listing.studioType === "art" && <Palette className="h-5 w-5 text-gray-600" />}
                    <span className="text-sm text-gray-700 capitalize">Studio {listing.studioType}</span>
                  </div>
                )}
                {listing.studioHeight && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Hauteur sous plafond: {listing.studioHeight}m</span>
                  </div>
                )}
                {listing.hasGreenScreen && (
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Fond vert disponible</span>
                  </div>
                )}
                {listing.hasSoundproofing && (
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Isolation phonique</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caractéristiques parking */}
          {(listing.type === "PARKING" || listing.type === "GARAGE") && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Caractéristiques du parking</h3>
              <div className="space-y-2">
                {listing.parkingType && (
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 capitalize">
                      {listing.parkingType === "outdoor" && "Extérieur"}
                      {listing.parkingType === "indoor" && "Intérieur"}
                      {listing.parkingType === "underground" && "Souterrain"}
                    </span>
                  </div>
                )}
                {(listing.parkingLength || listing.parkingWidth || listing.parkingHeight) && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Dimensions: {listing.parkingLength || "?"}m × {listing.parkingWidth || "?"}m × {listing.parkingHeight || "?"}m
                    </span>
                  </div>
                )}
                {listing.parkingCovered && (
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Couvert</span>
                  </div>
                )}
                {listing.parkingSecured && (
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Sécurisé</span>
                  </div>
                )}
                {listing.hasEVCharger && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Borne de recharge électrique</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2 border-b pb-4">
            <h3 className="text-sm font-semibold">{t.listingDetail.aboutSpace}</h3>

            {listing.spaceDescription && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">L'espace</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {listing.spaceDescription}
                </p>
              </div>
            )}

            {listing.guestAccessDescription && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Accès voyageurs</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {listing.guestAccessDescription}
                </p>
              </div>
            )}

            {listing.neighborhoodDescription && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Le quartier</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {listing.neighborhoodDescription}
                </p>
              </div>
            )}

            {!listing.spaceDescription && !listing.guestAccessDescription && !listing.neighborhoodDescription && (
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {listing.description || t.listingDetail.noDescription}
              </p>
            )}
          </div>

          {/* Tarification */}
          {(listing.hourlyPrice || listing.cleaningFee || listing.extraGuestFee) && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Tarification</h3>
              <div className="space-y-2">
                {listing.hourlyPrice && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {listing.hourlyPrice}€/heure
                      {listing.hourlyIncrement === 30 && " (incréments de 30 min)"}
                    </span>
                  </div>
                )}
                {listing.cleaningFee && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">Frais de ménage: {listing.cleaningFee}€</span>
                  </div>
                )}
                {listing.extraGuestFee && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Frais par voyageur supplémentaire: {listing.extraGuestFee}€
                      {listing.extraGuestThreshold && ` (à partir de ${listing.extraGuestThreshold} voyageurs)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Réductions */}
          {(listing.discountHours2Plus || listing.discountHours3Plus || listing.discountHours4Plus ||
            listing.discountHours6Plus || listing.discountHours8Plus || listing.discountDays2Plus ||
            listing.discountDays3Plus || listing.discountDays5Plus || listing.discountWeekly ||
            listing.discountDays14Plus || listing.discountMonthly) && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">Réductions disponibles</h3>
              <div className="grid grid-cols-2 gap-2">
                {listing.discountHours2Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours2Plus}% dès 2h</span>
                  </div>
                )}
                {listing.discountHours3Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours3Plus}% dès 3h</span>
                  </div>
                )}
                {listing.discountHours4Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours4Plus}% dès 4h</span>
                  </div>
                )}
                {listing.discountHours6Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours6Plus}% dès 6h</span>
                  </div>
                )}
                {listing.discountHours8Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountHours8Plus}% dès 8h</span>
                  </div>
                )}
                {listing.discountDays2Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays2Plus}% dès 2 jours</span>
                  </div>
                )}
                {listing.discountDays3Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays3Plus}% dès 3 jours</span>
                  </div>
                )}
                {listing.discountDays5Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays5Plus}% dès 5 jours</span>
                  </div>
                )}
                {listing.discountWeekly && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountWeekly}% dès 7 jours</span>
                  </div>
                )}
                {listing.discountDays14Plus && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountDays14Plus}% dès 14 jours</span>
                  </div>
                )}
                {listing.discountMonthly && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">-{listing.discountMonthly}% dès 28 jours</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ce que propose ce logement */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="space-y-2 border-b pb-4">
              <h3 className="text-sm font-semibold">{t.listingDetail.amenitiesTitle}</h3>
              <AmenitiesModal amenities={listing.amenities} previewCount={6} />
            </div>
          )}

          {/* Infos hôte */}
          <aside className="space-y-1">
            <p className="text-sm text-gray-600">{t.listingDetail.host}</p>
            <p className="font-medium">
              {listing.owner.name ?? t.listingDetail.lokroomUser}
            </p>
          </aside>
        </div>

        {/* Colonne droite : carte réservation - PAS sticky, s'arrête avant la carte */}
        <aside className="w-full lg:w-auto lg:max-w-md lg:min-w-[320px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-md">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-semibold">
                {priceFormatted}
                <span className="text-sm font-normal text-gray-600">
                  {" "}
                  {t.listingDetail.perNight}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {t.listingDetail.taxesNote}
              </p>
            </div>
          </div>

          {!isOwner ? (
            <>
              <KycWarning className="mb-4" />
              <BookingForm
                listingId={listing.id}
                price={listing.price}
                currency={listing.currency}
                displayCurrency={displayCurrency}
                priceFormatted={priceFormatted}
                isInstantBook={listing.isInstantBook ?? false}
              />
            </>
          ) : (
            <p className="text-xs text-gray-500">
              {t.listingDetail.ownerNotice}
            </p>
          )}
        </aside>
      </section>

      {/* Localisation approximative - PLEINE LARGEUR en dehors des colonnes */}
      {hasCoords && (
        <section className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold">
            {t.listingDetail.approximateLocationTitle}
          </h3>
          <p className="text-xs text-gray-500">
            {t.listingDetail.exactLocationNote}
          </p>
          <div className="relative mt-2 h-[450px] w-full overflow-hidden rounded-2xl border bg-gray-100">
            <Map
              useLogoIcon={true}
              markers={[
                {
                  id: listing.id,
                  lat: lat as number,
                  lng: lng as number,
                  label: priceFormatted,
                },
              ]}
            />
            <div className="absolute bottom-3 right-3 z-10">
              <MapExpandButton
                marker={{
                  id: listing.id,
                  lat: lat as number,
                  lng: lng as number,
                  label: priceFormatted,
                  title: listing.title,
                  city: listing.city,
                  country: listing.country,
                  priceFormatted: priceFormatted,
                  imageUrl: listing.images?.[0]?.url,
                }}
                locationLabel={locationLabel}
              />
            </div>
          </div>
        </section>
      )}

      {/* Avis sur l'annonce - APRÈS la carte */}
      <ListingReviews listingId={listing.id} />

      {/* Actions propriétaire */}
      {isOwner && (
        <div className="flex gap-3 pt-4">
          <Link
            href={`/listings/${listing.id}/edit`}
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            {t.listingDetail.editListing}
          </Link>
          <DeleteListingButton id={listing.id} />
        </div>
      )}
    </main>
    </>
  );
}
// Force rebuild
