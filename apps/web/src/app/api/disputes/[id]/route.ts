// apps/web/src/app/api/disputes/[id]/route.ts
// API pour un litige spécifique
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/disputes/[id] - Détails d'un litige
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      booking: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          currency: true,
          status: true,
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              images: {
                take: 3,
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
          email: true,
          createdAt: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      User_Dispute_againstIdToUser: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      assignedAdmin: {
        select: {
          id: true,
          name: true,
        },
      },
      evidence: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      },
      timeline: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!dispute) {
    return NextResponse.json({ error: "dispute_not_found" }, { status: 404 });
  }

  // Vérifier l'accès (partie du litige ou admin)
  const isParty = dispute.openedById === me.id || dispute.againstId === me.id;
  const isAdmin = me.role === "ADMIN";

  if (!isParty && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Formater la réponse
  const response = {
    id: dispute.id,
    status: dispute.status,
    reason: dispute.reason,
    category: dispute.category,
    priority: dispute.priority,
    description: dispute.description,
    claimedAmountCents: dispute.claimedAmountCents,
    awardedAmountCents: dispute.awardedAmountCents,
    resolution: dispute.resolution,
    responseDeadline: dispute.responseDeadline,
    hasResponse: dispute.hasResponse,
    isEscalated: dispute.isEscalated,
    escalationReason: dispute.escalationReason,
    refundProcessed: dispute.refundProcessed,
    createdAt: dispute.createdAt,
    updatedAt: dispute.updatedAt,
    lastActivityAt: dispute.lastActivityAt,
    resolvedAt: dispute.resolvedAt,
    booking: {
      id: dispute.booking.id,
      startDate: dispute.booking.startDate,
      endDate: dispute.booking.endDate,
      totalPrice: dispute.booking.totalPrice,
      currency: dispute.booking.currency,
      status: dispute.booking.status,
      listing: {
        id: dispute.booking.listing.id,
        title: dispute.booking.listing.title,
        city: dispute.booking.listing.city,
        country: dispute.booking.listing.country,
        images: dispute.booking.listing.images.map((i) => i.url),
      },
    },
    openedBy: {
      id: dispute.openedBy.id,
      name: dispute.openedBy.name,
      email: isAdmin ? dispute.openedBy.email : undefined,
      avatarUrl: dispute.openedBy.profile?.avatarUrl || null,
      memberSince: dispute.openedBy.createdAt,
      isMe: dispute.openedBy.id === me.id,
    },
    against: {
      id: dispute.User_Dispute_againstIdToUser.id,
      name: dispute.User_Dispute_againstIdToUser.name,
      email: isAdmin ? dispute.User_Dispute_againstIdToUser.email : undefined,
      avatarUrl: dispute.User_Dispute_againstIdToUser.profile?.avatarUrl || null,
      memberSince: dispute.User_Dispute_againstIdToUser.createdAt,
      isMe: dispute.User_Dispute_againstIdToUser.id === me.id,
    },
    assignedAdmin: dispute.assignedAdmin
      ? { id: dispute.assignedAdmin.id, name: dispute.assignedAdmin.name }
      : null,
    evidence: dispute.evidence.map((e) => ({
      id: e.id,
      fileUrl: e.fileUrl,
      fileType: e.fileType,
      fileName: e.fileName,
      description: e.description,
      createdAt: e.createdAt,
      uploadedBy: {
        id: e.uploadedBy.id,
        name: e.uploadedBy.name,
        isMe: e.uploadedBy.id === me.id,
      },
    })),
    messages: dispute.messages.map((m) => ({
      id: m.id,
      content: m.content,
      isAdmin: m.isAdmin,
      isSystem: m.isSystem,
      createdAt: m.createdAt,
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        avatarUrl: m.sender.profile?.avatarUrl || null,
        isMe: m.sender.id === me.id,
      },
    })),
    timeline: dispute.timeline.map((t) => ({
      id: t.id,
      event: t.event,
      details: t.details,
      createdAt: t.createdAt,
    })),
    isAdmin,
    canRespond:
      dispute.againstId === me.id &&
      !dispute.hasResponse &&
      dispute.status === "OPEN",
    canAddEvidence: isParty && !["CLOSED", "RESOLVED_GUEST", "RESOLVED_HOST", "RESOLVED_PARTIAL"].includes(dispute.status),
    canSendMessage: isParty || isAdmin,
  };

  return NextResponse.json({ dispute: response });
}

