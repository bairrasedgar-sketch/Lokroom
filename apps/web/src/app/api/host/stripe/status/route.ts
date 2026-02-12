export const dynamic = "force-dynamic";

// apps/web/src/app/api/host/stripe/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";


/**
 * GET /api/host/stripe/status
 * Récupère le statut du compte Stripe Connect et les infos bancaires masquées
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer le hostProfile
    const hostProfile = await prisma.hostProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        stripeAccountId: true,
        payoutsEnabled: true,
        kycStatus: true,
      },
    });

    if (!hostProfile || !hostProfile.stripeAccountId) {
      return NextResponse.json({
        configured: false,
        payoutsEnabled: false,
        kycStatus: null,
        bankAccount: null,
      });
    }

    // Récupérer les infos du compte Stripe
    const account = await stripe.accounts.retrieve(hostProfile.stripeAccountId);

    // Récupérer les comptes bancaires externes
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      hostProfile.stripeAccountId,
      { object: "bank_account", limit: 1 }
    );

    let bankAccount = null;
    if (externalAccounts.data.length > 0) {
      const bank = externalAccounts.data[0] as {
        last4?: string;
        bank_name?: string;
        country?: string;
        currency?: string;
      };
      bankAccount = {
        last4: bank.last4 || "****",
        bankName: bank.bank_name || "Compte bancaire",
        country: bank.country || "",
        currency: bank.currency?.toUpperCase() || "",
      };
    }

    // Mettre à jour le statut dans la BDD si nécessaire
    const payoutsEnabled = account.payouts_enabled === true;
    const requirements = account.requirements;
    const currentlyDue = requirements?.currently_due || [];
    const kycStatus = currentlyDue.length === 0 && payoutsEnabled ? "complete" : "incomplete";

    if (
      hostProfile.payoutsEnabled !== payoutsEnabled ||
      hostProfile.kycStatus !== kycStatus
    ) {
      await prisma.hostProfile.update({
        where: { userId: session.user.id },
        data: {
          payoutsEnabled,
          kycStatus,
        },
      });
    }

    return NextResponse.json({
      configured: true,
      payoutsEnabled,
      kycStatus,
      bankAccount,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: {
        currentlyDue: currentlyDue,
        pendingVerification: requirements?.pending_verification || [],
      },
    });
  } catch (err) {
    logger.error("Erreur récupération statut Stripe:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du statut Stripe." },
      { status: 500 }
    );
  }
}
