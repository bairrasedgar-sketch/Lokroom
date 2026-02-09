// apps/web/src/app/api/admin/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateReviewSchema = z.object({
  status: z.enum(["PENDING", "PUBLISHED", "FLAGGED", "HIDDEN", "DELETED"]).optional(),
  adminNotes: z.string().max(1000).optional(),
});

/**
 * PATCH /api/admin/reviews/:id
 * Modérer un avis (admin uniquement)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const reviewId = params.id;

  // Vérifier que le review existe
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Valider le body
  const json = await req.json().catch(() => null);
  const parsed = updateReviewSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // Mettre à jour le review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(status && { status }),
    },
  });

  // Logger l'action admin
  await prisma.auditLog.create({
    data: {
      adminId: me.id,
      action: "LISTING_APPROVED", // On pourrait ajouter REVIEW_MODERATED
      entityType: "Review",
      entityId: reviewId,
      details: {
        oldStatus: review.status,
        newStatus: status,
      },
    },
  });

  return NextResponse.json({ review: updatedReview });
}

/**
 * DELETE /api/admin/reviews/:id
 * Supprimer définitivement un avis (admin uniquement)
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const reviewId = params.id;

  // Vérifier que le review existe
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      photos: true,
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Supprimer les photos associées
  if (review.photos.length > 0) {
    await prisma.reviewPhoto.deleteMany({
      where: { reviewId },
    });
  }

  // Supprimer le review
  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Logger l'action admin
  await prisma.auditLog.create({
    data: {
      adminId: me.id,
      action: "LISTING_DELETED", // On pourrait ajouter REVIEW_DELETED
      entityType: "Review",
      entityId: reviewId,
      details: {
        listingId: review.listingId,
        authorId: review.authorId,
        rating: review.rating,
      },
    },
  });

  return new NextResponse(null, { status: 204 });
}
