// apps/web/src/app/api/cron/support-reminder/route.ts
// Cette route est appelée périodiquement (par Vercel Cron ou autre) pour envoyer des rappels
// aux admins si une demande de support n'a pas été prise en charge après 15 minutes

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

// Vérifier le secret pour sécuriser l'endpoint cron
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Vérifier l'autorisation (optionnel mais recommandé)
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Trouver les conversations en attente depuis plus de 15 minutes
    // qui n'ont pas encore reçu de rappel email
    const pendingConversations = await prisma.supportConversation.findMany({
      where: {
        status: "WAITING_AGENT",
        assignedAdminId: null,
        initialEmailSentAt: { not: null },
        reminderEmailSentAt: null,
        createdAt: { lte: fifteenMinutesAgo },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (pendingConversations.length === 0) {
      return NextResponse.json({ message: "No pending conversations to remind", count: 0 });
    }

    // Récupérer tous les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true },
    });

    let remindersSent = 0;

    for (const conversation of pendingConversations) {
      // Envoyer un rappel à chaque admin
      for (const admin of admins) {
        try {
          await sendReminderEmail(admin.email, {
            adminName: admin.name || "Admin",
            userName: conversation.user.name || conversation.user.email,
            subject: conversation.subject || "Demande de support",
            conversationId: conversation.id,
            waitingTime: Math.round((Date.now() - new Date(conversation.createdAt).getTime()) / 60000),
          });
        } catch (e) {
          logger.error("Erreur envoi email rappel:", e);
        }
      }

      // Marquer le rappel comme envoyé
      await prisma.supportConversation.update({
        where: { id: conversation.id },
        data: { reminderEmailSentAt: new Date() },
      });

      remindersSent++;
    }

    return NextResponse.json({
      message: "Reminders sent successfully",
      count: remindersSent,
    });
  } catch (error) {
    logger.error("Error in support reminder cron:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendReminderEmail(
  adminEmail: string,
  data: {
    adminName: string;
    userName: string;
    subject: string;
    conversationId: string;
    waitingTime: number;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    logger.debug("Resend non configuré, email non envoyé");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const baseUrl = process.env.NEXTAUTH_URL || "https://lokroom.com";

  await resend.emails.send({
    from: "Lok'Room Support <support@lokroom.com>",
    to: adminEmail,
    subject: `⏰ RAPPEL : Demande de support en attente depuis ${data.waitingTime} min`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">⏰ Cette demande attend depuis ${data.waitingTime} minutes</p>
        </div>
        <h2 style="color: #1a1a1a;">Rappel : Demande de support en attente</h2>
        <p>Bonjour ${data.adminName},</p>
        <p><strong>${data.userName}</strong> attend toujours une réponse.</p>
        <p><strong>Sujet :</strong> ${data.subject}</p>
        <p style="margin-top: 20px;">
          <a href="${baseUrl}/admin/support/${data.conversationId}"
             style="background-color: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Prendre en charge maintenant
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Cet email a été envoyé automatiquement par Lok'Room.
        </p>
      </div>
    `,
  });
}
