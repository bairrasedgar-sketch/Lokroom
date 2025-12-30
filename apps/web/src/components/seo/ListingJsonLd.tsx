import Script from "next/script";

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
  };
}

export default function ListingJsonLd({ listing }: ListingJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";
  const locationLabel = [listing.city, listing.country].filter(Boolean).join(", ");

  // Schema.org Product/RentalLodging pour les espaces à louer
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images?.map((img) => img.url) || [],
    url: `${baseUrl}/listings/${listing.id}`,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      seller: {
        "@type": "Organization",
        name: "Lok'Room",
        url: baseUrl,
      },
    },
    brand: {
      "@type": "Brand",
      name: "Lok'Room",
    },
    ...(listing.lat && listing.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: listing.lat,
            longitude: listing.lng,
          },
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city || undefined,
      addressCountry: listing.country,
    },
  };

  // Schema.org Place pour le local référencement
  const placeJsonLd = {
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
    ...(listing.lat && listing.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: listing.lat,
            longitude: listing.lng,
          },
        }
      : {}),
  };

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
      {
        "@type": "ListItem",
        position: 3,
        name: locationLabel || listing.country,
        item: `${baseUrl}/listings?country=${encodeURIComponent(listing.country)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: listing.title,
        item: `${baseUrl}/listings/${listing.id}`,
      },
    ],
  };

  return (
    <>
      <Script
        id="listing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="place-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        strategy="afterInteractive"
      />
    </>
  );
}
