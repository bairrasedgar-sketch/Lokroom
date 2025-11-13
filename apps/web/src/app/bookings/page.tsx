// apps/web/src/app/bookings/page.tsx
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { formatMoneyAsync, type Currency } from "@/lib/currency";

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: Currency;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  listing: {
    id: string;
    title: string;
    price: number;
    currency: Currency;
    images: { id: string; url: string }[];
  };
};

// Construit une URL absolue (dev/prod) à partir des en-têtes de la requête
function makeAbsUrl(path: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ??
    "localhost:3000";
  return `${proto}://${host}${path}`;
}

async function getMyBookings(): Promise<Booking[]> {
  try {
    const url = makeAbsUrl("/api/bookings");
    const cookie = cookies().toString(); // forward session cookies
    const res = await fetch(url, {
      cache: "no-store",
      headers: { cookie },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.bookings ?? []) as Booking[];
  } catch {
    return [];
  }
}

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams?: { paid?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <section className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">Mes réservations</h1>
        <p>Merci de vous connecter.</p>
      </section>
    );
  }

  const displayCurrency = (cookies().get("currency")?.value as Currency) ?? "EUR";
  const bookings = await getMyBookings();
  const paidOK = searchParams?.paid === "1";

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      {paidOK && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
          🎉 Paiement confirmé ! Votre réservation est en cours de traitement.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes réservations</h1>
        <Link href="/listings" className="text-sm underline">
          Voir toutes les annonces
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune réservation pour l’instant.</p>
      ) : (
        <ul className="space-y-4">
          {await Promise.all(
            bookings.map(async (b) => {
              const cover = b.listing.images?.[0]?.url;
              const totalFmt = await formatMoneyAsync(
                b.totalPrice,
                b.currency,
                displayCurrency
              );
              return (
                <li key={b.id} className="rounded border p-3 flex gap-3">
                  <div className="relative h-20 w-28 bg-gray-50 rounded overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={b.listing.title}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-gray-400 text-xs">
                        Pas d’image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/listings/${b.listing.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.listing.title}
                    </Link>
                    <div className="text-sm text-gray-600">
                      {new Date(b.startDate).toLocaleDateString()} →{" "}
                      {new Date(b.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      Total : <span className="font-semibold">{totalFmt}</span> · Statut : {b.status}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </section>
  );
}
