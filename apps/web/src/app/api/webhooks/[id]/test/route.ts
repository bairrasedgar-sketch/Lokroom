/**
 * Lok'Room - API Test Webhook
 * POST /api/webhooks/[id]/test - Envoyer un événement de test
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { validateRequestBody } from "@/lib/validations";
import { testWebhookSchema } from "@/lib/validations/webhooks";
import { triggerWebhook } from "@/lib/webhooks/service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/[id]/test
 * Envoie un événement de test au webhook
 * TEMPORARILY DISABLED - Webhook model not in schema
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return jsonError("Webhook feature temporarily disabled", 503);
}
    return jsonError(
      `Ce webhook n'est pas configuré pour l'événement ${event}`,
      400
    );
  }

  // Créer des données de test selon l'événement
  const testData = generateTestData(event, user.id);

  // Déclencher le webhook (uniquement pour ce webhook spécifique)
  await triggerWebhook(event, testData, user.id);

  return NextResponse.json({
    success: true,
    message: "Événement de test envoyé",
    event,
    testData,
  });
}

/**
 * Génère des données de test selon le type d'événement
 */
function generateTestData(
  event: string,
  userId: string
): Record<string, unknown> {
  const baseData = {
    id: `test_${Date.now()}`,
    userId,
    isTest: true,
  };

  switch (event) {
    case "booking.created":
      return {
        ...baseData,
        listingId: "test_listing_123",
        guestId: userId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        totalPrice: 100,
        currency: "EUR",
        status: "PENDING",
      };

    case "booking.confirmed":
      return {
        ...baseData,
        listingId: "test_listing_123",
        guestId: userId,
        status: "CONFIRMED",
        confirmedAt: new Date().toISOString(),
      };

    case "booking.cancelled":
      return {
        ...baseData,
        listingId: "test_listing_123",
        guestId: userId,
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
        cancelReason: "Test cancellation",
      };

    case "booking.completed":
      return {
        ...baseData,
        listingId: "test_listing_123",
        guestId: userId,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      };

    case "listing.created":
      return {
        ...baseData,
        title: "Test Listing",
        description: "This is a test listing",
        price: 50,
        currency: "EUR",
        country: "FR",
        city: "Paris",
      };

    case "listing.updated":
      return {
        ...baseData,
        title: "Updated Test Listing",
        updatedAt: new Date().toISOString(),
      };

    case "listing.deleted":
      return {
        ...baseData,
        deletedAt: new Date().toISOString(),
      };

    case "review.created":
      return {
        ...baseData,
        bookingId: "test_booking_123",
        listingId: "test_listing_123",
        authorId: userId,
        rating: 5,
        comment: "Great experience!",
      };

    case "message.received":
      return {
        ...baseData,
        conversationId: "test_conversation_123",
        senderId: "test_sender_123",
        content: "Hello, this is a test message",
        createdAt: new Date().toISOString(),
      };

    case "payment.succeeded":
      return {
        ...baseData,
        bookingId: "test_booking_123",
        amount: 10000,
        currency: "EUR",
        paymentIntentId: "pi_test_123",
        status: "succeeded",
      };

    case "payment.failed":
      return {
        ...baseData,
        bookingId: "test_booking_123",
        amount: 10000,
        currency: "EUR",
        paymentIntentId: "pi_test_123",
        status: "failed",
        errorMessage: "Test payment failure",
      };

    default:
      return baseData;
  }
}
