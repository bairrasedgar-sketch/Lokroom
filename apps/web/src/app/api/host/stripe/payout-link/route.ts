// apps/web/src/app/api/host/stripe/payout-link/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Construit l'origin (http(s)://host) à partir de la requête.
 */
function getOrigin(req: Request) {
  const url = new URL(req.url);

  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    url.host;

  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const origin = getOrigin(req);

    // On récupère l'user avec son profil & son HostProfile
    const host = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        hostProfile: true,
      },
    });

    if (!host) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les infos du profil pour pré-remplir Stripe
    const profile = host.profile;

    // On s'assure qu'il a bien un HostProfile (côté Lok'Room)
    const hostProfile =
      host.hostProfile ??
      (await prisma.hostProfile.create({
        data: {
          userId: host.id,
        },
      }));

    let stripeAccountId = hostProfile.stripeAccountId ?? undefined;

    // ===============================
    // 🧩 Préparation des infos KYC
    // ===============================
    let firstName: string | undefined = profile?.firstName ?? undefined;
    let lastName: string | undefined = profile?.lastName ?? undefined;

    // fallback sur host.name si le profil est vide
    if ((!firstName || !lastName) && host.name) {
      const parts = host.name.split(" ");
      firstName = firstName ?? parts[0];
      lastName =
        lastName ?? (parts.length > 1 ? parts.slice(1).join(" ") : undefined);
    }

    let dobDay: number | undefined;
    let dobMonth: number | undefined;
    let dobYear: number | undefined;

    if (profile?.birthDate instanceof Date) {
      const d = profile.birthDate as Date;
      dobDay = d.getUTCDate();
      dobMonth = d.getUTCMonth() + 1;
      dobYear = d.getUTCFullYear();
    }

    const hasAddress =
      profile?.addressLine1 ||
      profile?.addressLine2 ||
      profile?.city ||
      profile?.postalCode ||
      profile?.country ||
      profile?.province;

    let individualForCreate:
      | Stripe.AccountCreateParams.Individual
      | undefined = undefined;

    if (
      firstName ||
      lastName ||
      profile?.phone ||
      hasAddress ||
      (dobDay && dobMonth && dobYear)
    ) {
      individualForCreate = {
        first_name: firstName,
        last_name: lastName,
        email: host.email ?? undefined,
        phone: profile?.phone ?? undefined,
        dob:
          dobDay && dobMonth && dobYear
            ? {
                day: dobDay,
                month: dobMonth,
                year: dobYear,
              }
            : undefined,
        address: hasAddress
          ? {
              line1: profile?.addressLine1 ?? undefined,
              line2: profile?.addressLine2 ?? undefined,
              city: profile?.city ?? undefined,
              postal_code: profile?.postalCode ?? undefined,
              country:
                profile?.country?.toUpperCase() ??
                host.country?.toUpperCase() ??
                undefined,
              state: profile?.province ?? undefined,
            }
          : undefined,
      };
    }

    // ===============================
    // 1️⃣ Création / récupération du compte Connect
    // ===============================
    if (!stripeAccountId) {
      const country =
        host.country?.toUpperCase() === "CA" ? "CA" : "FR";

      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: host.email ?? undefined,
        business_type: "individual",
        business_profile: {
          url: "https://lokroom.com",
          mcc: "6513", // Agents immobiliers / location
          product_description:
            "Plateforme de location courte durée de logements, parkings et espaces de travail.",
        },
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: {
          lokroom_user_id: host.id,
        },
        // 👉 pré-remplissage côté Stripe UNIQUEMENT à la création
        ...(individualForCreate ? { individual: individualForCreate } : {}),
      });

      stripeAccountId = account.id;

      await prisma.hostProfile.update({
        where: { id: hostProfile.id },
        data: {
          stripeAccountId: account.id,
          kycStatus: "pending",
          payoutsEnabled: account.payouts_enabled ?? false,
        },
      });
    } else {
      // Compte déjà existant : on NE TOUCHE PAS à `individual`
      // pour éviter l’erreur Stripe oauth_not_supported.
      await stripe.accounts.update(stripeAccountId, {
        business_profile: {
          url: "https://lokroom.com",
          mcc: "6513",
          product_description:
            "Plateforme de location courte durée de logements, parkings et espaces de travail.",
        },
        metadata: {
          lokroom_user_id: host.id,
        },
      });
    }

    // ===============================
    // 2️⃣ Lien d’onboarding / update Stripe
    // ===============================
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId!,
      type: "account_onboarding", // plus tard, "account_update" si besoin
      refresh_url: `${origin}/account/payments?tab=payouts&step=1`,
      return_url: `${origin}/account/payments?tab=payouts&step=1`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Erreur création payout-link Stripe:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du lien Stripe." },
      { status: 500 }
    );
  }
}
