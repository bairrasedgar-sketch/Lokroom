// apps/web/src/app/api/stripe/connect/onboarding/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/connect/onboarding
 *
 * Crée ou récupère un compte Stripe Connect pour l'hôte,
 * puis génère un lien d'onboarding pour configurer le compte bancaire.
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
        name: true,
        country: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            addressLine1: true,
            city: true,
            postalCode: true,
            country: true,
          },
        },
        hostProfile: {
          select: {
            id: true,
            stripeAccountId: true,
            payoutsEnabled: true,
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

    // Vérifier que c'est bien un hôte
    if (user.role !== "HOST" && user.role !== "BOTH" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seuls les hôtes peuvent configurer un compte bancaire" },
        { status: 403 }
      );
    }

    let stripeAccountId = user.hostProfile?.stripeAccountId;

    // Si pas de compte Stripe, en créer un
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: user.profile?.country || user.country || "FR",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        individual: {
          first_name: user.profile?.firstName || undefined,
          last_name: user.profile?.lastName || undefined,
          email: user.email,
          phone: user.profile?.phone || undefined,
          address: {
            line1: user.profile?.addressLine1 || undefined,
            city: user.profile?.city || undefined,
            postal_code: user.profile?.postalCode || undefined,
            country: user.profile?.country || user.country || "FR",
          },
        },
        metadata: {
          userId: user.id,
          userEmail: user.email,
        },
      });

      stripeAccountId = account.id;

      // Créer ou mettre à jour le HostProfile
      await prisma.hostProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeAccountId: account.id,
          kycStatus: "incomplete",
          payoutsEnabled: false,
        },
        update: {
          stripeAccountId: account.id,
        },
      });
    }

    // Créer un lien d'onboarding Stripe
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/onboarding?connect=refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/onboarding?connect=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: stripeAccountId,
    });
  } catch (error) {
    logger.error("[Stripe Connect] Erreur création onboarding:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du lien d'onboarding" },
      { status: 500 }
    );
  }
}
