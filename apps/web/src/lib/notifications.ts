import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
};

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  actionUrl,
  data,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl: actionUrl || null,
        data: data as object | undefined,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Notifications pour les réservations
 */
export async function notifyBookingRequest(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: { owner: true },
      },
      guest: true,
    },
  });

  if (!booking) return;

  // Notifier l'hôte
  await createNotification({
    userId: booking.listing.ownerId,
    type: "BOOKING_REQUEST",
    title: "Nouvelle demande de réservation",
    message: `${booking.guest.name || "Un voyageur"} souhaite réserver ${booking.listing.title}`,
    actionUrl: `/host/bookings?id=${bookingId}`,
    data: {
      bookingId,
      listingId: booking.listingId,
      guestId: booking.guestId,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
    },
  });
}

export async function notifyBookingConfirmed(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: { owner: true },
      },
      guest: true,
    },
  });

  if (!booking) return;

  // Notifier le voyageur
  await createNotification({
    userId: booking.guestId,
    type: "BOOKING_CONFIRMED",
    title: "Réservation confirmée !",
    message: `Votre réservation pour ${booking.listing.title} a été confirmée`,
    actionUrl: `/reservations/${bookingId}`,
    data: {
      bookingId,
      listingId: booking.listingId,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
    },
  });

  // Notifier l'hôte
  await createNotification({
    userId: booking.listing.ownerId,
    type: "BOOKING_CONFIRMED",
    title: "Réservation confirmée",
    message: `La réservation de ${booking.guest.name || "un voyageur"} est confirmée`,
    actionUrl: `/host/bookings?id=${bookingId}`,
    data: {
      bookingId,
      listingId: booking.listingId,
      guestId: booking.guestId,
    },
  });
}

export async function notifyBookingCancelled(bookingId: string, cancelledBy: "guest" | "host" | "system") {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: { owner: true },
      },
      guest: true,
    },
  });

  if (!booking) return;

  const cancelledByText = cancelledBy === "guest" ? "le voyageur" : cancelledBy === "host" ? "l'hôte" : "le système";

  // Notifier le voyageur (si annulé par l'hôte ou le système)
  if (cancelledBy !== "guest") {
    await createNotification({
      userId: booking.guestId,
      type: "BOOKING_CANCELLED",
      title: "Réservation annulée",
      message: `Votre réservation pour ${booking.listing.title} a été annulée par ${cancelledByText}`,
      actionUrl: `/reservations/${bookingId}`,
      data: {
        bookingId,
        cancelledBy,
      },
    });
  }

  // Notifier l'hôte (si annulé par le voyageur ou le système)
  if (cancelledBy !== "host") {
    await createNotification({
      userId: booking.listing.ownerId,
      type: "BOOKING_CANCELLED",
      title: "Réservation annulée",
      message: `La réservation de ${booking.guest.name || "un voyageur"} a été annulée par ${cancelledByText}`,
      actionUrl: `/host/bookings?id=${bookingId}`,
      data: {
        bookingId,
        cancelledBy,
      },
    });
  }
}

/**
 * Notifications pour les messages
 */
export async function notifyNewMessage(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: {
          guest: true,
          host: true,
          listing: true,
        },
      },
      sender: true,
    },
  });

  if (!message) return;

  const conv = message.conversation;
  const recipientId = message.senderId === conv.guestId ? conv.hostId : conv.guestId;

  await createNotification({
    userId: recipientId,
    type: "MESSAGE_NEW",
    title: `Nouveau message de ${message.sender.name || "quelqu'un"}`,
    message: message.content.substring(0, 100) + (message.content.length > 100 ? "..." : ""),
    actionUrl: `/messages?conversation=${conv.id}`,
    data: {
      messageId,
      conversationId: conv.id,
      senderId: message.senderId,
      listingId: conv.listingId,
    },
  });
}

/**
 * Notifications pour les avis
 */
