// apps/web/src/lib/email/queue.ts
/**
 * Queue d'emails pour traitement asynchrone
 * Permet de ne pas bloquer les requêtes API pendant l'envoi d'emails
 */

import { emailService } from "./service";

interface EmailJob {
  type: string;
  to: string;
  data: any;
  retries?: number;
}

// Queue en mémoire (pour dev/test)
// En production, utiliser Redis ou un service de queue comme BullMQ
const inMemoryEmailQueue: EmailJob[] = [];
let isProcessing = false;

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 secondes

/**
 * Ajoute un email à la queue
 */
export async function queueEmail(job: EmailJob): Promise<void> {
  inMemoryEmailQueue.push({ ...job, retries: 0 });

  // Démarrer le traitement si pas déjà en cours
  if (!isProcessing) {
    processQueue();
  }
}

/**
 * Traite la queue d'emails
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return;

  isProcessing = true;

  while (inMemoryEmailQueue.length > 0) {
    const job = inMemoryEmailQueue.shift();
    if (!job) continue;

    try {
      await sendEmailByType(job);
      console.log(`[EmailQueue] Email envoyé: ${job.type} to ${job.to}`);
    } catch (error) {
      console.error(`[EmailQueue] Erreur envoi email:`, error);

      // Retry logic
      if ((job.retries || 0) < MAX_RETRIES) {
        job.retries = (job.retries || 0) + 1;
        console.log(`[EmailQueue] Retry ${job.retries}/${MAX_RETRIES} pour ${job.type}`);

        // Remettre dans la queue après un délai
        setTimeout(() => {
          emailQueue.push(job);
          if (!isProcessing) processQueue();
        }, RETRY_DELAY * job.retries);
      } else {
        console.error(`[EmailQueue] Max retries atteint pour ${job.type} to ${job.to}`);
      }
    }
  }

  isProcessing = false;
}

/**
 * Envoie un email selon son type
 */
async function sendEmailByType(job: EmailJob): Promise<void> {
  switch (job.type) {
    case "booking-confirmation":
      await emailService.sendBookingConfirmation(job.to, job.data);
      break;

    case "booking-request":
      await emailService.sendBookingRequest(job.to, job.data);
      break;

    case "booking-cancelled":
      await emailService.sendBookingCancelled(job.to, job.data);
      break;

    case "payment-receipt":
      await emailService.sendPaymentReceipt(job.to, job.data);
      break;

    case "message-notification":
      await emailService.sendMessageNotification(job.to, job.data);
      break;

    case "review-request":
      await emailService.sendReviewRequest(job.to, job.data);
      break;

    case "welcome-email":
      await emailService.sendWelcomeEmail(job.to, job.data);
      break;

    case "password-reset":
      await emailService.sendPasswordReset(job.to, job.data);
      break;

    case "listing-approved":
      await emailService.sendListingApproved(job.to, job.data);
      break;

    case "payout-notification":
      await emailService.sendPayoutNotification(job.to, job.data);
      break;

    default:
      throw new Error(`Type d'email inconnu: ${job.type}`);
  }
}

/**
 * Helpers pour ajouter des emails à la queue
 */
export const emailQueue = {
  bookingConfirmation: (to: string, data: any) =>
    queueEmail({ type: "booking-confirmation", to, data }),

  bookingRequest: (to: string, data: any) =>
    queueEmail({ type: "booking-request", to, data }),

  bookingCancelled: (to: string, data: any) =>
    queueEmail({ type: "booking-cancelled", to, data }),

  paymentReceipt: (to: string, data: any) =>
    queueEmail({ type: "payment-receipt", to, data }),

  messageNotification: (to: string, data: any) =>
    queueEmail({ type: "message-notification", to, data }),

  reviewRequest: (to: string, data: any) =>
    queueEmail({ type: "review-request", to, data }),

  welcomeEmail: (to: string, data: any) =>
    queueEmail({ type: "welcome-email", to, data }),

  passwordReset: (to: string, data: any) =>
    queueEmail({ type: "password-reset", to, data }),

  listingApproved: (to: string, data: any) =>
    queueEmail({ type: "listing-approved", to, data }),

  payoutNotification: (to: string, data: any) =>
    queueEmail({ type: "payout-notification", to, data }),
};
