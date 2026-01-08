// apps/web/src/app/host/listings/[id]/instant-book/page.tsx
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InstantBookSettings from "@/components/InstantBookSettings";
import { BoltIcon, ArrowLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function InstantBookPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/host/listings");
  }

  const listingId = params.id;

  // Récupérer l'annonce avec ses paramètres instant book
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      owner: { select: { email: true } },
      instantBookSettings: true,
      images: { take: 1, orderBy: { position: "asc" } },
    },
  });

  if (!listing) {
    return notFound();
  }

  // Vérifier que l'utilisateur est le propriétaire
  if (listing.owner.email !== session.user.email) {
    return notFound();
  }

  // Récupérer les statistiques
  const [totalBookings, instantBookings, recentBookings] = await Promise.all([
    prisma.booking.count({
      where: { listingId, status: "CONFIRMED" },
    }),
    // Approximation: réservations créées quand instant book était activé
    prisma.booking.count({
      where: {
        listingId,
        status: "CONFIRMED",
        listing: { isInstantBook: true },
      },
    }),
    prisma.booking.findMany({
      where: { listingId, status: "CONFIRMED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        currency: true,
        createdAt: true,
        guest: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/listings/${listingId}/edit`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Retour à l&apos;annonce</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-amber-500" />
            <h1 className="text-lg font-semibold text-gray-900">Réservation instantanée</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        {/* Info annonce */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
          {listing.images[0] && (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.images[0].url}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900 truncate">{listing.title}</h2>
            <p className="text-sm text-gray-500">
              {listing.city}, {listing.country}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              {listing.price} {listing.currency}
            </p>
            <p className="text-xs text-gray-500">par nuit</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Colonne principale - Paramètres */}
          <div className="lg:col-span-2">
            <InstantBookSettings
              listingId={listingId}
              initialEnabled={listing.isInstantBook}
              initialSettings={
                listing.instantBookSettings
                  ? {
                      requireVerifiedId: listing.instantBookSettings.requireVerifiedId,
                      requirePositiveReviews: listing.instantBookSettings.requirePositiveReviews,
                      minGuestRating: listing.instantBookSettings.minGuestRating,
                      requireProfilePhoto: listing.instantBookSettings.requireProfilePhoto,
                      requirePhoneVerified: listing.instantBookSettings.requirePhoneVerified,
                      maxNights: listing.instantBookSettings.maxNights,
                      minNights: listing.instantBookSettings.minNights,
                      advanceNoticeHours: listing.instantBookSettings.advanceNoticeHours,
                      autoMessage: listing.instantBookSettings.autoMessage,
                    }
                  : null
              }
            />
          </div>

          {/* Colonne latérale - Statistiques */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Statistiques</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réservations totales</span>
                  <span className="font-semibold text-gray-900">{totalBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réservations instantanées</span>
                  <span className="font-semibold text-amber-600">{instantBookings}</span>
                </div>
                {totalBookings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux instant book</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((instantBookings / totalBookings) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dernières réservations */}
            {recentBookings.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Dernières réservations</h3>
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {booking.guest.profile?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={booking.guest.profile.avatarUrl}
                            alt={booking.guest.name || "Guest"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                            {(booking.guest.name?.[0] || "?").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.guest.name || "Voyageur"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.startDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(booking.endDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.totalPrice} {booking.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/host/bookings"
                  className="mt-4 block text-center text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Voir toutes les réservations
                </Link>
              </div>
            )}

            {/* Aide */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <BoltIcon className="h-6 w-6 text-amber-500 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">
                    Pourquoi activer la réservation instantanée ?
                  </h3>
                  <ul className="space-y-2 text-sm text-amber-700">
                    <li>• Plus de réservations grâce à la simplicité</li>
                    <li>• Meilleur classement dans les résultats de recherche</li>
                    <li>• Les voyageurs préfèrent les annonces instant book</li>
                    <li>• Moins de gestion manuelle des demandes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