// PATCH /api/disputes/[id] - Mettre à jour un litige (répondre, ajouter preuve, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, role: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
  });

  if (!dispute) {
    return NextResponse.json({ error: "dispute_not_found" }, { status: 404 });
  }

  const isParty = dispute.openedById === me.id || dispute.againstId === me.id;
  const isAdmin = me.role === "ADMIN";

  if (!isParty && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Action: Répondre au litige (partie adverse)
  if (body.action === "respond" && dispute.againstId === me.id) {
    if (dispute.hasResponse) {
      return NextResponse.json({ error: "already_responded" }, { status: 400 });
    }

    const response = body.response?.trim();
    if (!response) {
      return NextResponse.json({ error: "response_required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id },
        data: {
          hasResponse: true,
          status: "UNDER_REVIEW",
          lastActivityAt: new Date(),
        },
      });

      await tx.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: me.id,
          content: response,
          isAdmin: false,
        },
      });

      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          event: "RESPONSE_RECEIVED",
          actorId: me.id,
          details: `Réponse reçue de ${me.name || "la partie adverse"}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: dispute.openedById,
          type: "DISPUTE_UPDATE",
          title: "Réponse reçue",
          message: "La partie adverse a répondu à votre litige",
          data: { disputeId: id },
          actionUrl: `/disputes/${id}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  }

  // Action: Envoyer un message
  if (body.action === "message") {
    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "content_required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: me.id,
          content,
          isAdmin,
        },
      });

      await tx.dispute.update({
        where: { id },
        data: { lastActivityAt: new Date() },
      });

      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          event: "MESSAGE_SENT",
          actorId: me.id,
        },
      });

      // Notifier l'autre partie
      const notifyUserId =
        dispute.openedById === me.id ? dispute.againstId : dispute.openedById;
      await tx.notification.create({
        data: {
          userId: notifyUserId,
          type: "DISPUTE_UPDATE",
          title: "Nouveau message",
          message: "Vous avez reçu un nouveau message dans votre litige",
          data: { disputeId: id },
          actionUrl: `/disputes/${id}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  }

  // Action: Ajouter une preuve
  if (body.action === "evidence") {
    if (!body.fileUrl || !body.fileType || !body.fileName) {
      return NextResponse.json(
        { error: "fileUrl, fileType and fileName required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.disputeEvidence.create({
        data: {
          disputeId: id,
          uploadedById: me.id,
          fileUrl: body.fileUrl,
          fileType: body.fileType,
          fileName: body.fileName,
          description: body.description || null,
        },
      });

      await tx.dispute.update({
        where: { id },
        data: { lastActivityAt: new Date() },
      });

      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          event: "EVIDENCE_ADDED",
          actorId: me.id,
          details: `Preuve ajoutée: ${body.fileName}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  }

  // Action: Escalader (partie ou admin)
  if (body.action === "escalate" && (isParty || isAdmin)) {
    if (dispute.isEscalated) {
      return NextResponse.json({ error: "already_escalated" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id },
        data: {
          isEscalated: true,
          escalatedAt: new Date(),
          escalationReason: body.reason || null,
          status: "ESCALATED",
          priority: 1,
          lastActivityAt: new Date(),
        },
      });

      await tx.disputeTimeline.create({
        data: {
          disputeId: id,
          event: "ESCALATED",
          actorId: me.id,
          details: body.reason || "Litige escaladé",
        },
      });
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
