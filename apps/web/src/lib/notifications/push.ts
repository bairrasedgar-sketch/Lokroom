/**
 * Utilitaires pour les push notifications web
 * Gestion des abonnements et envoi de notifications
 */

import webpush from 'web-push';

// Configuration VAPID (clés publiques/privées pour l'authentification)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@lokroom.com';

// Configurer web-push avec les clés VAPID
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Envoyer une notification push à un abonnement
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured');
      return false;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );

    return true;
  } catch (error: any) {
    console.error('Error sending push notification:', error);

    // Si l'abonnement est invalide (410 Gone), retourner false pour le supprimer
    if (error.statusCode === 410) {
      return false;
    }

    throw error;
  }
}

/**
 * Envoyer une notification push à plusieurs abonnements
 */
export async function sendPushNotificationToMultiple(
  subscriptions: PushSubscriptionData[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number; invalidSubscriptions: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  let success = 0;
  let failed = 0;
  const invalidSubscriptions: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value === true) {
      success++;
    } else if (result.status === 'fulfilled' && result.value === false) {
      // Abonnement invalide
      invalidSubscriptions.push(subscriptions[index].endpoint);
      failed++;
    } else {
      failed++;
    }
  });

  return { success, failed, invalidSubscriptions };
}

/**
 * Générer des clés VAPID (à exécuter une seule fois)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

/**
 * Créer un payload de notification selon le type
 */
export function createNotificationPayload(
  type: string,
  data: any
): PushNotificationPayload {
  const basePayload: PushNotificationPayload = {
    title: "Lok'Room",
    body: '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data: {
      url: '/',
    },
  };

  switch (type) {
    case 'BOOKING_REQUEST':
      return {
        ...basePayload,
        title: 'Nouvelle demande de réservation',
        body: `${data.guestName} souhaite réserver votre espace`,
        data: { url: `/host/bookings/${data.bookingId}` },
        tag: 'booking-request',
        requireInteraction: true,
      };

    case 'BOOKING_CONFIRMED':
      return {
        ...basePayload,
        title: 'Réservation confirmée',
        body: `Votre réservation chez ${data.hostName} est confirmée`,
        data: { url: `/bookings/${data.bookingId}` },
        tag: 'booking-confirmed',
      };

    case 'INSTANT_BOOK_CONFIRMED':
      return {
        ...basePayload,
        title: 'Réservation instantanée',
        body: `${data.guestName} a réservé votre espace`,
        data: { url: `/host/bookings/${data.bookingId}` },
        tag: 'instant-book',
        requireInteraction: true,
      };

    case 'MESSAGE_NEW':
      return {
        ...basePayload,
        title: 'Nouveau message',
        body: `${data.senderName}: ${data.messagePreview}`,
        data: { url: `/messages/${data.conversationId}` },
        tag: 'message',
      };

    case 'REVIEW_RECEIVED':
      return {
        ...basePayload,
        title: 'Nouvel avis reçu',
        body: `${data.authorName} a laissé un avis (${data.rating}/5)`,
        data: { url: `/listings/${data.listingId}#reviews` },
        tag: 'review',
      };

    case 'PAYOUT_SENT':
      return {
        ...basePayload,
        title: 'Paiement reçu',
        body: `Vous avez reçu ${data.amount} ${data.currency}`,
        data: { url: '/host/wallet' },
        tag: 'payout',
      };

    case 'BOOKING_CANCELLED':
      return {
        ...basePayload,
        title: 'Réservation annulée',
        body: data.message || 'Une réservation a été annulée',
        data: { url: `/bookings/${data.bookingId}` },
        tag: 'booking-cancelled',
      };

    case 'BOOKING_REMINDER':
      return {
        ...basePayload,
        title: 'Rappel de réservation',
        body: `Votre réservation commence ${data.timeUntil}`,
        data: { url: `/bookings/${data.bookingId}` },
        tag: 'booking-reminder',
      };

    case 'LISTING_APPROVED':
      return {
        ...basePayload,
        title: 'Annonce approuvée',
        body: 'Votre annonce a été approuvée et est maintenant visible',
        data: { url: `/listings/${data.listingId}` },
        tag: 'listing-approved',
      };

    case 'LISTING_REJECTED':
      return {
        ...basePayload,
        title: 'Annonce refusée',
        body: 'Votre annonce nécessite des modifications',
        data: { url: `/host/listings/${data.listingId}/edit` },
        tag: 'listing-rejected',
        requireInteraction: true,
      };

    case 'DISPUTE_OPENED':
      return {
        ...basePayload,
        title: 'Litige ouvert',
        body: data.message || 'Un litige a été ouvert',
        data: { url: `/disputes/${data.disputeId}` },
        tag: 'dispute',
        requireInteraction: true,
      };

    case 'IDENTITY_VERIFIED':
      return {
        ...basePayload,
        title: 'Identité vérifiée',
        body: 'Votre identité a été vérifiée avec succès',
        data: { url: '/account/verification' },
        tag: 'identity-verified',
      };

    case 'SUPERHOST_EARNED':
      return {
        ...basePayload,
        title: 'Félicitations Super Hôte!',
        body: 'Vous avez obtenu le statut Super Hôte',
        data: { url: '/host/profile' },
        tag: 'superhost',
      };

    default:
      return {
        ...basePayload,
        body: data.message || 'Vous avez une nouvelle notification',
        data: { url: data.url || '/notifications' },
      };
  }
}
