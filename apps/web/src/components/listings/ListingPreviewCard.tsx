import Link from "next/link";
import Image from "next/image";

type ListingCardFixed = {
  id: string;
  title: string;
  country: string;
  city: string | null;
  type: string;
  createdAt: string | Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  latPublic: number | null;
  lngPublic: number | null;
  lat: number | null;
  lng: number | null;
};

type ListingPreviewCardProps = {
  listing: ListingCardFixed;
  onClose: () => void;
};

export function ListingPreviewCard({ listing, onClose }: ListingPreviewCardProps) {
  const cover = listing.images?.[0]?.url ?? null;

  const createdAt =
    listing.createdAt instanceof Date
      ? listing.createdAt
      : new Date(listing.createdAt);

  return (
    <div className="relative flex h-44 w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-white text-xs shadow-xl sm:h-56 sm:text-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-gray-800 shadow"
        aria-label="Fermer l'aperçu"
      >
        ×
      </button>

      <Link href={`/listings/${listing.id}`} className="flex flex-1 flex-col">
        <div className="relative flex-[1.4] w-full bg-gray-100">
          {cover ? (
            <Image
              src={cover}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="256px"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
              Pas d&apos;image
            </div>
          )}
        </div>

        <div className="flex flex-[1] flex-col justify-between overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
          <div className="space-y-0.5">
            <h3 className="line-clamp-1 text-[13px] font-semibold sm:line-clamp-2 sm:text-sm">
              {listing.title}
            </h3>
            <p className="line-clamp-1 text-[10px] text-gray-500 sm:text-[11px]">
              {listing.city ? `${listing.city}, ` : ""}
              {listing.country} · {createdAt.toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-0.5 pt-1">
            <p className="text-[12px] font-semibold sm:text-sm">
              {listing.priceFormatted}
            </p>
            <p className="text-[10px] text-gray-500 sm:text-[11px]">
              Cliquer pour voir les détails
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
