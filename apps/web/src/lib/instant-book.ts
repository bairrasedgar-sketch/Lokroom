// apps/web/src/lib/instant-book.ts
/**
 * Fonctions utilitaires pour la réservation instantanée (Instant Book)
 * Lok'Room - Système de réservation instantanée style Airbnb
 */

import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";

// ============================================================================
// TYPES
// ============================================================================

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
  criteria: {
    verifiedId: { required: boolean; met: boolean };
    positiveReviews: { required: boolean; met: boolean };
    minRating: { required: boolean; met: boolean; minValue?: number; currentValue?: number };
    profilePhoto: { required: boolean; met: boolean };
    phoneVerified: { required: boolean; met: boolean };
    nightsInRange: { required: boolean; met: boolean; min?: number; max?: number; requested?: number };
    advanceNotice: { required: boolean; met: boolean; minHours?: number; actualHours?: number };
  };
};

export type InstantBookingResult = {
  success: boolean;
  booking?: {
    id: string;
    status: string;
    totalPrice: number;
    currency: string;
  };
  conversation?: {
    id: string;
  };
  error?: string;
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Vérifie si un guest peut réserver instantanément une annonce
 */
export async function checkInstantBookEligibility(
  guestId: string,
  listingId: string,
  startDate?: Date,
  endDate?: Date
): Promise<EligibilityResult> {
  const reasons: string[] = [];

  // Récupérer l'annonce avec ses paramètres instant book
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      instantBookSettings: true,
    },
  });

  if (!listing) {
    return {
      eligible: false,
      reasons: ["Annonce introuvable"],
      criteria: getDefaultCriteria(),
    };
  }

  if (!listing.isInstantBook) {
    return {
      eligible: false,
      reasons: ["Cette annonce n'accepte pas les réservations instantanées"],
      criteria: getDefaultCriteria(),
    };
  }

  const settings = listing.instantBookSettings;

  // Récupérer les infos du guest
  const guest = await prisma.user.findUnique({
    where: { id: guestId },
    include: {
      profile: true,
      hostProfile: true,
      reviewsReceived: {
        where: { type: "HOST_TO_GUEST", status: "PUBLISHED" },
        select: { rating: true },
      },
    },
  });

  if (!guest) {
    return {
      eligible: false,
      reasons: ["Utilisateur introuvable"],
      criteria: getDefaultCriteria(),
    };
  }

  // Calculer la note moyenne du guest
  const guestRatings = guest.reviewsReceived.map((r) => r.rating);
  const guestAvgRating =
    guestRatings.length > 0
      ? guestRatings.reduce((a, b) => a + b, 0) / guestRatings.length
      : null;

  // Initialiser les critères
  const criteria: EligibilityResult["criteria"] = {
    verifiedId: { required: false, met: true },
    positiveReviews: { required: false, met: true },
    minRating: { required: false, met: true },
    profilePhoto: { required: false, met: true },
    phoneVerified: { required: false, met: true },
    nightsInRange: { required: false, met: true },
    advanceNotice: { required: false, met: true },
  };

  // Vérifier les critères si des settings existent
  if (settings) {
    // 1. Identité vérifiée
    if (settings.requireVerifiedId) {
      criteria.verifiedId.required = true;
      criteria.verifiedId.met = guest.identityStatus === "VERIFIED";
      if (!criteria.verifiedId.met) {
        reasons.push("Identité non vérifiée");
      }
    }

    // 2. Avis positifs
    if (settings.requirePositiveReviews) {
      criteria.positiveReviews.required = true;
      const hasPositiveReviews = guestRatings.length > 0 && (guestAvgRating ?? 0) >= 3.5;
      criteria.positiveReviews.met = hasPositiveReviews;
      if (!criteria.positiveReviews.met) {
        reasons.push("Aucun avis positif");
      }
    }

    // 3. Note minimum
    if (settings.minGuestRating !== null && settings.minGuestRating !== undefined) {
      criteria.minRating.required = true;
      criteria.minRating.minValue = settings.minGuestRating;
      criteria.minRating.currentValue = guestAvgRating ?? undefined;
      criteria.minRating.met =
        guestAvgRating !== null && guestAvgRating >= settings.minGuestRating;
      if (!criteria.minRating.met) {
        reasons.push(
          `Note minimum requise: ${settings.minGuestRating}/5 (actuelle: ${guestAvgRating?.toFixed(1) ?? "N/A"})`
        );
      }
    }

    // 4. Photo de profil
    if (settings.requireProfilePhoto) {
      criteria.profilePhoto.required = true;
      criteria.profilePhoto.met = !!guest.profile?.avatarUrl;
      if (!criteria.profilePhoto.met) {
        reasons.push("Photo de profil requise");
      }
    }

    // 5. Téléphone vérifié
    if (settings.requirePhoneVerified) {
      criteria.phoneVerified.required = true;
      criteria.phoneVerified.met = !!guest.hostProfile?.verifiedPhone;
      if (!criteria.phoneVerified.met) {
        reasons.push("Téléphone non vérifié");
      }
    }

    // 6. Nombre de nuits
    if (startDate && endDate) {
      const nights = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (settings.minNights !== null || settings.maxNights !== null) {
        criteria.nightsInRange.required = true;
        criteria.nightsInRange.min = settings.minNights ?? undefined;
        criteria.nightsInRange.max = settings.maxNights ?? undefined;
        criteria.nightsInRange.requested = nights;

        const minOk = settings.minNights === null || nights >= settings.minNights;
        const maxOk = settings.maxNights === null || nights <= settings.maxNights;
        criteria.nightsInRange.met = minOk && maxOk;

        if (!minOk) {
          reasons.push(`Minimum ${settings.minNights} nuit(s) requise(s)`);
        }
        if (!maxOk) {
          reasons.push(`Maximum ${settings.maxNights} nuit(s) autorisée(s)`);
        }
      }

      // 7. Préavis minimum
      if (settings.advanceNoticeHours > 0) {
        criteria.advanceNotice.required = true;
        criteria.advanceNotice.minHours = settings.advanceNoticeHours;

        const hoursUntilStart =
          (startDate.getTime() - Date.now()) / (1000 * 60 * 60);
        criteria.advanceNotice.actualHours = Math.round(hoursUntilStart);
        criteria.advanceNotice.met = hoursUntilStart >= settings.advanceNoticeHours;

        if (!criteria.advanceNotice.met) {
          reasons.push(
            `Préavis minimum de ${settings.advanceNoticeHours}h requis`
          );
        }
      }
    }
  }

  const eligible = reasons.length === 0;

  return {
    eligible,
    reasons,
    criteria,
  };
}

