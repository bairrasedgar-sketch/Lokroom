// apps/web/src/app/listings/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DeleteListingButton from "@/components/DeleteListingButton";
import ListingGallery from "@/components/ListingGallery";
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
  price: number;      // float
  currency: Currency; // "EUR" | "CAD"
  country: string;
  city: string | null;
  createdAt: string;
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
}: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) return notFound();

  const session = await getServerSession(authOptions);
  const isOwner =
    !!session?.user?.email && listing.owner.email === session.user.email;

  const displayCurrency = (cookies().get("currency")?.value as Currency) ?? "EUR";
  const priceFormatted = await formatMoneyAsync(
    listing.price,
    listing.currency,
    displayCurrency
  );

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/listings" className="text-sm text-gray-600 hover:underline">
          ← Retour aux annonces
        </Link>
        <div className="text-xs text-gray-500">
          Publié le {new Date(listing.createdAt).toLocaleDateString()}
        </div>
      </div>

      <ListingGallery images={listing.images ?? []} aspect={4 / 3} />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{listing.title}</h1>
        <p className="text-gray-600">
          {listing.city ? `${listing.city}, ` : ""}
          {listing.country}
        </p>
        <p className="text-lg font-semibold">{priceFormatted}</p>
      </header>

      {!isOwner && (
        <BookingForm
          listingId={listing.id}
          price={listing.price}
          currency={listing.currency}
        />
      )}

      <article className="prose max-w-none">
        <p className="whitespace-pre-wrap">{listing.description}</p>
      </article>

      <aside className="rounded border p-4">
        <p className="text-sm text-gray-600">Hôte</p>
        <p className="font-medium">{listing.owner.name ?? "Utilisateur"}</p>
        <p className="text-sm text-gray-600">{listing.owner.email ?? ""}</p>
      </aside>

      {isOwner && (
        <div className="flex gap-3 pt-4">
          <Link
            href={`/listings/${listing.id}/edit`}
            className="rounded bg-black text-white px-3 py-2 text-sm"
          >
            Éditer
          </Link>
          <DeleteListingButton id={listing.id} />
        </div>
      )}
    </section>
  );
}
