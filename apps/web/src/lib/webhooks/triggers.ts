/**
 * Lok'Room - Intégration des webhooks dans les événements métier
 * Ce fichier contient les fonctions pour déclencher les webhooks lors d'événements
 */

import { triggerWebhook, WEBHOOK_EVENTS } from "@/lib/webhooks/service";
import type { Booking, Listing, Review, Message } from "@prisma/client";

/**
 * Déclenche un webhook lors de la création d'une réservation
 */
export async function onBookingCreated(booking: Booking & { listing?: { ownerId: string } }) {
  const data = {
    id: booking.id,
    listingId: booking.listingId,
    guestId: booking.guestId,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
    pricingMode: booking.pricingMode,
    createdAt: booking.createdAt.toISOString(),
  };

  // Envoyer au guest
  await triggerWebhook(WEBHOOK_EVENTS.BOOKING_CREATED, data, booking.guestId);

  // Envoyer au host si disponible
  if (booking.listing?.ownerId) {
    await triggerWebhook(WEBHOOK_EVENTS.BOOKING_CREATED, data, booking.listing.ownerId);
  }
}

/**
 * Déclenche un webhook lors de la confirmation d'une réservation
 */
export async function onBookingConfirmed(booking: Booking & { listing?: { ownerId: string } }) {
  const data = {
    id: booking.id,
    listingId: booking.listingId,
    guestId: booking.guestId,
    status: booking.status,
    confirmedAt: new Date().toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.BOOKING_CONFIRMED, data, booking.guestId);

  if (booking.listing?.ownerId) {
    await triggerWebhook(WEBHOOK_EVENTS.BOOKING_CONFIRMED, data, booking.listing.ownerId);
  }
}

/**
 * Déclenche un webhook lors de l'annulation d'une réservation
 */
export async function onBookingCancelled(
  booking: Booking & { listing?: { ownerId: string } },
  cancelReason?: string
) {
  const data = {
    id: booking.id,
    listingId: booking.listingId,
    guestId: booking.guestId,
    status: booking.status,
    cancelledAt: booking.cancelledAt?.toISOString(),
    cancelledByUserId: booking.cancelledByUserId,
    cancelReason,
  };

  await triggerWebhook(WEBHOOK_EVENTS.BOOKING_CANCELLED, data, booking.guestId);

  if (booking.listing?.ownerId) {
    await triggerWebhook(WEBHOOK_EVENTS.BOOKING_CANCELLED, data, booking.listing.ownerId);
  }
}

/**
 * Déclenche un webhook lors de la complétion d'une réservation
 */
export async function onBookingCompleted(booking: Booking & { listing?: { ownerId: string } }) {
  const data = {
    id: booking.id,
    listingId: booking.listingId,
    guestId: booking.guestId,
    status: booking.status,
    completedAt: new Date().toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.BOOKING_COMPLETED, data, booking.guestId);

  if (booking.listing?.ownerId) {
    await triggerWebhook(WEBHOOK_EVENTS.BOOKING_COMPLETED, data, booking.listing.ownerId);
  }
}

/**
 * Déclenche un webhook lors de la création d'une annonce
 */
export async function onListingCreated(listing: Listing) {
  const data = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    country: listing.country,
    city: listing.city,
    type: listing.type,
    ownerId: listing.ownerId,
    createdAt: listing.createdAt.toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.LISTING_CREATED, data, listing.ownerId);
}

/**
 * Déclenche un webhook lors de la mise à jour d'une annonce
 */
export async function onListingUpdated(listing: Listing) {
  const data = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    ownerId: listing.ownerId,
    updatedAt: listing.updatedAt.toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.LISTING_UPDATED, data, listing.ownerId);
}

/**
 * Déclenche un webhook lors de la suppression d'une annonce
 */
export async function onListingDeleted(listingId: string, ownerId: string) {
  const data = {
    id: listingId,
    ownerId,
    deletedAt: new Date().toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.LISTING_DELETED, data, ownerId);
}

/**
 * Déclenche un webhook lors de la création d'un avis
 */
export async function onReviewCreated(review: Review) {
  const data = {
    id: review.id,
    bookingId: review.bookingId,
    listingId: review.listingId,
    authorId: review.authorId,
    targetUserId: review.targetUserId,
    rating: review.rating,
    comment: review.comment,
    type: review.type,
    createdAt: review.createdAt.toISOString(),
  };

  // Envoyer à l'auteur
  await triggerWebhook(WEBHOOK_EVENTS.REVIEW_CREATED, data, review.authorId);

  // Envoyer à la cible
  await triggerWebhook(WEBHOOK_EVENTS.REVIEW_CREATED, data, review.targetUserId);
}

/**
 * Déclenche un webhook lors de la réception d'un message
 */
export async function onMessageReceived(
  message: Message,
  recipientId: string
) {
  const data = {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.MESSAGE_RECEIVED, data, recipientId);
}

/**
 * Déclenche un webhook lors d'un paiement réussi
 */
export async function onPaymentSucceeded(
  bookingId: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  userId: string
) {
  const data = {
    bookingId,
    amount,
    currency,
    paymentIntentId,
    status: "succeeded",
    timestamp: new Date().toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.PAYMENT_SUCCEEDED, data, userId);
}

/**
 * Déclenche un webhook lors d'un paiement échoué
 */
export async function onPaymentFailed(
  bookingId: string,
  amount: number,
  currency: string,
  paymentIntentId: string,
  userId: string,
  errorMessage?: string
) {
  const data = {
    bookingId,
    amount,
    currency,
    paymentIntentId,
    status: "failed",
    errorMessage,
    timestamp: new Date().toISOString(),
  };

  await triggerWebhook(WEBHOOK_EVENTS.PAYMENT_FAILED, data, userId);
}