/**
 * Traite une réservation instantanée
 * - Crée la réservation avec statut CONFIRMED
 * - Crée la conversation automatiquement
 * - Envoie le message automatique si configuré
 */
export async function processInstantBooking(
  bookingId: string
): Promise<InstantBookingResult> {
  try {
    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            owner: true,
            instantBookSettings: true,
          },
        },
        guest: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Réservation introuvable" };
    }

    // Mettre à jour le statut à CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    // Créer ou récupérer la conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        listingId: booking.listingId,
        guestId: booking.guestId,
        hostId: booking.listing.ownerId,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: booking.listingId,
          guestId: booking.guestId,
          hostId: booking.listing.ownerId,
          reservationId: bookingId,
        },
      });
    } else {
      // Lier la conversation à la réservation si pas déjà fait
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { reservationId: bookingId },
      });
    }

    // Envoyer le message automatique si configuré
    const autoMessage = booking.listing.instantBookSettings?.autoMessage;
    if (autoMessage && conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: booking.listing.ownerId,
          content: autoMessage,
        },
      });
    }

    // Créer le blocage calendrier
    await prisma.calendarBlock.create({
      data: {
        listingId: booking.listingId,
        start: booking.startDate,
        end: booking.endDate,
        reason: "BOOKING",
        bookingId: booking.id,
      },
    });

    return {
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        totalPrice: updatedBooking.totalPrice,
        currency: updatedBooking.currency,
      },
      conversation: conversation ? { id: conversation.id } : undefined,
    };
  } catch (error) {
    console.error("[InstantBook] Error processing booking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie les notifications pour une réservation instantanée
 */
export async function sendInstantBookNotifications(bookingId: string): Promise<void> {
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

  const startDateStr = booking.startDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDateStr = booking.endDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Notification au guest
  await createNotification({
    userId: booking.guestId,
    type: "INSTANT_BOOK_CONFIRMED",
    title: "Réservation confirmée instantanément !",
    message: `Votre réservation pour ${booking.listing.title} du ${startDateStr} au ${endDateStr} est confirmée.`,
    actionUrl: `/reservations/${bookingId}`,
    data: {
      bookingId,
      listingId: booking.listingId,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
    },
  });

  // Notification à l'hôte
  await createNotification({
    userId: booking.listing.ownerId,
    type: "INSTANT_BOOK_CONFIRMED",
    title: "Nouvelle réservation instantanée !",
    message: `${booking.guest.name || "Un voyageur"} a réservé ${booking.listing.title} du ${startDateStr} au ${endDateStr}.`,
    actionUrl: `/host/bookings?id=${bookingId}`,
    data: {
      bookingId,
      listingId: booking.listingId,
      guestId: booking.guestId,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
    },
  });

  // Envoyer les emails
  await sendInstantBookEmails(booking);
}

/**
 * Envoie les emails de confirmation pour une réservation instantanée
 */
async function sendInstantBookEmails(booking: {
  id: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  currency: string;
  listing: {
    title: string;
    owner: { name: string | null; email: string };
  };
  guest: { name: string | null; email: string };
}): Promise<void> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const startDateStr = booking.startDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDateStr = booking.endDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: booking.currency,
  }).format(booking.totalPrice);

  // Email au guest
  const guestEmailHtml = emailLayout(`
    <div style="background:#111111;padding:24px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <div style="width:36px;height:36px;border-radius:999px;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#111111;font-weight:700;font-size:18px;">L</span>
        </div>
        <span style="color:#ffffff;font-size:20px;font-weight:600;">Lok'Room</span>
      </div>
    </div>
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:56px;height:56px;border-radius:999px;background:#fbbf24;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:28px;">⚡</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111111;text-align:center;">
        Réservation instantanée confirmée !
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;text-align:center;">
        ${booking.guest.name || "Bonjour"}, votre réservation a été confirmée instantanément.
      </p>

      <div style="background:#f9f9f9;border-radius:16px;padding:20px;margin:24px 0;">
        <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111111;">
          ${booking.listing.title}
        </h2>
        <table style="width:100%;font-size:14px;color:#444444;">
          <tr>
            <td style="padding:8px 0;color:#888888;">Hôte</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${booking.listing.owner.name || "Hôte Lok'Room"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Arrivée</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${startDateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Départ</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${endDateStr}</td>
          </tr>
          <tr style="border-top:1px solid #eeeeee;">
            <td style="padding:12px 0 0;font-weight:600;color:#111111;">Total</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:600;color:#111111;">${formattedPrice}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${APP_URL}/reservations/${booking.id}"
           style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:600;">
          Voir ma réservation
        </a>
      </div>

      <p style="margin-top:24px;font-size:13px;color:#666666;text-align:center;">
        L'adresse exacte vous sera communiquée dans les messages.
      </p>
    </div>
  `);

  await sendEmail({
    to: booking.guest.email,
    subject: `⚡ Réservation instantanée confirmée – ${booking.listing.title}`,
    html: guestEmailHtml,
    text: `Réservation instantanée confirmée !\n\n${booking.listing.title}\nArrivée : ${startDateStr}\nDépart : ${endDateStr}\nTotal : ${formattedPrice}\n\nVoir la réservation : ${APP_URL}/reservations/${booking.id}`,
  });

  // Email à l'hôte
  const hostEmailHtml = emailLayout(`
    <div style="background:#111111;padding:24px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <div style="width:36px;height:36px;border-radius:999px;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#111111;font-weight:700;font-size:18px;">L</span>
        </div>
        <span style="color:#ffffff;font-size:20px;font-weight:600;">Lok'Room</span>
      </div>
    </div>
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:56px;height:56px;border-radius:999px;background:#fbbf24;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:28px;">⚡</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111111;text-align:center;">
        Nouvelle réservation instantanée !
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;text-align:center;">
        ${booking.listing.owner.name || "Bonjour"}, vous avez une nouvelle réservation pour ${booking.listing.title}.
      </p>

      <div style="background:#f9f9f9;border-radius:16px;padding:20px;margin:24px 0;">
        <table style="width:100%;font-size:14px;color:#444444;">
          <tr>
            <td style="padding:8px 0;color:#888888;">Voyageur</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${booking.guest.name || "Voyageur"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Arrivée</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${startDateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Départ</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${endDateStr}</td>
          </tr>
          <tr style="border-top:1px solid #eeeeee;">
            <td style="padding:12px 0 0;font-weight:600;color:#111111;">Vous recevrez</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:600;color:#10b981;">${formattedPrice}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${APP_URL}/host/bookings?id=${booking.id}"
           style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:600;">
          Voir les détails
        </a>
      </div>

      <p style="margin-top:24px;font-size:13px;color:#666666;text-align:center;">
        N'oubliez pas de contacter votre voyageur pour lui donner les informations pratiques.
      </p>
    </div>
  `);

  await sendEmail({
    to: booking.listing.owner.email,
    subject: `⚡ Nouvelle réservation instantanée de ${booking.guest.name || "un voyageur"} !`,
    html: hostEmailHtml,
    text: `Nouvelle réservation instantanée !\n\n${booking.listing.title}\nVoyageur : ${booking.guest.name || "Voyageur"}\nArrivée : ${startDateStr}\nDépart : ${endDateStr}\nVous recevrez : ${formattedPrice}\n\nVoir les détails : ${APP_URL}/host/bookings?id=${booking.id}`,
  });
}

