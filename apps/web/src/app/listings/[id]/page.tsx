// apps/web/src/app/listings/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DeleteListingButton from "@/components/DeleteListingButton";
import ListingGallery from "@/components/ListingGallery";
import FavoriteButton from "@/components/FavoriteButton";
import { cookies } from "next/headers";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import BookingForm from "@/components/BookingForm";
import { getOrigin } from "@/lib/origin"; // ✅ pour gérer 3000/3003/etc. ou le domaine prod

// pas de cache pour éviter les 404 fantômes
export const revalidate = 0;
export const dynamic = "force-dynamic";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number; // float
  currency: Currency; // "EUR" | "CAD"
  country: string;
  city: string | null;
  createdAt: string;

  // nouveaux champs (on ne les affiche pas encore tous,
  // mais ça permet de les avoir sous la main)
  addressFull: string;
  lat: number;
  lng: number;
  latPublic: number;
  lngPublic: number;

  images: { id: string; url: string }[];
  owner: { id: string; name: string | null; email: string | null };
};

async function getListing(id: string): Promise<Listing | null> {
  const origin = getOrigin(); // ✅ reconstruit l’origine (env → headers → fallback localhost)
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
    (cookies().get("currency")?.value as Currency) ?? "EUR";
  const priceFormatted = await formatMoneyAsync(
    listing.price,
    listing.currency,
    displayCurrency
  );

  const locationLabel = [
    listing.city ?? undefined,
    listing.country ?? undefined,
  ]
    .filter(Boolean)
    .join(", ");

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

      {/* Galerie dans une grosse carte */}
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
            {/* Bouton partager (sobre, sans logique pour l’instant) */}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-black"
            >
              <span>Partager</span>
            </button>

            {/* Bouton favoris existant */}
            <FavoriteButton listingId={listing.id} />
          </div>
        </div>
      </section>

      {/* Corps : deux colonnes comme Airbnb */}
      <section className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Colonne gauche : détails + hôte */}
        <div className="flex-1 space-y-6">
          {/* Bloc hôte résumé */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-semibold">
                Logement proposé par{" "}
                {listing.owner.name || "un hôte Lok&apos;Room"}
              </h2>
              <p className="text-sm text-gray-600">{locationLabel}</p>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border px-3 py-2 text-xs text-gray-600 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold">
                {(listing.owner.name?.[0] || "?").toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <p className="font-medium">
                  {listing.owner.name || "Hôte Lok&apos;Room"}
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

          {/* Bloc “Ce qu’il faut savoir” simplifié */}
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

          {/* Infos hôte plus détaillées */}
          <aside className="space-y-1">
            <p className="text-sm text-gray-600">Hôte</p>
            <p className="font-medium">
              {listing.owner.name ?? "Utilisateur Lok&apos;Room"}
            </p>
            <p className="text-sm text-gray-600">
              {listing.owner.email ?? ""}
            </p>
          </aside>
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

          {/* BookingForm existant, intégré dans la carte */}
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

      {/* Actions propriétaire (éditer / supprimer) */}
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