export async function notifyReviewReceived(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      author: true,
      booking: {
        include: { listing: true },
      },
    },
  });

  if (!review) return;

  await createNotification({
    userId: review.targetUserId,
    type: "REVIEW_RECEIVED",
    title: "Nouvel avis reçu !",
    message: `${review.author.name || "Un utilisateur"} vous a laissé un avis ${review.rating >= 4 ? "positif" : ""}`,
    actionUrl: `/profile?tab=reviews`,
    data: {
      reviewId,
      rating: review.rating,
      authorId: review.authorId,
    },
  });
}

export async function notifyReviewReminder(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: true,
    },
  });

  if (!booking) return;

  // Rappeler au voyageur de laisser un avis
  await createNotification({
    userId: booking.guestId,
    type: "REVIEW_REMINDER",
    title: "N'oubliez pas de laisser un avis",
    message: `Comment s'est passé votre séjour à ${booking.listing.title} ?`,
    actionUrl: `/reservations/${bookingId}?review=true`,
    data: {
      bookingId,
      listingId: booking.listingId,
    },
  });
}

/**
 * Notifications pour les paiements
 */
export async function notifyPayoutSent(userId: string, amount: number, currency: string) {
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount / 100);

  await createNotification({
    userId,
    type: "PAYOUT_SENT",
    title: "Virement envoyé",
    message: `Un virement de ${formattedAmount} a été envoyé sur votre compte`,
    actionUrl: `/host/wallet`,
    data: {
      amount,
      currency,
    },
  });
}

export async function notifyPayoutFailed(userId: string, amount: number, currency: string, reason: string) {
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount / 100);

  await createNotification({
    userId,
    type: "PAYOUT_FAILED",
    title: "Échec du virement",
    message: `Le virement de ${formattedAmount} a échoué. ${reason}`,
    actionUrl: `/host/wallet`,
    data: {
      amount,
      currency,
      reason,
    },
  });
}

/**
 * Notifications pour les annonces
 */
export async function notifyListingApproved(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return;

  await createNotification({
    userId: listing.ownerId,
    type: "LISTING_APPROVED",
    title: "Annonce approuvée !",
    message: `Votre annonce "${listing.title}" est maintenant en ligne`,
    actionUrl: `/listings/${listingId}`,
    data: {
      listingId,
    },
  });
}

export async function notifyListingRejected(listingId: string, reason: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) return;

  await createNotification({
    userId: listing.ownerId,
    type: "LISTING_REJECTED",
    title: "Annonce refusée",
    message: `Votre annonce "${listing.title}" n'a pas été approuvée. ${reason}`,
    actionUrl: `/listings/${listingId}/edit`,
    data: {
      listingId,
      reason,
    },
  });
}

/**
 * Notifications pour les litiges
 */
export async function notifyDisputeOpened(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          listing: true,
          guest: true,
        },
      },
      openedBy: true,
    },
  });

  if (!dispute) return;

  const otherPartyId = dispute.openedById === dispute.booking.guestId
    ? dispute.booking.listing.ownerId
    : dispute.booking.guestId;

  await createNotification({
    userId: otherPartyId,
    type: "DISPUTE_OPENED",
    title: "Un litige a été ouvert",
    message: `Un litige concernant la réservation a été ouvert`,
    actionUrl: `/reservations/${dispute.bookingId}`,
    data: {
      disputeId,
      bookingId: dispute.bookingId,
    },
  });
}

export async function notifyDisputeResolved(disputeId: string, resolution: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          listing: true,
          guest: true,
        },
      },
    },
  });

  if (!dispute) return;

  // Notifier les deux parties
  const parties = [dispute.booking.guestId, dispute.booking.listing.ownerId];

  for (const usrId of parties) {
    await createNotification({
      userId: usrId,
      type: "DISPUTE_RESOLVED",
      title: "Litige résolu",
      message: `Le litige a été résolu. ${resolution}`,
      actionUrl: `/reservations/${dispute.bookingId}`,
      data: {
        disputeId,
        bookingId: dispute.bookingId,
        resolution,
      },
    });
  }
}
