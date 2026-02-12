// apps/web/src/app/api/identity/start/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


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

    // On récupère l'user pour éventuellement passer l'email à Stripe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // 🔐 Création d'une session Stripe Identity (hosted flow)
    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          lokroom_user_id: user.id,
        },
        options: {
          document: {
            allowed_types: ["driving_license", "id_card", "passport"],
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
        return_url: `${origin}/account?tab=security`,
      });

    // Sauvegarder l'ID de session et mettre le statut en PENDING
    await prisma.user.update({
      where: { id: user.id },
      data: {
        identityStripeSessionId: verificationSession.id,
        identityStatus: "PENDING",
      },
    });

    return NextResponse.json({ url: verificationSession.url });
  } catch (err) {
    logger.error("Erreur création session Stripe Identity:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de la vérification d'identité." },
      { status: 500 }
    );
  }
}