/**
 * Retourne les critères par défaut (tous non requis et satisfaits)
 */
function getDefaultCriteria(): EligibilityResult["criteria"] {
  return {
    verifiedId: { required: false, met: true },
    positiveReviews: { required: false, met: true },
    minRating: { required: false, met: true },
    profilePhoto: { required: false, met: true },
    phoneVerified: { required: false, met: true },
    nightsInRange: { required: false, met: true },
    advanceNotice: { required: false, met: true },
  };
}

/**
 * Récupère les paramètres instant book d'une annonce
 */
export async function getInstantBookSettings(listingId: string) {
  return prisma.instantBookSettings.findUnique({
    where: { listingId },
  });
}

/**
 * Met à jour ou crée les paramètres instant book d'une annonce
 */
export async function upsertInstantBookSettings(
  listingId: string,
  data: {
    requireVerifiedId?: boolean;
    requirePositiveReviews?: boolean;
    minGuestRating?: number | null;
    requireProfilePhoto?: boolean;
    requirePhoneVerified?: boolean;
    maxNights?: number | null;
    minNights?: number | null;
    advanceNoticeHours?: number;
    autoMessage?: string | null;
  }
) {
  return prisma.instantBookSettings.upsert({
    where: { listingId },
    create: {
      listingId,
      ...data,
    },
    update: data,
  });
}
