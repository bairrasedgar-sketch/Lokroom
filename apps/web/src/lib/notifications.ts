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
      actionUrl: `/disputes/${disputeId}`,
      data: {
        disputeId,
        bookingId: dispute.bookingId,
        resolution,
      },
    });
  }
}

/**
 * Notification de mise à jour d'un litige
 */
export async function notifyDisputeUpdate(disputeId: string, updateType: string) {
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

  const messages: Record<string, string> = {
    message: "Nouveau message dans votre litige",
    evidence: "Une nouvelle preuve a été ajoutée au litige",
    status: "Le statut de votre litige a été mis à jour",
    assigned: "Un administrateur a été assigné à votre litige",
    escalated: "Votre litige a été escaladé",
  };

  // Notifier les deux parties
  const parties = [dispute.booking.guestId, dispute.booking.listing.ownerId];

  for (const usrId of parties) {
    await createNotification({
      userId: usrId,
      type: "DISPUTE_UPDATE",
      title: "Mise à jour du litige",
      message: messages[updateType] || "Votre litige a été mis à jour",
      actionUrl: `/disputes/${disputeId}`,
      data: {
        disputeId,
        bookingId: dispute.bookingId,
        updateType,
      },
    });
  }
}

/**
 * Notification de réponse à un avis
 */
export async function notifyReviewResponse(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      author: true,
      targetUser: true,
      listing: true,
    },
  });

  if (!review || !review.response) return;

  await createNotification({
    userId: review.authorId,
    type: "REVIEW_RECEIVED",
    title: "Réponse à votre avis",
    message: `${review.targetUser.name || "L'hôte"} a répondu à votre avis sur ${review.listing.title}`,
    actionUrl: `/listings/${review.listingId}#reviews`,
    data: {
      reviewId,
      listingId: review.listingId,
    },
  });
}

/**
 * Notification pour rappeler de laisser un avis (après checkout)
 */
export async function notifyReviewReminderBoth(bookingId: string) {
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

  // Rappeler au voyageur
  await createNotification({
    userId: booking.guestId,
    type: "REVIEW_REMINDER",
    title: "Partagez votre expérience",
    message: `Comment s'est passé votre séjour à ${booking.listing.title} ? Laissez un avis !`,
    actionUrl: `/reviews/new?bookingId=${bookingId}`,
    data: {
      bookingId,
      listingId: booking.listingId,
      type: "GUEST_TO_HOST",
    },
  });

  // Rappeler à l'hôte
  await createNotification({
    userId: booking.listing.ownerId,
    type: "REVIEW_REMINDER",
    title: "Évaluez votre voyageur",
    message: `Comment s'est passé le séjour de ${booking.guest.name || "votre voyageur"} ?`,
    actionUrl: `/reviews/new?bookingId=${bookingId}`,
    data: {
      bookingId,
      guestId: booking.guestId,
      type: "HOST_TO_GUEST",
    },
  });
}

/**
 * Notifications pour les dépôts de garantie (caution)
 */

/**
 * Notification au guest quand la caution est autorisée
 */
export async function notifySecurityDepositAuthorized(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: true,
      securityDeposit: true,
    },
  });

  if (!booking || !booking.securityDeposit) return;

  const deposit = booking.securityDeposit;
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: deposit.currency,
  }).format(deposit.amountCents / 100);

  await createNotification({
    userId: booking.guestId,
    type: "SECURITY_DEPOSIT_AUTHORIZED",
    title: "Caution autorisée",
    message: `Une caution de ${formattedAmount} a été autorisée pour votre réservation à ${booking.listing.title}`,
    actionUrl: `/reservations/${bookingId}`,
    data: {
      bookingId,
      depositId: deposit.id,
      amountCents: deposit.amountCents,
      currency: deposit.currency,
    },
  });
}

/**
 * Notification au guest quand la caution est libérée
 */
export async function notifySecurityDepositReleased(bookingId: string, automatic: boolean = false) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: true,
      securityDeposit: true,
    },
  });

  if (!booking || !booking.securityDeposit) return;

  const deposit = booking.securityDeposit;
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: deposit.currency,
  }).format(deposit.amountCents / 100);

  const message = automatic
    ? `Votre caution de ${formattedAmount} a été libérée automatiquement. Aucun dommage n'a été signalé.`
    : `Votre caution de ${formattedAmount} a été libérée par l'hôte.`;

  await createNotification({
    userId: booking.guestId,
    type: "SECURITY_DEPOSIT_RELEASED",
    title: "Caution libérée",
    message,
    actionUrl: `/reservations/${bookingId}`,
    data: {
      bookingId,
      depositId: deposit.id,
      amountCents: deposit.amountCents,
      currency: deposit.currency,
      automatic,
    },
  });
}

/**
 * Notification au guest quand une partie ou la totalité de la caution est capturée
 */
export async function notifySecurityDepositCaptured(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: true,
      securityDeposit: true,
    },
  });

  if (!booking || !booking.securityDeposit) return;

  const deposit = booking.securityDeposit;
  const capturedAmount = deposit.capturedAmountCents || 0;
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: deposit.currency,
  }).format(capturedAmount / 100);

  await createNotification({
    userId: booking.guestId,
    type: "SECURITY_DEPOSIT_CAPTURED",
    title: "Réclamation sur votre caution",
    message: `${formattedAmount} ont été retenus sur votre caution. Raison: ${deposit.captureReason || "Non spécifiée"}`,
    actionUrl: `/reservations/${bookingId}`,
    data: {
      bookingId,
      depositId: deposit.id,
      capturedAmountCents: capturedAmount,
      reason: deposit.captureReason,
      currency: deposit.currency,
    },
  });
}

/**
 * Notification à l'hôte pour lui rappeler de vérifier les dommages
 */
export async function notifySecurityDepositClaimReminder(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        include: {
          owner: true,
          securityDepositPolicy: true,
        },
      },
      guest: true,
      securityDeposit: true,
    },
  });

  if (!booking || !booking.securityDeposit) return;

  const deposit = booking.securityDeposit;
  const policy = booking.listing.securityDepositPolicy;
  const refundDays = policy?.refundDays || 7;

  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: deposit.currency,
  }).format(deposit.amountCents / 100);

  await createNotification({
    userId: booking.listing.ownerId,
    type: "SECURITY_DEPOSIT_CLAIM_REQUEST",
    title: "Vérifiez les dommages éventuels",
    message: `Le séjour de ${booking.guest.name || "votre voyageur"} est terminé. Vous avez ${refundDays} jours pour réclamer la caution de ${formattedAmount} en cas de dommages.`,
    actionUrl: `/host/bookings?id=${bookingId}`,
    data: {
      bookingId,
      depositId: deposit.id,
      amountCents: deposit.amountCents,
      currency: deposit.currency,
      expiresAt: deposit.expiresAt.toISOString(),
    },
  });
}
