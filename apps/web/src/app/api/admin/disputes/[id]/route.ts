/**
 * API Admin - Détail et actions sur un litige
 * GET /api/admin/disputes/[id]
 * PUT /api/admin/disputes/[id] - Actions (assign, resolve, message)
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("disputes:view");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                city: true,
                country: true,
                price: true,
                currency: true,
                images: {
                  where: { isCover: true },
                  take: 1,
                  select: { url: true },
                },
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: { select: { avatarUrl: true } },
                  },
                },
              },
            },
            guest: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        },
        openedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        User_Dispute_againstIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evidence: {
          include: {
            uploadedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Litige non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les notes admin
    const adminNotes = await prisma.adminNote.findMany({
      where: {
        targetType: "Dispute",
        targetId: id,
      },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer l'historique admin
    const auditHistory = await prisma.auditLog.findMany({
      where: {
        entityType: "Dispute",
        entityId: id,
      },
      include: {
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Construire la timeline (typage simplifié)
    
    const timeline: any[] = [
      {
        id: `opened-${dispute.id}`,
        type: "opened",
        date: dispute.createdAt,
        user: dispute.openedBy,
        content: `Litige ouvert: ${dispute.reason.replace(/_/g, " ")}`,
      },
      ...dispute.messages.map((msg) => ({
        id: msg.id,
        type: msg.isSystem ? "system" : msg.isAdmin ? "admin_message" : "user_message",
        date: msg.createdAt,
        user: msg.sender,
        content: msg.content,
        isAdmin: msg.isAdmin,
      })),
      ...dispute.evidence.map((ev) => ({
        id: ev.id,
        type: "evidence",
        date: ev.createdAt,
        user: ev.uploadedBy,
        content: ev.description || `Fichier ajouté: ${ev.fileName}`,
        fileUrl: ev.fileUrl,
        fileType: ev.fileType,
        fileName: ev.fileName,
      })),
      ...auditHistory.map((log) => ({
        id: log.id,
        type: "admin_action",
        date: log.createdAt,
        user: { id: log.admin.email, name: log.admin.name },
        content: log.action.replace(/_/g, " "),
        details: log.details,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (dispute.resolvedAt) {
      timeline.push({
        id: `resolved-${dispute.id}`,
        type: "resolved",
        date: dispute.resolvedAt,
        user: dispute.assignedAdmin || { id: "system", name: "Système" },
        content: `Litige résolu: ${dispute.resolution || "Fermé"}`,
      });
    }

    return NextResponse.json({
      dispute: {
        ...dispute,
        against: dispute.User_Dispute_againstIdToUser,
        coverImage: dispute.booking.listing.images[0]?.url || null,
        timeline,
        adminNotes,
      },
    });
  } catch (error) {
    logger.error("Erreur API admin dispute detail:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, resolution, awardedAmount, message, priority } = body;

  const auth = await requireAdminPermission("disputes:manage");
  if ("error" in auth) return auth.error;

  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        openedBy: { select: { email: true, name: true } },
        User_Dispute_againstIdToUser: { select: { email: true, name: true } },
        booking: { select: { id: true, totalPrice: true } },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Litige non trouvé" },
        { status: 404 }
      );
    }

    switch (action) {
      case "assign": {
        await prisma.dispute.update({
          where: { id },
          data: {
            assignedAdminId: auth.session.user.id,
            status: dispute.status === "OPEN" ? "UNDER_REVIEW" : dispute.status,
          },
        });

        // Ajouter un message système
        await prisma.disputeMessage.create({
          data: {
            disputeId: id,
            senderId: auth.session.user.id,
            content: "Un administrateur a été assigné à ce litige.",
            isSystem: true,
            isAdmin: true,
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "DISPUTE_ASSIGNED",
          targetType: "Dispute",
          targetId: id,
          details: { reason: dispute.reason },
          request,
        });

        return NextResponse.json({ success: true, status: "UNDER_REVIEW" });
      }

      case "message": {
        if (!message?.trim()) {
          return NextResponse.json(
            { error: "Message requis" },
            { status: 400 }
          );
        }

        const newMessage = await prisma.disputeMessage.create({
          data: {
            disputeId: id,
            senderId: auth.session.user.id,
            content: message,
            isAdmin: true,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        });

        return NextResponse.json({ success: true, message: newMessage });
      }

      case "resolve": {
        if (!resolution?.trim()) {
          return NextResponse.json(
            { error: "Résolution requise" },
            { status: 400 }
          );
        }

        const status = awardedAmount > 0 ? "RESOLVED_GUEST" : "CLOSED";

        await prisma.dispute.update({
          where: { id },
          data: {
            status,
            resolution,
            awardedAmountCents: awardedAmount || 0,
            resolvedAt: new Date(),
            assignedAdminId: dispute.assignedAdminId || auth.session.user.id,
          },
        });

        // Si remboursement accordé, mettre à jour la réservation
        if (awardedAmount > 0) {
          await prisma.booking.update({
            where: { id: dispute.booking.id },
            data: {
              refundAmountCents: {
                increment: awardedAmount,
              },
            },
          });
        }

        // Message système
        await prisma.disputeMessage.create({
          data: {
            disputeId: id,
            senderId: auth.session.user.id,
            content: `Litige résolu. ${awardedAmount ? `Remboursement accordé: ${awardedAmount / 100}€` : "Aucun remboursement."}`,
            isSystem: true,
            isAdmin: true,
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "DISPUTE_RESOLVED",
          targetType: "Dispute",
          targetId: id,
          details: {
            resolution,
            awardedAmount,
            status,
          },
          request,
        });

        return NextResponse.json({ success: true, status });
      }

      case "escalate": {
        await prisma.dispute.update({
          where: { id },
          data: {
            status: "ESCALATED",
            priority: 1,
          },
        });

        await prisma.disputeMessage.create({
          data: {
            disputeId: id,
            senderId: auth.session.user.id,
            content: "Ce litige a été escaladé pour examen prioritaire.",
            isSystem: true,
            isAdmin: true,
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "DISPUTE_ESCALATED",
          targetType: "Dispute",
          targetId: id,
          details: { previousPriority: dispute.priority },
          request,
        });

        return NextResponse.json({ success: true, status: "ESCALATED" });
      }

      case "update_priority": {
        if (priority === undefined) {
          return NextResponse.json(
            { error: "Priorité requise" },
            { status: 400 }
          );
        }

        await prisma.dispute.update({
          where: { id },
          data: { priority },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "DISPUTE_STATUS_CHANGED",
          targetType: "Dispute",
          targetId: id,
          details: { previousPriority: dispute.priority, newPriority: priority },
          request,
        });

        return NextResponse.json({ success: true, priority });
      }

      case "close": {
        await prisma.dispute.update({
          where: { id },
          data: {
            status: "CLOSED",
            resolution: resolution || "Fermé sans suite",
            resolvedAt: new Date(),
          },
        });

        await prisma.disputeMessage.create({
          data: {
            disputeId: id,
            senderId: auth.session.user.id,
            content: resolution || "Litige fermé sans suite.",
            isSystem: true,
            isAdmin: true,
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "DISPUTE_RESOLVED",
          targetType: "Dispute",
          targetId: id,
          details: { resolution },
          request,
        });

        return NextResponse.json({ success: true, status: "CLOSED" });
      }

      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error("Erreur action dispute:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
