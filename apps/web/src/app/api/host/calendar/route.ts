import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/host/calendar - Récupérer le calendrier d'une annonce
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!listingId) {
    return NextResponse.json({ error: "listingId requis" }, { status: 400 });
  }

  // Vérifier que l'utilisateur est le propriétaire
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      minNights: true,
      maxNights: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce non trouvée" }, { status: 404 });
  }

  // Récupérer les réservations
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: ["PENDING", "CONFIRMED"] },
      ...(startDate && endDate
        ? {
            OR: [
              {
                startDate: { gte: new Date(startDate), lte: new Date(endDate) },
              },
              {
                endDate: { gte: new Date(startDate), lte: new Date(endDate) },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      guest: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  // Récupérer les blocages (CalendarBlock)
  const blockedPeriods = await prisma.calendarBlock.findMany({
    where: {
      listingId,
      bookingId: null, // Seulement les blocages manuels
      ...(startDate && endDate
        ? {
            OR: [
              { start: { gte: new Date(startDate), lte: new Date(endDate) } },
              { end: { gte: new Date(startDate), lte: new Date(endDate) } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      start: true,
      end: true,
      reason: true,
    },
    orderBy: { start: "asc" },
  });

  // Récupérer les prix personnalisés (DynamicPrice)
  const customPrices = await prisma.dynamicPrice.findMany({
    where: {
      listingId,
      ...(startDate && endDate
        ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    },
    select: {
      id: true,
      date: true,
      dailyPrice: true,
      hourlyPrice: true,
      minNights: true,
      note: true,
    },
    orderBy: { date: "asc" },
  });

  // Récupérer les syncs iCal
  const calendarSyncs = await prisma.calendarSync.findMany({
    where: { listingId },
    select: {
      id: true,
      name: true,
      externalUrl: true,
      lastSyncAt: true,
      lastSyncStatus: true,
    },
  });

  return NextResponse.json({
    listing,
    bookings: bookings.map((b) => ({
      ...b,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
    })),
    blockedPeriods: blockedPeriods.map((d) => ({
      ...d,
      start: d.start.toISOString(),
      end: d.end.toISOString(),
    })),
    customPrices: customPrices.map((p) => ({
      ...p,
      date: p.date.toISOString(),
    })),
    calendarSyncs,
  });
}

// POST /api/host/calendar - Modifier le calendrier (blocages, prix)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { listingId, action, data } = body;

    if (!listingId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        ownerId: session.user.id,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Annonce non trouvée" }, { status: 404 });
    }

    switch (action) {
      case "block_period": {
        // Bloquer une période
        const { startDate, endDate, reason } = data;
        if (!startDate || !endDate) {
          return NextResponse.json({ error: "startDate et endDate requis" }, { status: 400 });
        }

        const block = await prisma.calendarBlock.create({
          data: {
            listingId,
            start: new Date(startDate),
            end: new Date(endDate),
            reason: reason || "MANUAL_BLOCK",
          },
        });

        return NextResponse.json({ success: true, block });
      }

      case "unblock_period": {
        // Débloquer une période
        const { blockId } = data;
        if (!blockId) {
          return NextResponse.json({ error: "blockId requis" }, { status: 400 });
        }

        await prisma.calendarBlock.delete({
          where: { id: blockId, listingId },
        });

        return NextResponse.json({ success: true });
      }

      case "set_custom_price": {
        // Définir un prix personnalisé pour certaines dates
        const { dates, dailyPrice, hourlyPrice, minNights, note } = data;
        if (!dates || !Array.isArray(dates)) {
          return NextResponse.json({ error: "dates requises" }, { status: 400 });
        }

        // Upsert pour chaque date
        for (const date of dates) {
          await prisma.dynamicPrice.upsert({
            where: {
              listingId_date: {
                listingId,
                date: new Date(date),
              },
            },
            update: {
              dailyPrice: dailyPrice ?? undefined,
              hourlyPrice: hourlyPrice ?? undefined,
              minNights: minNights ?? undefined,
              note: note ?? undefined,
            },
            create: {
              id: `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              listingId,
              date: new Date(date),
              dailyPrice,
              hourlyPrice,
              minNights,
              note,
            },
          });
        }

        return NextResponse.json({ success: true });
      }

      case "remove_custom_price": {
        // Supprimer un prix personnalisé
        const { dates } = data;
        if (!dates || !Array.isArray(dates)) {
          return NextResponse.json({ error: "dates requises" }, { status: 400 });
        }

        await prisma.dynamicPrice.deleteMany({
          where: {
            listingId,
            date: { in: dates.map((d: string) => new Date(d)) },
          },
        });

        return NextResponse.json({ success: true });
      }

      case "update_listing_rules": {
        // Mettre à jour les règles globales de l'annonce
        const { minNights, maxNights } = data;

        await prisma.listing.update({
          where: { id: listingId },
          data: {
            minNights: minNights ?? undefined,
            maxNights: maxNights ?? undefined,
          },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
    }
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
