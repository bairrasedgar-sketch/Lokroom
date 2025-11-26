// apps/web/src/lib/bookingFees.ts
import { prisma } from "@/lib/db";
import {
  computeFees,
  inferRegion,
  type Currency,
  type FeeBreakdown,
} from "@/lib/fees";

/**
 * Lignes prêtes à être affichées façon Airbnb dans le checkout.
 */
export type ClientFeeLine = {
  code: "base" | "service_guest" | "taxes" | "total";
  label: string;
  amountCents: number;
  emphasize?: boolean;
};

export type ClientFeeBreakdown = {
  currency: Currency;
  nights: number;
  basePriceCents: number;
  lines: ClientFeeLine[];
  fees: FeeBreakdown;
  hostPayoutCents: number;
  platformNetCents: number;
};

/**
 * Applique les frais Lok'Room à une Booking existante
 * et persiste le snapshot dans la table Booking.
 */
export async function applyFeesToBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          ownerId: true,
          country: true,
          province: true,
        },
      },
    },
  });

  if (!booking || !booking.listing) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  // totalPrice est stocké dans la devise de l'annonce
  const priceCents = Math.round(booking.totalPrice * 100);

  const region = inferRegion({
    currency: booking.currency as Currency,
    country: booking.listing.country,
    provinceCode: booking.listing.province,
  });

  const fees = computeFees({
    priceCents,
    currency: booking.currency as Currency,
    region,
  });

  const platformNetCents =
    fees.hostFeeCents +
    fees.guestFeeCents +
    fees.taxOnGuestFeeCents -
    fees.stripeEstimateCents;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      hostFeeCents: fees.hostFeeCents,
      guestFeeCents: fees.guestFeeCents,
      taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
      stripeFeeEstimateCents: fees.stripeEstimateCents,
      platformNetCents,
    },
  });

  return {
    fees,
    hostUserId: booking.listing.ownerId,
    platformNetCents,
  };
}

/**
 * Helper pour le checkout : construit les lignes de prix façon Airbnb.
 *
 * Exemple de rendu :
 * - "Prix (3 nuits)"         -> base
 * - "Frais de service Lok’Room"  -> guestFee
 * - "Taxes sur les frais"    -> taxes
 * - "Total (payé par vous)"  -> total
 */
export function buildClientFeeBreakdown(params: {
  nights: number;
  pricePerNight: number;
  currency: Currency;
  region: FeeBreakdown["region"];
}): ClientFeeBreakdown {
  const { nights, pricePerNight, currency, region } = params;

  const basePrice = pricePerNight * nights;
  const basePriceCents = Math.round(basePrice * 100);

  const fees = computeFees({
    priceCents: basePriceCents,
    currency,
    region,
  });

  const totalChargeCents =
    basePriceCents + fees.guestFeeCents + fees.taxOnGuestFeeCents;

  const platformNetCents =
    fees.hostFeeCents +
    fees.guestFeeCents +
    fees.taxOnGuestFeeCents -
    fees.stripeEstimateCents;

  const lines: ClientFeeLine[] = [
    {
      code: "base",
      label:
        nights > 1
          ? `Prix (${nights} nuits)`
          : "Prix (1 nuit)",
      amountCents: basePriceCents,
    },
    {
      code: "service_guest",
      label: "Frais de service Lok’Room",
      amountCents: fees.guestFeeCents,
    },
    {
      code: "taxes",
      label: "Taxes sur les frais",
      amountCents: fees.taxOnGuestFeeCents,
    },
    {
      code: "total",
      label: "Total (payé par vous)",
      amountCents: totalChargeCents,
      emphasize: true,
    },
  ];

  return {
    currency,
    nights,
    basePriceCents,
    lines,
    fees,
    hostPayoutCents: fees.hostPayoutCents,
    platformNetCents,
  };
}
