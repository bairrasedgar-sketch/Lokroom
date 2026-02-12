/**
 * Endpoint pour rafraîchir le statut de vérification d'identité depuis Stripe
 * Utile quand le webhook n'a pas été déclenché (mode test, validation manuelle)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";


export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      identityStripeSessionId: true,
      identityStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Si pas de session Stripe Identity, rien à synchroniser
  if (!user.identityStripeSessionId) {
    return NextResponse.json({
      identityStatus: user.identityStatus,
      message: "Aucune session de vérification en cours",
      synced: false,
    });
  }

  try {
    // Récupérer le statut actuel depuis Stripe
    const verificationSession = await stripe.identity.verificationSessions.retrieve(
      user.identityStripeSessionId
    );

    // Mapper le statut Stripe vers notre enum
    let newStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" = "PENDING";
    let verifiedAt: Date | null = null;

    switch (verificationSession.status) {
      case "verified":
        newStatus = "VERIFIED";
        verifiedAt = new Date(
          (verificationSession.created ?? Math.floor(Date.now() / 1000)) * 1000
        );
        break;
      case "canceled":
        newStatus = "REJECTED";
        break;
      case "processing":
      case "requires_input":
      default:
        newStatus = "PENDING";
        break;
    }

    // Mettre à jour uniquement si le statut a changé
    if (newStatus !== user.identityStatus) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          identityStatus: newStatus,
          identityLastVerifiedAt: verifiedAt ?? undefined,
        },
      });

      return NextResponse.json({
        identityStatus: newStatus,
        identityLastVerifiedAt: verifiedAt,
        stripeStatus: verificationSession.status,
        synced: true,
        message: `Statut mis à jour: ${user.identityStatus} → ${newStatus}`,
      });
    }

    return NextResponse.json({
      identityStatus: newStatus,
      identityLastVerifiedAt: verifiedAt,
      stripeStatus: verificationSession.status,
      synced: false,
      message: "Statut déjà à jour",
    });
  } catch (error) {
    logger.error("Erreur synchronisation Identity:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation avec Stripe" },
      { status: 500 }
    );
  }
}
