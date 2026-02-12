import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePromoSchema, validateRequestBody } from "@/lib/validations/api";
import { logger } from "@/lib/logger";


// POST /api/promo/validate - Valider un code promo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Validation Zod du body
    const validation = await validateRequestBody(request, validatePromoSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { code, bookingId, totalAmountCents } = validation.data;

    // Chercher le code promo
    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: "Code promo invalide", valid: false },
        { status: 404 }
      );
    }

    // Vérifications
    const now = new Date();

    // Code actif ?
    if (!promoCode.isActive) {
      return NextResponse.json(
        { error: "Ce code promo n'est plus actif", valid: false },
        { status: 400 }
      );
    }

    // Dates de validité
    if (promoCode.validFrom > now) {
      return NextResponse.json(
        { error: "Ce code promo n'est pas encore valide", valid: false },
        { status: 400 }
      );
    }

    if (promoCode.validUntil && promoCode.validUntil < now) {
      return NextResponse.json(
        { error: "Ce code promo a expiré", valid: false },
        { status: 400 }
      );
    }

    // Nombre max d'utilisations globales
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { error: "Ce code promo a atteint son nombre maximum d'utilisations", valid: false },
        { status: 400 }
      );
    }

    // Nombre max d'utilisations par utilisateur
    const userUsageCount = await prisma.promoCodeUsage.count({
      where: {
        promoCodeId: promoCode.id,
        userId: session.user.id,
      },
    });

    if (userUsageCount >= promoCode.maxPerUser) {
      return NextResponse.json(
        { error: "Vous avez déjà utilisé ce code promo", valid: false },
        { status: 400 }
      );
    }

    // Vérifier si c'est pour les nouveaux utilisateurs uniquement
    if (promoCode.newUsersOnly) {
      const userBookingsCount = await prisma.booking.count({
        where: { guestId: session.user.id, status: "CONFIRMED" },
      });

      if (userBookingsCount > 0) {
        return NextResponse.json(
          { error: "Ce code promo est réservé aux nouveaux utilisateurs", valid: false },
          { status: 400 }
        );
      }
    }

    // Vérifier si c'est pour la première réservation uniquement
    if (promoCode.firstBookingOnly && userUsageCount > 0) {
      return NextResponse.json(
        { error: "Ce code promo est valable uniquement pour votre première utilisation", valid: false },
        { status: 400 }
      );
    }

    // Vérifier le montant minimum
    if (promoCode.minBookingAmountCents && totalAmountCents) {
      if (totalAmountCents < promoCode.minBookingAmountCents) {
        const minAmount = (promoCode.minBookingAmountCents / 100).toFixed(2);
        return NextResponse.json(
          { error: `Montant minimum requis : ${minAmount}€`, valid: false },
          { status: 400 }
        );
      }
    }

    // Vérifier le type de listing si spécifié
    if (promoCode.applicableListingTypes.length > 0 && bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { listing: { select: { type: true } } },
      });

      if (booking && !promoCode.applicableListingTypes.includes(booking.listing.type)) {
        return NextResponse.json(
          { error: "Ce code promo n'est pas applicable à ce type d'espace", valid: false },
          { status: 400 }
        );
      }
    }

    // Vérifier le pays si spécifié
    if (promoCode.applicableCountries.length > 0 && bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { listing: { select: { country: true } } },
      });

      if (booking && !promoCode.applicableCountries.includes(booking.listing.country)) {
        return NextResponse.json(
          { error: "Ce code promo n'est pas applicable dans ce pays", valid: false },
          { status: 400 }
        );
      }
    }

    // Calculer la réduction
    let discountAmountCents = 0;
    let discountLabel = "";

    if (promoCode.type === "PERCENTAGE") {
      discountAmountCents = totalAmountCents
        ? Math.round((totalAmountCents * promoCode.value) / 100)
        : 0;
      discountLabel = `-${promoCode.value}%`;
    } else if (promoCode.type === "FIXED_AMOUNT") {
      discountAmountCents = promoCode.value * 100; // value est en euros
      discountLabel = `-${promoCode.value}€`;
    } else if (promoCode.type === "FREE_SERVICE_FEE") {
      discountLabel = "Frais de service offerts";
      // Le calcul des frais de service sera fait côté booking
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        discountAmountCents,
        discountLabel,
      },
    });
  } catch (error) {
    logger.error("Error validating promo code:", error);
    return NextResponse.json(
      { error: "Erreur lors de la validation du code promo" },
      { status: 500 }
    );
  }
}
