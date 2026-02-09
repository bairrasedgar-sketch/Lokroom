// apps/web/src/app/api/disputes/route.ts
// API complète pour les litiges niveau Airbnb
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paginationSchema, validateSearchParams } from "@/lib/validations/api";

export const dynamic = "force-dynamic";

const RESPONSE_DEADLINE_DAYS = 3;

// GET /api/disputes - Liste des litiges de l'utilisateur
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  // Validation des paramètres de pagination
  const validation = validateSearchParams(req.nextUrl.searchParams, paginationSchema);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { page, limit } = validation.data;
  const status = req.nextUrl.searchParams.get("status");

  // Construire le filtre
  const where: Record<string, unknown> = {
    OR: [{ openedById: me.id }, { againstId: me.id }],
  };

  if (status) {
    where.status = status;
  }

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            currency: true,
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
                images: {
                  take: 1,
                  orderBy: { position: "asc" },
                  select: { url: true },
                },
              },
            },
          },
        },
        openedBy: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        User_Dispute_againstIdToUser: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            evidence: true,
          },
        },
      },
    }),
    prisma.dispute.count({ where }),
  ]);

  // Formater les résultats
  const formattedDisputes = disputes.map((d) => ({
    id: d.id,
    status: d.status,
    reason: d.reason,
    category: d.category,
    priority: d.priority,
    description: d.description.substring(0, 200) + (d.description.length > 200 ? "..." : ""),
    claimedAmountCents: d.claimedAmountCents,
    awardedAmountCents: d.awardedAmountCents,
    responseDeadline: d.responseDeadline,
    hasResponse: d.hasResponse,
    isEscalated: d.isEscalated,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    lastActivityAt: d.lastActivityAt,
    resolvedAt: d.resolvedAt,
    booking: {
      id: d.booking.id,
      startDate: d.booking.startDate,
      endDate: d.booking.endDate,
      totalPrice: d.booking.totalPrice,
      currency: d.booking.currency,
      listing: {
        id: d.booking.listing.id,
        title: d.booking.listing.title,
        city: d.booking.listing.city,
        imageUrl: d.booking.listing.images[0]?.url || null,
      },
    },
    openedBy: {
      id: d.openedBy.id,
      name: d.openedBy.name,
      avatarUrl: d.openedBy.profile?.avatarUrl || null,
      isMe: d.openedBy.id === me.id,
    },
    against: {
      id: d.User_Dispute_againstIdToUser.id,
      name: d.User_Dispute_againstIdToUser.name,
      avatarUrl: d.User_Dispute_againstIdToUser.profile?.avatarUrl || null,
      isMe: d.User_Dispute_againstIdToUser.id === me.id,
    },
    assignedAdmin: d.assignedAdmin
      ? { id: d.assignedAdmin.id, name: d.assignedAdmin.name }
      : null,
    messagesCount: d._count.messages,
    evidenceCount: d._count.evidence,
  }));

  return NextResponse.json({
    disputes: formattedDisputes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/disputes - Créer un nouveau litige
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  // Validation Zod du body
  const { createDisputeSchema, validateRequestBody } = await import("@/lib/validations/api");
  const validation = await validateRequestBody(req, createDisputeSchema);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const { bookingId, reason, description, claimedAmountCents } = validation.data;

  // Récupérer la réservation
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          ownerId: true,
          title: true,
        },
      },
      guest: {
        select: { id: true, name: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
  }

  const isGuest = booking.guestId === me.id;
  const isHost = booking.listing.ownerId === me.id;

  if (!isGuest && !isHost) {
    return NextResponse.json(
      { error: "forbidden_not_part_of_booking" },
      { status: 403 }
    );
  }

  // Vérifier qu'il n'y a pas déjà un litige ouvert pour cette réservation
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      bookingId: booking.id,
      status: {
        notIn: ["CLOSED", "RESOLVED_GUEST", "RESOLVED_HOST", "RESOLVED_PARTIAL"],
      },
    },
  });

  if (existingDispute) {
    return NextResponse.json(
      { error: "dispute_already_exists", disputeId: existingDispute.id },
      { status: 400 }
    );
  }

  // Déterminer la cible du litige
  const againstId = isGuest ? booking.listing.ownerId : booking.guestId;

  // Déterminer la catégorie
  const categoryMap: Record<string, "REFUND_REQUEST" | "PROPERTY_ISSUE" | "HOST_BEHAVIOR" | "GUEST_BEHAVIOR" | "PAYMENT_PROBLEM" | "CANCELLATION" | "SAFETY" | "OTHER"> = {
    PROPERTY_NOT_AS_DESCRIBED: "PROPERTY_ISSUE",
    CLEANLINESS_ISSUE: "PROPERTY_ISSUE",
    AMENITIES_MISSING: "PROPERTY_ISSUE",
    HOST_UNRESPONSIVE: "HOST_BEHAVIOR",
    GUEST_DAMAGE: "GUEST_BEHAVIOR",
    GUEST_VIOLATION: "GUEST_BEHAVIOR",
    PAYMENT_ISSUE: "PAYMENT_PROBLEM",
    CANCELLATION_DISPUTE: "CANCELLATION",
    SAFETY_CONCERN: "SAFETY",
    NOISE_COMPLAINT: "GUEST_BEHAVIOR",
    UNAUTHORIZED_GUESTS: "GUEST_BEHAVIOR",
    OTHER: "OTHER",
  };

  // Calculer la deadline de réponse
  const responseDeadline = new Date();
  responseDeadline.setDate(responseDeadline.getDate() + RESPONSE_DEADLINE_DAYS);

  // Créer le litige dans une transaction
  const dispute = await prisma.$transaction(async (tx) => {
    const d = await tx.dispute.create({
      data: {
        bookingId: booking.id,
        openedById: me.id,
        againstId,
        reason,
        description,
        category: categoryMap[reason] || "OTHER",
        claimedAmountCents: claimedAmountCents || null,
        responseDeadline,
        priority: reason === "SAFETY_CONCERN" ? 1 : 3,
      },
    });

    // Créer l'entrée dans la timeline
    await tx.disputeTimeline.create({
      data: {
        disputeId: d.id,
        event: "OPENED",
        actorId: me.id,
        details: `Litige ouvert par ${me.name || "l'utilisateur"}`,
      },
    });

    // Créer une notification pour la partie adverse
    await tx.notification.create({
      data: {
        userId: againstId,
        type: "DISPUTE_OPENED",
        title: "Nouveau litige ouvert",
        message: `Un litige a été ouvert concernant votre réservation "${booking.listing.title}"`,
        data: {
          disputeId: d.id,
          bookingId: booking.id,
          reason,
        },
        actionUrl: `/disputes/${d.id}`,
      },
    });

    return d;
  });

  return NextResponse.json({ dispute }, { status: 201 });
}
