import Script from "next/script";
import { secureJsonLd } from "@/lib/security/json-ld";

interface HomePageJsonLdProps {
  stats?: {
    totalListings: number;
    totalUsers: number;
    totalCountries: number;
  };
}

export default function HomePageJsonLd({ stats }: HomePageJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";

  // Schema.org Organization (pour la page d'accueil)
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Lok'Room",
    alternateName: "LokRoom",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${baseUrl}/og-image.png`,
    description:
      "Lok'Room est la plateforme de location d'espaces entre particuliers. Louez ou proposez des appartements, bureaux, studios, salles de réunion et plus.",
    foundingDate: "2024",
    slogan: "Louez des espaces uniques entre particuliers",
    sameAs: [
      "https://www.facebook.com/lokroom",
      "https://twitter.com/lokroom",
      "https://www.instagram.com/lokroom",
      "https://www.linkedin.com/company/lokroom",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "contact@lokroom.com",
        availableLanguage: ["French", "English"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
  };

  // Schema.org WebSite avec SearchAction
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "Lok'Room",
    alternateName: "LokRoom - Location d'espaces",
    url: baseUrl,
    description:
      "Plateforme de location d'espaces entre particuliers : appartements, bureaux, studios, parkings et plus.",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/listings?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
    inLanguage: ["fr-FR", "en-US"],
  };

  // Schema.org WebPage pour la page d'accueil
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/#webpage`,
    url: baseUrl,
    name: "Lok'Room - Location d'espaces entre particuliers",
    description:
      "Louez et proposez des espaces uniques : appartements, bureaux, studios photo, salles de réunion, parkings et plus. Réservation sécurisée.",
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    about: {
      "@id": `${baseUrl}/#organization`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${baseUrl}/og-image.png`,
    },
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: "fr-FR",
  };

  // Schema.org LocalBusiness (pour le référencement local)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#localbusiness`,
    name: "Lok'Room",
    image: `${baseUrl}/logo.png`,
    url: baseUrl,
    description:
      "Plateforme de location d'espaces entre particuliers en France et au Canada.",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    sameAs: [
      "https://www.facebook.com/lokroom",
      "https://twitter.com/lokroom",
      "https://www.instagram.com/lokroom",
    ],
  };

  // Schema.org AggregateOffer (pour afficher les statistiques)
  const aggregateOfferJsonLd = stats
    ? {
        "@context": "https://schema.org",
        "@type": "AggregateOffer",
        "@id": `${baseUrl}/#offers`,
        name: "Espaces disponibles sur Lok'Room",
        description: `${stats.totalListings} espaces à louer dans ${stats.totalCountries} pays`,
        offerCount: stats.totalListings,
        lowPrice: 10,
        highPrice: 1000,
        priceCurrency: "EUR",
        url: `${baseUrl}/listings`,
        seller: {
          "@id": `${baseUrl}/#organization`,
        },
      }
    : null;

  // Schema.org BreadcrumbList
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
    ],
  };

  return (
    <>
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(organizationJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="website-home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(websiteJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="webpage-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(webPageJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="localbusiness-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(localBusinessJsonLd) }}
        strategy="afterInteractive"
      />
      {aggregateOfferJsonLd && (
        <Script
          id="aggregate-offer-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: secureJsonLd(aggregateOfferJsonLd),
          }}
          strategy="afterInteractive"
        />
      )}
      <Script
        id="breadcrumb-home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: secureJsonLd(breadcrumbJsonLd) }}
        strategy="afterInteractive"
      />
    </>
  );
}
