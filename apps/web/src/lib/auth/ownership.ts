// apps/web/src/lib/auth/ownership.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Session } from "next-auth";
import { logger } from "@/lib/logger";


/**
 * Verify that the authenticated user owns the resource
 * Returns the session if authorized, or an error response
 */
export async function verifyOwnership(
  req: NextRequest,
  resourceType: "listing" | "booking" | "message" | "review" | "conversation",
  resourceId: string
): Promise<{ session: Session | null; error?: NextResponse }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      ),
    };
  }

  // Admins can access everything
  if (session.user.role === "ADMIN") {
    return { session };
  }

  try {
    let isOwner = false;

    switch (resourceType) {
      case "listing": {
        const listing = await prisma.listing.findUnique({
          where: { id: resourceId },
          select: { ownerId: true },
        });
        isOwner = listing?.ownerId === session.user.id;
        break;
      }

      case "booking": {
        const booking = await prisma.booking.findUnique({
          where: { id: resourceId },
          select: { guestId: true, listing: { select: { ownerId: true } } },
        });
        // Owner can be either the guest or the host
        isOwner =
          booking?.guestId === session.user.id ||
          booking?.listing.ownerId === session.user.id;
        break;
      }

      case "message": {
        const message = await prisma.message.findUnique({
          where: { id: resourceId },
          select: {
            senderId: true,
            conversation: {
              select: { guestId: true, hostId: true }
            }
          },
        });
        // Owner can be either sender, guest or host of the conversation
        isOwner =
          message?.senderId === session.user.id ||
          message?.conversation.guestId === session.user.id ||
          message?.conversation.hostId === session.user.id;
        break;
      }

      case "review": {
        const review = await prisma.review.findUnique({
          where: { id: resourceId },
          select: { authorId: true, targetUserId: true },
        });
        // Owner can be either author or target of the review
        isOwner =
          review?.authorId === session.user.id ||
          review?.targetUserId === session.user.id;
        break;
      }

      case "conversation": {
        const conversation = await prisma.conversation.findUnique({
          where: { id: resourceId },
          select: { guestId: true, hostId: true },
        });
        // Owner can be either guest or host
        isOwner =
          conversation?.guestId === session.user.id ||
          conversation?.hostId === session.user.id;
        break;
      }
    }

    if (!isOwner) {
      return {
        session,
        error: NextResponse.json(
          { error: "Accès refusé - Vous n'êtes pas le propriétaire de cette ressource" },
          { status: 403 }
        ),
      };
    }

    return { session };
  } catch (error) {
    // Note: Utiliser un logger approprié en production (Sentry, Winston, etc.)
    if (process.env.NODE_ENV === "development") {
      logger.error(`Error verifying ownership for ${resourceType}:`, error);
    }
    return {
      session,
      error: NextResponse.json(
        { error: "Erreur lors de la vérification des permissions" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verify that the user is the owner of a listing
 * Shorthand for verifyOwnership with listing type
 */
export async function verifyListingOwnership(
  req: NextRequest,
  listingId: string
) {
  return verifyOwnership(req, "listing", listingId);
}

/**
 * Verify that the user is involved in a booking (guest or host)
 */
export async function verifyBookingAccess(
  req: NextRequest,
  bookingId: string
) {
  return verifyOwnership(req, "booking", bookingId);
}

/**
 * Verify that the user is part of a conversation
 */
export async function verifyConversationAccess(
  req: NextRequest,
  conversationId: string
) {
  return verifyOwnership(req, "conversation", conversationId);
}
