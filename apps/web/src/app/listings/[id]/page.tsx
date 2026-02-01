// apps/web/src/app/listings/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import DeleteListingButton from "@/components/DeleteListingButton";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import BookingForm from "@/components/BookingForm";
import { getOrigin } from "@/lib/origin";
import Map from "@/components/Map";
import MapExpandButton from "@/components/MapExpandButton";
import MobileBookingModal from "@/components/MobileBookingModal";
import ListingReviews from "@/components/ListingReviews";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getServerDictionary } from "@/lib/i18n.server";
import ListingJsonLd from "@/components/seo/ListingJsonLd";
import InstantBookBadge from "@/components/InstantBookBadge";
import ShareButton from "@/components/ShareButton";
import AmenitiesModal from "@/components/AmenitiesModal";
import KycWarning from "@/components/KycWarning";

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

  // SEO fields
  type?: string;
  maxGuests?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
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

      {/* ========== VERSION MOBILE ========== */}
      <div className="lg:hidden min-h-screen bg-white pb-24">
        {/* Galerie avec header overlay */}
        <div className="relative">
          {/* Header sticky sur l'image */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-8 bg-gradient-to-b from-black/40 to-transparent">
            <Link
              href="/listings"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm"
            >
              <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
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

          {/* Hôte */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white text-lg font-semibold">
                {(listing.owner.name?.[0] || "?").toUpperCase()}
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {t.listingDetail.hostedBy} {listing.owner.name || t.listingDetail.hostLokroom}
                </p>
                <p className="text-sm text-gray-500">{t.listingDetail.respondsIn}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-2">{t.listingDetail.aboutSpace}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {listing.description || t.listingDetail.noDescription}
            </p>
          </div>

          {/* Ce que propose ce logement */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Equipements</h2>
              <AmenitiesModal amenities={listing.amenities} previewCount={6} />
            </div>
          )}

          {/* Localisation */}
          {hasCoords && (
            <div className="py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Localisation approximative de l&apos;annonce</h2>
              <p className="text-xs text-gray-500 mb-3">{t.listingDetail.exactLocationNote}</p>
              <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                <div className="absolute inset-0 pointer-events-none">
                  <Map
                    useLogoIcon
                    markers={[
                      {
                        id: listing.id,
                        lat: lat as number,
                        lng: lng as number,
                        label: priceFormatted,
                      },
                    ]}
                  />
                </div>
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
          />
        )}
      </div>

      {/* ========== VERSION DESKTOP (inchangée) ========== */}
      <main className="hidden lg:flex mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] flex-col gap-4 sm:gap-6 px-3 sm:px-4 lg:px-6 xl:px-8 pb-8 sm:pb-12 pt-4 sm:pt-6">
      {/* Ligne retour + date */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <Link href="/listings" className="hover:underline">
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

          {/* Description */}
          <div className="space-y-2 border-b pb-4">
            <h3 className="text-sm font-semibold">{t.listingDetail.aboutSpace}</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {listing.description || t.listingDetail.noDescription}
            </p>
          </div>

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

          {/* Infos hôte */}
          <aside className="space-y-1">
            <p className="text-sm text-gray-600">{t.listingDetail.host}</p>
            <p className="font-medium">
              {listing.owner.name ?? t.listingDetail.lokroomUser}
            </p>
          </aside>

          {/* Localisation approximative avec logo Lok'Room */}
          {hasCoords && (
            <section className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">
                Localisation approximative de l&apos;annonce
              </h3>
              <p className="text-xs text-gray-500">
                {t.listingDetail.exactLocationNote}
              </p>
              <div className="relative mt-2 h-64 w-full overflow-hidden rounded-2xl border bg-gray-100">
                <Map
                  useLogoIcon
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

          {/* Avis sur l'annonce */}
          <ListingReviews listingId={listing.id} />
        </div>

        {/* Colonne droite : carte réservation */}
        <aside className="w-full lg:w-auto lg:max-w-md lg:min-w-[320px] rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-md lg:sticky lg:top-24">
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
