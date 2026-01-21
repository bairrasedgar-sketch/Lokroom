// apps/web/src/app/api/support/assign/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/support/assign → un admin prend en charge une conversation
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { conversationId } = body as { conversationId: string };

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // Vérifier que la conversation existe
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedAdmin: { select: { id: true, name: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Vérifier si déjà assignée à un autre admin
  if (conversation.assignedAdminId && conversation.assignedAdminId !== user.id) {
    return NextResponse.json({
      error: "Conversation already assigned",
      assignedTo: conversation.assignedAdmin?.name || "Un autre admin",
    }, { status: 409 });
  }

  // Assigner l'admin à la conversation
  const updated = await prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      assignedAdminId: user.id,
      assignedAt: new Date(),
      status: "WITH_AGENT",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  // Ajouter un message système
  await prisma.supportMessage.create({
    data: {
      conversationId,
      content: `${user.name || "Un agent"} a pris en charge votre demande.`,
      type: "SYSTEM",
    },
  });

  // Envoyer UN SEUL email de confirmation aux autres admins (si pas déjà envoyé)
  if (!conversation.assignmentEmailSent) {
    await notifyAdminsConversationAssigned(conversationId, user.id, user.name || user.email);
    await prisma.supportConversation.update({
      where: { id: conversationId },
      data: { assignmentEmailSent: true },
    });
  }

  return NextResponse.json({ conversation: updated });
}

// DELETE /api/support/assign → un admin se désassigne d'une conversation
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (conversation.assignedAdminId !== user.id) {
    return NextResponse.json({ error: "Not assigned to you" }, { status: 403 });
  }

  // Désassigner (mais garder assignmentEmailSent à true pour ne pas renvoyer d'emails)
  await prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      assignedAdminId: null,
      assignedAt: null,
      status: "WAITING_AGENT",
    },
  });

  // Message système
  await prisma.supportMessage.create({
    data: {
      conversationId,
      content: "L'agent s'est désassigné. Un autre membre de l'équipe va vous répondre.",
      type: "SYSTEM",
    },
  });

  return NextResponse.json({ success: true });
}

// Notifier les autres admins que la conversation a été prise en charge (UNE SEULE FOIS)
async function notifyAdminsConversationAssigned(
  conversationId: string,
  assignedAdminId: string,
  adminName: string
) {
  // Récupérer tous les autres admins
  const otherAdmins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      id: { not: assignedAdminId },
    },
    select: { id: true, email: true, name: true },
  });

  // Envoyer un email à chaque admin (une seule fois)
  for (const admin of otherAdmins) {
    try {
      await sendAssignmentNotificationEmail(admin.email, {
        adminName: admin.name || "Admin",
        assignedByName: adminName,
        conversationId,
      });
    } catch (e) {
      console.error("Erreur envoi email assignation:", e);
    }
  }
}

async function sendAssignmentNotificationEmail(
  adminEmail: string,
  data: {
    adminName: string;
    assignedByName: string;
    conversationId: string;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Lok'Room Support <support@lokroom.com>",
    to: adminEmail,
    subject: `✅ Demande de support prise en charge`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Demande de support prise en charge</h2>
        <p>Bonjour ${data.adminName},</p>
        <p><strong>${data.assignedByName}</strong> a pris en charge la demande de support.</p>
        <p>Vous n'avez plus besoin d'intervenir sur cette conversation.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Cet email a été envoyé automatiquement par Lok'Room.
        </p>
      </div>
    `,
  });
}
