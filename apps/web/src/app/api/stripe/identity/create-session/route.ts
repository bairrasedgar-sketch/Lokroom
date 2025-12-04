// apps/web/src/app/api/stripe/identity/create-session/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/identity/create-session
 *
 * Crée une session Stripe Identity pour la vérification KYC.
 * L'utilisateur doit être connecté.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        identityStatus: true,
        identityStripeSessionId: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Si déjà vérifié, pas besoin de refaire
    if (user.identityStatus === "VERIFIED") {
      return NextResponse.json(
        { error: "Identité déjà vérifiée", alreadyVerified: true },
        { status: 400 }
      );
    }

    // Créer une session Stripe Identity
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        lokroom_user_id: user.id,
        userId: user.id,
        userEmail: user.email,
      },
      options: {
        document: {
          require_matching_selfie: true,
          allowed_types: ["driving_license", "passport", "id_card"],
        },
      },
      return_url: `${process.env.NEXTAUTH_URL}/onboarding?identity=complete`,
    });

    // Sauvegarder l'ID de la session pour le webhook
    await prisma.user.update({
      where: { id: user.id },
      data: {
        identityStripeSessionId: verificationSession.id,
        identityStatus: "PENDING",
      },
    });

    return NextResponse.json({
      url: verificationSession.url,
      sessionId: verificationSession.id,
    });
  } catch (error) {
    console.error("[Stripe Identity] Erreur création session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de vérification" },
      { status: 500 }
    );
  }
}
