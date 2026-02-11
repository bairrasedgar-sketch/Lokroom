import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const addAmenitiesSchema = z.object({
  amenityIds: z.array(z.string()).min(1, "Au moins une amenity requise").max(50),
});

/**
 * POST /api/listings/[id]/amenities
 * Ajouter des amenities à une annonce
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You don't own this listing" },
        { status: 403 }
      );
    }

    // Valider le body
    const body = await req.json();
    const validation = addAmenitiesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amenityIds } = validation.data;

    // Vérifier que toutes les amenities existent
    const amenities = await prisma.amenity.findMany({
      where: { id: { in: amenityIds } },
    });

    if (amenities.length !== amenityIds.length) {
      return NextResponse.json(
        { error: "Some amenities not found" },
        { status: 400 }
      );
    }

    // Supprimer les anciennes relations
    await prisma.listingAmenity.deleteMany({
      where: { listingId: params.id },
    });

    // Créer les nouvelles relations
    await prisma.listingAmenity.createMany({
      data: amenityIds.map((amenityId) => ({
        listingId: params.id,
        amenityId,
      })),
    });

    // Récupérer les amenities mises à jour
    const updatedAmenities = await prisma.listingAmenity.findMany({
      where: { listingId: params.id },
      include: { amenity: true },
    });

    return NextResponse.json({
      success: true,
      amenities: updatedAmenities.map((la) => la.amenity),
    });
  } catch (err) {
    logger.error("POST /api/listings/[id]/amenities error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]/amenities?amenityId=xxx
 * Retirer une amenity d'une annonce
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You don't own this listing" },
        { status: 403 }
      );
    }

    const amenityId = req.nextUrl.searchParams.get("amenityId");

    if (!amenityId) {
      return NextResponse.json(
        { error: "amenityId query parameter required" },
        { status: 400 }
      );
    }

    // Supprimer la relation
    await prisma.listingAmenity.delete({
      where: {
        listingId_amenityId: {
          listingId: params.id,
          amenityId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/listings/[id]/amenities error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
