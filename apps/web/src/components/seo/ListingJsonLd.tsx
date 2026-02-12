import Script from "next/script";
import { secureJsonLd } from "@/lib/security/json-ld";

interface ListingJsonLdProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    city: string | null;
    country: string;
    images: { id: string; url: string }[];
    lat?: number | null;
    lng?: number | null;
    ownerName?: string | null;
    type?: string;
    maxGuests?: number | null;
    beds?: number | null;
    bathrooms?: number | null;
    amenities?: { key: string; label: string }[];
    reviewSummary?: {
      count: number;
      avgRating: number | null;
    };
    createdAt?: string;
  };
}

// Mapping des types d'espaces vers Schema.org
const typeToSchemaType: Record<string, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  ROOM: "Room",
  STUDIO: "Apartment",
  OFFICE: "OfficeBuilding",
  COWORKING: "OfficeBuilding",
  MEETING_ROOM: "MeetingRoom",
  PARKING: "ParkingFacility",
  GARAGE: "ParkingFacility",
  STORAGE: "SelfStorage",
  EVENT_SPACE: "EventVenue",
  RECORDING_STUDIO: "MusicVenue",
  OTHER: "Place",
};

export default function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";
  const locationLabel = [listing.city, listing.country].filter(Boolean).join(", ");
  const schemaType = typeToSchemaType[listing.type || "OTHER"] || "Place";

  // Schema.org LodgingBusiness pour les espaces à louer (niveau Airbnb)
  const lodgingJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", schemaType, "Product"],
    "@id": `${baseUrl}/listings/${listing.id}`,
    name: listing.title,
    description: listing.description,
    url: `${baseUrl}/listings/${listing.id}`,
    image: listing.images?.map((img) => img.url) || [],

    // Adresse
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city || undefined,
      addressCountry: listing.country,
    },

    // Offre de prix
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      url: `${baseUrl}/listings/${listing.id}`,
      seller: {
        "@type": "Organization",
        name: "Lok'Room",
        url: baseUrl,
      },
    },

    // Marque
    brand: {
      "@type": "Brand",
      name: "Lok'Room",
    },

    // Provider
    provider: {
      "@type": "Organization",
      name: "Lok'Room",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
    },
  };

  // Ajouter les coordonnées géographiques si disponibles
  if (listing.lat && listing.lng) {
    lodgingJsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.lat,
      longitude: listing.lng,
    };
  }

  // Ajouter les avis/ratings si disponibles (très important pour SEO)
  if (listing.reviewSummary && listing.reviewSummary.count > 0 && listing.reviewSummary.avgRating) {
    lodgingJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: listing.reviewSummary.avgRating,
      reviewCount: listing.reviewSummary.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Ajouter les caractéristiques du logement
  if (listing.maxGuests) {
    lodgingJsonLd.occupancy = {
      "@type": "QuantitativeValue",
      value: listing.maxGuests,
      unitText: "persons",
    };
  }

  // Ajouter les équipements si disponibles
  if (listing.amenities && listing.amenities.length > 0) {
    lodgingJsonLd.amenityFeature = listing.amenities.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity.label || amenity.key,
      value: true,
    }));
  }

  // Ajouter les infos de chambre
  if (listing.beds) {
    lodgingJsonLd.numberOfBedrooms = listing.beds;
  }
  if (listing.bathrooms) {
    lodgingJsonLd.numberOfBathroomsTotal = listing.bathrooms;
  }

  // Date de publication
  if (listing.createdAt) {
    lodgingJsonLd.datePublished = new Date(listing.createdAt).toISOString();
  }

  // Schema.org Place pour le référencement local
  const placeJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: listing.title,
    description: listing.description,
    image: listing.images?.[0]?.url,
    url: `${baseUrl}/listings/${listing.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city || undefined,
      addressCountry: listing.country,
    },
  };

  if (listing.lat && listing.lng) {
    placeJsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.lat,
      longitude: listing.lng,
    };
  }

  // Schema.org BreadcrumbList pour la navigation
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Annonces",
        item: `${baseUrl}/listings`,
      },
      ...(listing.country ? [{
        "@type": "ListItem",
        position: 3,
        name: listing.country,
        item: `${baseUrl}/listings?country=${encodeURIComponent(listing.country)}`,
      }] : []),
      ...(listing.city ? [{
        "@type": "ListItem",
        position: listing.country ? 4 : 3,
        name: listing.city,
        item: `${baseUrl}/listings?country=${encodeURIComponent(listing.country)}&city=${encodeURIComponent(listing.city)}`,
      }] : []),
      {
        "@type": "ListItem",
        position: (listing.country ? 1 : 0) + (listing.city ? 1 : 0) + 3,
        name: listing.title,
        item: `${baseUrl}/listings/${listing.id}`,
      },
    ],
  };

  // FAQ Schema pour les questions fréquentes (améliore le SEO)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Comment réserver "${listing.title}" ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Pour réserver cet espace, sélectionnez vos dates et cliquez sur "Réserver". Le paiement est sécurisé via Lok'Room.`,
        },
      },
      {
        "@type": "Question",
        name: `Où se situe "${listing.title}" ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Cet espace est situé à ${locationLabel}. L'adresse exacte vous sera communiquée après la réservation.`,
        },
      },
      {
        "@type": "Question",
        name: `Quel est le prix de "${listing.title}" ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Le prix est de ${listing.price} ${listing.currency} par nuit. Des frais de service peuvent s'appliquer.`,
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="lodging-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(lodgingJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="place-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(placeJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(breadcrumbJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(faqJsonLd) }}
        strategy="afterInteractive"
      />
    </>
  );
}
