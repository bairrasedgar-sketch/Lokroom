import Script from "next/script";
import { secureJsonLd } from "@/lib/security/json-ld";

interface SearchPageJsonLdProps {
  searchParams?: {
    q?: string;
    country?: string;
    city?: string;
    type?: string;
  };
  totalResults: number;
  listings?: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    city?: string | null;
    country?: string;
    images?: { url: string }[];
  }>;
}

// Mapping des types vers les labels français
const typeLabels: Record<string, string> = {
  APARTMENT: "Appartements",
  HOUSE: "Maisons",
  ROOM: "Chambres",
  STUDIO: "Studios",
  OFFICE: "Bureaux",
  COWORKING: "Espaces coworking",
  MEETING_ROOM: "Salles de réunion",
  PARKING: "Parkings",
  GARAGE: "Garages",
  STORAGE: "Espaces de stockage",
  EVENT_SPACE: "Espaces événementiels",
  RECORDING_STUDIO: "Studios d'enregistrement",
  OTHER: "Espaces",
};

export default function SearchPageJsonLd({
  searchParams,
  totalResults,
  listings = [],
}: SearchPageJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";

  const city = searchParams?.city || "";
  const country = searchParams?.country || "";
  const type = searchParams?.type || "";
  const q = searchParams?.q || "";

  // Construire le nom de la recherche
  let searchName = "";
  if (type && typeLabels[type]) {
    searchName = typeLabels[type];
  } else {
    searchName = "Espaces";
  }
  searchName += " à louer";
  if (city) searchName += ` à ${city}`;
  if (country && !city) searchName += ` en ${country}`;
  if (q) searchName += ` - "${q}"`;

  // Construire l'URL de la page
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (city) params.set("city", city);
  if (type) params.set("type", type);
  if (q) params.set("q", q);

  const pageUrl = params.toString()
    ? `${baseUrl}/listings?${params.toString()}`
    : `${baseUrl}/listings`;

  // Schema.org SearchResultsPage
  const searchResultsJsonLd = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: searchName,
    description: `${totalResults} ${totalResults === 1 ? "résultat" : "résultats"} trouvés sur Lok'Room`,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalResults,
      itemListElement: listings.slice(0, 10).map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          "@id": `${baseUrl}/listings/${listing.id}`,
          name: listing.title,
          url: `${baseUrl}/listings/${listing.id}`,
          image: listing.images?.[0]?.url || `${baseUrl}/og-image.png`,
          offers: {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: listing.currency,
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
  };

  // Schema.org BreadcrumbList pour la navigation
  const breadcrumbItems = [
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
  ];

  if (country) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: country,
      item: `${baseUrl}/listings?country=${encodeURIComponent(country)}`,
    });
  }

  if (city) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: country ? 4 : 3,
      name: city,
      item: `${baseUrl}/listings?country=${encodeURIComponent(country || "")}&city=${encodeURIComponent(city)}`,
    });
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // Schema.org WebSite avec SearchAction (pour la barre de recherche Google)
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lok'Room",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/listings?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Script
        id="search-results-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(searchResultsJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="breadcrumb-search-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(breadcrumbJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(websiteJsonLd) }}
        strategy="afterInteractive"
      />
    </>
  );
}
