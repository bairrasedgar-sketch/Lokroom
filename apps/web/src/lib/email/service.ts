// apps/web/src/lib/email/service.ts
/**
 * Service d'email transactionnel complet pour Lok'Room
 * Utilise Resend pour tous les envois d'emails
 */

import { Resend } from "resend";
import {
import { logger } from "@/lib/logger";

  bookingConfirmationTemplate,
  bookingRequestTemplate,
  paymentReceiptTemplate,
  messageNotificationTemplate,
  reviewRequestTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate,
  listingApprovedTemplate,
  payoutNotificationTemplate,
  bookingCancelledTemplate,
} from "./templates";

// Client Resend (lazy initialization)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY non configurée dans .env");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Configuration
const DEFAULT_FROM = process.env.EMAIL_FROM || "Lok'Room <noreply@lokroom.com>";
const SUPPORT_EMAIL = "support@lokroom.com";

// ============================================================================
// TYPES
// ============================================================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// SERVICE EMAIL
// ============================================================================

export class EmailService {
  private from: string;

  constructor(from?: string) {
    this.from = from || DEFAULT_FROM;
  }

  /**
   * Envoie un email de confirmation de réservation (pour le voyageur)
   */
  async sendBookingConfirmation(
    to: string,
    data: {
      guestName: string;
      listingTitle: string;
      hostName: string;
      checkIn: Date;
      checkOut: Date;
      totalPrice: number;
      currency: string;
      bookingId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = bookingConfirmationTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Booking confirmation error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Booking confirmation exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie un email de nouvelle demande de réservation (pour l'hôte)
   */
  async sendBookingRequest(
    to: string,
    data: {
      hostName: string;
      guestName: string;
      listingTitle: string;
      checkIn: Date;
      checkOut: Date;
      totalPrice: number;
      currency: string;
      message?: string;
      bookingId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = bookingRequestTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Booking request error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Booking request exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie un email de réservation annulée
   */
  async sendBookingCancelled(
    to: string,
    data: {
      recipientName: string;
      listingTitle: string;
      checkIn: Date;
      checkOut: Date;
      refundAmount?: number;
      currency?: string;
      cancelledBy: "guest" | "host";
      bookingId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = bookingCancelledTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Booking cancelled error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Booking cancelled exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie un reçu de paiement
   */
  async sendPaymentReceipt(
    to: string,
    data: {
      userName: string;
      listingTitle: string;
      amount: number;
      currency: string;
      paymentDate: Date;
      paymentId: string;
      bookingId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = paymentReceiptTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Payment receipt error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Payment receipt exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie une notification de nouveau message
   */
  async sendMessageNotification(
    to: string,
    data: {
      recipientName: string;
      senderName: string;
      messagePreview: string;
      conversationId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = messageNotificationTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Message notification error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Message notification exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie une demande d'avis après un séjour
   */
  async sendReviewRequest(
    to: string,
    data: {
      guestName: string;
      listingTitle: string;
      hostName: string;
      bookingId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = reviewRequestTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Review request error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Review request exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(
    to: string,
    data: {
      userName: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = welcomeEmailTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
        replyTo: SUPPORT_EMAIL,
      });

      if (result.error) {
        logger.error("[EmailService] Welcome email error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Welcome email exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordReset(
    to: string,
    data: {
      userName: string;
      resetToken: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = passwordResetTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Password reset error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Password reset exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie un email d'approbation d'annonce
   */
  async sendListingApproved(
    to: string,
    data: {
      hostName: string;
      listingTitle: string;
      listingId: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = listingApprovedTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Listing approved error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Listing approved exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoie une notification de paiement reçu (pour l'hôte)
   */
  async sendPayoutNotification(
    to: string,
    data: {
      hostName: string;
      amount: number;
      currency: string;
      payoutDate: Date;
      bookingId: string;
      listingTitle: string;
    }
  ): Promise<EmailResult> {
    try {
      const resend = getResendClient();
      const { html, text, subject } = payoutNotificationTemplate(data);

      const result = await resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        logger.error("[EmailService] Payout notification error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      logger.error("[EmailService] Payout notification exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Instance singleton
export const emailService = new EmailService();
