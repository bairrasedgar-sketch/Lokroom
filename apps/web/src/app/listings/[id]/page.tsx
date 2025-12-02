// apps/web/src/app/listings/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import DeleteListingButton from "@/components/DeleteListingButton";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import BookingForm from "@/components/BookingForm";
import { getOrigin } from "@/lib/origin";
import Map from "@/components/Map"; // mini-map localisation
import ListingReviews from "@/components/ListingReviews";
import { formatMoneyAsync, type Currency } from "@/lib/currency";

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

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-6">
      {/* Ligne retour + date */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <Link href="/listings" className="hover:underline">
          ← Retour aux annonces
        </Link>
        <span>
          Publié le {new Date(listing.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Titre + localisation */}
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {listing.title}
        </h1>
        <p className="text-sm text-gray-600">{locationLabel}</p>
      </section>

      {/* Galerie */}
      <section className="space-y-3">
        <div className="overflow-hidden rounded-3xl border bg-gray-100">
          <ListingGallery images={listing.images ?? []} aspect={4 / 3} />
        </div>

        {/* Boutons sous les photos */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-500">
            Protégé par la plate-forme Lok&apos;Room.
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-black"
            >
              <span>Partager</span>
            </button>

            <FavoriteButton listingId={listing.id} />
          </div>
        </div>
      </section>

      {/* Corps : deux colonnes */}
      <section className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Colonne gauche : détails + hôte */}
        <div className="flex-1 space-y-6">
          {/* Bloc hôte résumé */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-semibold">
                Logement proposé par{" "}
                {listing.owner.name || "un hôte Lok'Room"}
              </h2>
              <p className="text-sm text-gray-600">{locationLabel}</p>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border px-3 py-2 text-xs text-gray-600 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
                {(listing.owner.name?.[0] || "?").toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <p className="font-medium">
                  {listing.owner.name || "Hôte Lok'Room"}
                </p>
                <p className="text-[11px] text-gray-500">
                  Répond généralement en quelques heures
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 border-b pb-4">
            <h3 className="text-sm font-semibold">À propos de cet espace</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {listing.description || "Pas encore de description détaillée."}
            </p>
          </div>

          {/* Ce qu’il faut savoir */}
          <div className="grid gap-4 border-b pb-4 text-sm sm:grid-cols-3">
            <div className="space-y-1">
              <p className="font-semibold">
                Conditions d&apos;annulation
              </p>
              <p className="text-xs text-gray-600">
                L&apos;hôte définit ses propres règles. Vérifie les détails
                avant de réserver.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Règles de l&apos;espace</p>
              <p className="text-xs text-gray-600">
                Arrivée autonome ou remise de clés selon l&apos;hôte.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Sécurité</p>
              <p className="text-xs text-gray-600">
                Paiements sécurisés via Lok&apos;Room, jamais en dehors du
                site.
              </p>
            </div>
          </div>

          {/* Infos hôte */}
          <aside className="space-y-1">
            <p className="text-sm text-gray-600">Hôte</p>
            <p className="font-medium">
              {listing.owner.name ?? "Utilisateur Lok'Room"}
            </p>
            <p className="text-sm text-gray-600">
              {listing.owner.email ?? ""}
            </p>
          </aside>

          {/* Localisation approximative avec logo Lok'Room */}
          {hasCoords && (
            <section className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">
                Localisation approximative
              </h3>
              <p className="text-xs text-gray-500">
                La position exacte sera communiquée après la réservation.
              </p>
              <div className="mt-2 h-64 w-full overflow-hidden rounded-2xl border bg-gray-100">
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
            </section>
          )}

          {/* Avis sur l'annonce */}
          <ListingReviews listingId={listing.id} />
        </div>

        {/* Colonne droite : carte réservation */}
        <aside className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xl font-semibold">
                {priceFormatted}
                <span className="text-sm font-normal text-gray-600">
                  {" "}
                  / nuit
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Taxes et frais ajoutés au moment du paiement.
              </p>
            </div>
          </div>

          {!isOwner ? (
            <BookingForm
              listingId={listing.id}
              price={listing.price}
              currency={listing.currency}
            />
          ) : (
            <p className="text-xs text-gray-500">
              Tu es le propriétaire de cette annonce.
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
            Éditer l&apos;annonce
          </Link>
          <DeleteListingButton id={listing.id} />
        </div>
      )}
    </main>
  );
}
