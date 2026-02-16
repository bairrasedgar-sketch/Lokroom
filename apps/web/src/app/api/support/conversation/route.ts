// apps/web/src/app/api/support/conversation/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/support/conversation → récupère la conversation support de l'utilisateur
export async function GET(req: Request) {
  try {
    // 🔒 RATE LIMITING: 30 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`support-conversation-get:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Récupérer la conversation active (non fermée) de l'utilisateur
  const conversation = await prisma.supportConversation.findFirst({
    where: {
      userId: user.id,
      status: { notIn: ["CLOSED"] },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      assignedAdmin: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

    return NextResponse.json({ conversation });
  } catch (error) {
    logger.error("GET /api/support/conversation error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/support/conversation → crée une nouvelle conversation support
export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour création
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`support-conversation-post:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { subject, initialMessage, requestAgent } = body as {
    subject?: string;
    initialMessage?: string;
    requestAgent?: boolean;
  };

  // Vérifier s'il y a déjà une conversation active
  const existingConversation = await prisma.supportConversation.findFirst({
    where: {
      userId: user.id,
      status: { notIn: ["CLOSED", "RESOLVED"] },
    },
  });

  if (existingConversation) {
    // Si on demande un agent, mettre à jour le statut
    if (requestAgent && existingConversation.status === "WITH_AI") {
      const updated = await prisma.supportConversation.update({
        where: { id: existingConversation.id },
        data: {
          status: "WAITING_AGENT",
          subject: subject || existingConversation.subject,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // Ajouter un message système
      await prisma.supportMessage.create({
        data: {
          conversationId: updated.id,
          content: "Vous avez demandé à parler à un agent. Un membre de notre équipe va vous répondre sous peu.",
          type: "SYSTEM",
        },
      });

      // Notifier les admins (seulement si pas déjà notifié)
      if (!existingConversation.initialEmailSentAt) {
        await notifyAdminsNewSupportRequest(updated.id, user.id, subject);
        await prisma.supportConversation.update({
          where: { id: updated.id },
          data: { initialEmailSentAt: new Date() },
        });
      }

      return NextResponse.json({ conversation: updated, created: false });
    }

    return NextResponse.json({ conversation: existingConversation, created: false });
  }

  // Créer une nouvelle conversation
  const conversation = await prisma.supportConversation.create({
    data: {
      userId: user.id,
      subject: subject || null,
      status: requestAgent ? "WAITING_AGENT" : "WITH_AI",
      priority: requestAgent ? 2 : 3,
      initialEmailSentAt: requestAgent ? new Date() : null,
    },
  });

  // Ajouter le message initial de l'utilisateur si fourni
  if (initialMessage) {
    await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: initialMessage,
        type: "USER",
      },
    });
  }

  // Si on demande un agent directement, ajouter un message système
  if (requestAgent) {
    await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        content: "Veuillez patienter, nous vous mettons en relation avec un agent. Un membre de notre équipe va vous répondre sous peu.",
        type: "SYSTEM",
      },
    });

    // Notifier les admins (premier email)
    await notifyAdminsNewSupportRequest(conversation.id, user.id, subject);
  }

  const fullConversation = await prisma.supportConversation.findUnique({
    where: { id: conversation.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

    return NextResponse.json({ conversation: fullConversation, created: true });
  } catch (error) {
    logger.error("POST /api/support/conversation error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Fonction pour notifier les admins d'une nouvelle demande de support (email uniquement - UNE SEULE FOIS)
async function notifyAdminsNewSupportRequest(
  conversationId: string,
  userId: string,
  subject?: string | null
) {
  // Récupérer tous les admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, name: true },
  });

  // Récupérer les infos de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  // Envoyer un email à chaque admin (pas de notification dans le système classique)
  for (const admin of admins) {
    try {
      await sendSupportNotificationEmail(admin.email, {
        adminName: admin.name || "Admin",
        userName: user?.name || user?.email || "Utilisateur",
        subject: subject || "Demande de support",
        conversationId,
      });
    } catch (e) {
      logger.error("Erreur envoi email support:", e);
    }
  }
}

// Fonction pour envoyer un email de notification aux admins
async function sendSupportNotificationEmail(
  adminEmail: string,
  data: {
    adminName: string;
    userName: string;
    subject: string;
    conversationId: string;
  }
) {
  // Vérifier si Resend est configuré
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
    subject: `🆘 Nouvelle demande de support : ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Nouvelle demande de support</h2>
        <p>Bonjour ${data.adminName},</p>
        <p><strong>${data.userName}</strong> a besoin d'aide sur Lok'Room.</p>
        <p><strong>Sujet :</strong> ${data.subject}</p>
        <p style="margin-top: 20px;">
          <a href="${baseUrl}/admin/support/${data.conversationId}"
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Prendre en charge
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Cet email a été envoyé automatiquement par Lok'Room.
        </p>
      </div>
    `,
  });
}
