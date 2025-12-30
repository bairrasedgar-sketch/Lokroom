import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/host/ical/export/[listingId] - Exporter le calendrier en format iCal
export async function GET(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { listingId } = params;

  // Vérifier que l'utilisateur est le propriétaire
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Annonce non trouvée" }, { status: 404 });
  }

  // Récupérer les réservations confirmées
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: ["CONFIRMED", "PENDING"] },
      endDate: { gte: new Date() },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      guest: {
        select: { name: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  // Récupérer les blocages (CalendarBlock sans bookingId = blocage manuel)
  const blockedPeriods = await prisma.calendarBlock.findMany({
    where: {
      listingId,
      bookingId: null, // Seulement les blocages manuels
      end: { gte: new Date() },
    },
    select: {
      id: true,
      start: true,
      end: true,
      reason: true,
    },
    orderBy: { start: "asc" },
  });

  // Générer le contenu iCal
  const icalContent = generateICalendar(listing, bookings, blockedPeriods);

  return new Response(icalContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${listing.title.replace(/[^a-z0-9]/gi, "_")}.ics"`,
    },
  });
}

function generateICalendar(
  listing: { id: string; title: string },
  bookings: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    guest: { name: string | null };
  }>,
  blockedPeriods: Array<{
    id: string;
    start: Date;
    end: Date;
    reason: string | null;
  }>
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lok'Room//Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(listing.title)}`,
  ];

  // Ajouter les réservations
  for (const booking of bookings) {
    const uid = `booking-${booking.id}@lokroom.com`;
    const summary =
      booking.status === "CONFIRMED"
        ? `Réservation - ${booking.guest.name || "Voyageur"}`
        : `En attente - ${booking.guest.name || "Voyageur"}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${formatICalDate(booking.startDate)}`,
      `DTEND;VALUE=DATE:${formatICalDate(booking.endDate)}`,
      `SUMMARY:${escapeICalText(summary)}`,
      `DESCRIPTION:${escapeICalText(`Réservation ${booking.status === "CONFIRMED" ? "confirmée" : "en attente"} pour ${listing.title}`)}`,
      `STATUS:${booking.status === "CONFIRMED" ? "CONFIRMED" : "TENTATIVE"}`,
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }

  // Ajouter les blocages
  for (const blocked of blockedPeriods) {
    const uid = `blocked-${blocked.id}@lokroom.com`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${formatICalDate(blocked.start)}`,
      `DTEND;VALUE=DATE:${formatICalDate(blocked.end)}`,
      `SUMMARY:${escapeICalText(blocked.reason || "Indisponible")}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
