/**
 * API Admin - Recherche globale
 * GET /api/admin/search?q=query
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("dashboard:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({
      users: [],
      listings: [],
      bookings: [],
    });
  }

  try {
    const [users, listings, bookings] = await Promise.all([
      // Recherche utilisateurs
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        take: 5,
      }),

      // Recherche annonces
      prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { country: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          city: true,
        },
        take: 5,
      }),

      // Recherche réservations (par ID ou par guest/listing)
      prisma.booking.findMany({
        where: {
          OR: [
            { id: { contains: query } },
            { guest: { name: { contains: query, mode: "insensitive" } } },
            { guest: { email: { contains: query, mode: "insensitive" } } },
            { listing: { title: { contains: query, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          guest: { select: { name: true } },
          listing: { select: { title: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      users,
      listings,
      bookings: bookings.map((b) => ({
        id: b.id,
        guestName: b.guest.name || "Voyageur",
        listingTitle: b.listing.title,
      })),
    });
  } catch (error) {
    console.error("Erreur recherche admin:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
