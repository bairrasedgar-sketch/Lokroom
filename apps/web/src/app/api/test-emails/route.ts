// apps/web/src/app/api/test-emails/route.ts
/**
 * API de test pour les emails transactionnels
 * Permet de tester tous les templates d'emails
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email/service";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

/**
 * POST /api/test-emails
 * Body: { type: string, to?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to = "test@example.com" } = body;

    let result;

    switch (type) {
      case "booking-confirmation":
        result = await emailService.sendBookingConfirmation(to, {
          guestName: "Jean Dupont",
          listingTitle: "Appartement moderne avec vue sur Paris",
          hostName: "Marie Martin",
          checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          totalPrice: 450,
          currency: "EUR",
          bookingId: "test-booking-123",
        });
        break;

      case "booking-request":
        result = await emailService.sendBookingRequest(to, {
          hostName: "Marie Martin",
          guestName: "Jean Dupont",
          listingTitle: "Appartement moderne avec vue sur Paris",
          checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          totalPrice: 450,
          currency: "EUR",
          message: "Bonjour, je souhaite réserver votre appartement pour un séjour professionnel. Merci !",
          bookingId: "test-booking-123",
        });
        break;

      case "booking-cancelled":
        result = await emailService.sendBookingCancelled(to, {
          recipientName: "Jean Dupont",
          listingTitle: "Appartement moderne avec vue sur Paris",
          checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          refundAmount: 450,
          currency: "EUR",
          cancelledBy: "guest",
          bookingId: "test-booking-123",
        });
        break;

      case "payment-receipt":
        result = await emailService.sendPaymentReceipt(to, {
          userName: "Jean Dupont",
          listingTitle: "Appartement moderne avec vue sur Paris",
          amount: 450,
          currency: "EUR",
          paymentDate: new Date(),
          paymentId: "pi_test_123456789",
          bookingId: "test-booking-123",
        });
        break;

      case "message-notification":
        result = await emailService.sendMessageNotification(to, {
          recipientName: "Jean Dupont",
          senderName: "Marie Martin",
          messagePreview: "Bonjour ! Je voulais vous confirmer que l'appartement sera prêt pour votre arrivée. N'hésitez pas si vous avez des questions.",
          conversationId: "test-conv-123",
        });
        break;

      case "review-request":
        result = await emailService.sendReviewRequest(to, {
          guestName: "Jean Dupont",
          listingTitle: "Appartement moderne avec vue sur Paris",
          hostName: "Marie Martin",
          bookingId: "test-booking-123",
        });
        break;

      case "welcome-email":
        result = await emailService.sendWelcomeEmail(to, {
          userName: "Jean Dupont",
        });
        break;

      case "password-reset":
        result = await emailService.sendPasswordReset(to, {
          userName: "Jean Dupont",
          resetToken: "test-token-123456789",
        });
        break;

      case "listing-approved":
        result = await emailService.sendListingApproved(to, {
          hostName: "Marie Martin",
          listingTitle: "Appartement moderne avec vue sur Paris",
          listingId: "test-listing-123",
        });
        break;

      case "payout-notification":
        result = await emailService.sendPayoutNotification(to, {
          hostName: "Marie Martin",
          amount: 405,
          currency: "EUR",
          payoutDate: new Date(),
          bookingId: "test-booking-123",
          listingTitle: "Appartement moderne avec vue sur Paris",
        });
        break;

      default:
        return NextResponse.json(
          { error: "Type d'email inconnu", availableTypes: [
            "booking-confirmation",
            "booking-request",
            "booking-cancelled",
            "payment-receipt",
            "message-notification",
            "review-request",
            "welcome-email",
            "password-reset",
            "listing-approved",
            "payout-notification",
          ]},
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email "${type}" envoyé avec succès à ${to}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("[TestEmails] Erreur:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test-emails
 * Liste tous les types d'emails disponibles
 */
export async function GET() {
  return NextResponse.json({
    availableTypes: [
      {
        type: "booking-confirmation",
        description: "Email de confirmation de réservation (pour le voyageur)",
      },
      {
        type: "booking-request",
        description: "Email de nouvelle demande de réservation (pour l'hôte)",
      },
      {
        type: "booking-cancelled",
        description: "Email d'annulation de réservation",
      },
      {
        type: "payment-receipt",
        description: "Reçu de paiement",
      },
      {
        type: "message-notification",
        description: "Notification de nouveau message",
      },
      {
        type: "review-request",
        description: "Demande d'avis après un séjour",
      },
      {
        type: "welcome-email",
        description: "Email de bienvenue après inscription",
      },
      {
        type: "password-reset",
        description: "Email de réinitialisation de mot de passe",
      },
      {
        type: "listing-approved",
        description: "Email d'approbation d'annonce",
      },
      {
        type: "payout-notification",
        description: "Notification de paiement reçu (pour l'hôte)",
      },
    ],
    usage: {
      method: "POST",
      endpoint: "/api/test-emails",
      body: {
        type: "booking-confirmation",
        to: "your-email@example.com",
      },
    },
  });
}
