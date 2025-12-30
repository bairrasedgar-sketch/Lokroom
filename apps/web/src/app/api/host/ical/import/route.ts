import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/host/ical/import - Importer un calendrier iCal externe
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { listingId, icalUrl, name } = body;

    if (!listingId || !icalUrl) {
      return NextResponse.json(
        { error: "listingId et icalUrl requis" },
        { status: 400 }
      );
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

    // Télécharger et parser le calendrier iCal
    const icalResponse = await fetch(icalUrl);
    if (!icalResponse.ok) {
      return NextResponse.json(
        { error: "Impossible de télécharger le calendrier" },
        { status: 400 }
      );
    }

    const icalContent = await icalResponse.text();
    const events = parseICalendar(icalContent);

    // Vérifier si une source de sync existe déjà pour cette URL
    const existingSync = await prisma.calendarSync.findFirst({
      where: {
        listingId,
        externalUrl: icalUrl,
      },
    });

    let calendarSync;
    if (existingSync) {
      // Mettre à jour
      calendarSync = await prisma.calendarSync.update({
        where: { id: existingSync.id },
        data: {
          name: name || "Calendrier externe",
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
        },
      });
    } else {
      // Créer nouvelle source de sync
      calendarSync = await prisma.calendarSync.create({
        data: {
          id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          listingId,
          externalUrl: icalUrl,
          name: name || "Calendrier externe",
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
          updatedAt: new Date(),
        },
      });
    }

    // Créer les nouveaux blocages pour chaque événement (sans supprimer les anciens manuels)
    const blocksCreated: string[] = [];
    for (const event of events) {
      if (!event.start || !event.end) continue;

      const block = await prisma.calendarBlock.create({
        data: {
          listingId,
          start: event.start,
          end: event.end,
          reason: "MAINTENANCE", // On utilise MAINTENANCE pour les imports iCal
        },
      });
      blocksCreated.push(block.id);
    }

    return NextResponse.json({
      success: true,
      source: calendarSync,
      eventsCount: events.length,
      blocksCreatedCount: blocksCreated.length,
    });
  } catch (error) {
    console.error("iCal import error:", error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}

// GET /api/host/ical/import - Liste des sources iCal (CalendarSync)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json({ error: "listingId requis" }, { status: 400 });
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

  const sources = await prisma.calendarSync.findMany({
    where: { listingId },
    select: {
      id: true,
      name: true,
      externalUrl: true,
      lastSyncAt: true,
      lastSyncStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sources });
}

// DELETE /api/host/ical/import - Supprimer une source iCal
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("sourceId");

  if (!sourceId) {
    return NextResponse.json({ error: "sourceId requis" }, { status: 400 });
  }

  // Vérifier que l'utilisateur est le propriétaire
  const source = await prisma.calendarSync.findFirst({
    where: { id: sourceId },
    include: {
      Listing: {
        select: { ownerId: true },
      },
    },
  });

  if (!source || source.Listing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Source non trouvée" }, { status: 404 });
  }

  // Supprimer la source de synchronisation
  await prisma.calendarSync.delete({
    where: { id: sourceId },
  });

  return NextResponse.json({ success: true });
}

// Parser simple pour iCal
function parseICalendar(content: string): Array<{
  uid?: string;
  summary?: string;
  start?: Date;
  end?: Date;
}> {
  const events: Array<{
    uid?: string;
    summary?: string;
    start?: Date;
    end?: Date;
  }> = [];

  const lines = content.split(/\r?\n/);
  let currentEvent: {
    uid?: string;
    summary?: string;
    start?: Date;
    end?: Date;
  } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === "BEGIN:VEVENT") {
      currentEvent = {};
    } else if (trimmedLine === "END:VEVENT" && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      if (trimmedLine.startsWith("UID:")) {
        currentEvent.uid = trimmedLine.substring(4);
      } else if (trimmedLine.startsWith("SUMMARY:")) {
        currentEvent.summary = unescapeICalText(trimmedLine.substring(8));
      } else if (trimmedLine.startsWith("DTSTART")) {
        currentEvent.start = parseICalDate(trimmedLine);
      } else if (trimmedLine.startsWith("DTEND")) {
        currentEvent.end = parseICalDate(trimmedLine);
      }
    }
  }

  return events;
}

function parseICalDate(line: string): Date | undefined {
  // Format: DTSTART:20231215 ou DTSTART;VALUE=DATE:20231215 ou DTSTART:20231215T120000Z
  const match = line.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?/);
  if (!match) return undefined;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  if (match[4]) {
    // Avec heure
    const hour = parseInt(match[5], 10);
    const minute = parseInt(match[6], 10);
    const second = parseInt(match[7], 10);
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day);
}

function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
