// apps/web/src/app/listings/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditListingForm from "@/components/EditListingForm";
import EditListingImages from "@/components/EditListingImages";
import { getOrigin } from "@/lib/origin";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const origin = getOrigin();
  const res = await fetch(`${origin}/api/listings/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) return notFound();
  const { listing } = await res.json();

  const session = await getServerSession(authOptions);
  const isOwner =
    !!session?.user?.email && listing?.owner?.email === session.user.email;

  if (!isOwner) return notFound();

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Éditer l’annonce</h1>

        <Link
          href={`/listings/${listing.id}`}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
          prefetch={false}
        >
          ← Revenir à l’annonce
        </Link>
      </div>

      <EditListingForm
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: listing.currency,
          country: listing.country,
          city: listing.city ?? undefined,
          addressFull: listing.addressFull ?? "",
        }}
      />

      <EditListingImages
        listingId={listing.id}
        initialImages={listing.images ?? []}
      />
    </section>
  );
}
