// API endpoint pour le chatbot support Lok'Room
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGeminiResponse } from "@/lib/gemini";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Rate limiting simple (en mémoire)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // 20 messages par minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// Mots-clés qui déclenchent une escalade vers un agent humain
const CRITICAL_KEYWORDS = [
  "changer mon email",
  "modifier mon email",
  "changement d'adresse mail",
  "changement email",
  "modifier adresse mail",
  "supprimer mon compte",
  "fraude",
  "arnaque",
  "vol",
  "urgence",
  "urgent",
  "parler à un humain",
  "parler à quelqu'un",
  "agent humain",
  "vrai personne",
  "remboursement urgent",
  "problème grave",
  "litige",
  "plainte",
];

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Vérifie si le message contient des mots-clés critiques
function isCriticalMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRITICAL_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier que la clé API est configurée
    if (!process.env.GEMINI_API_KEY) {
      logger.error("[Support Chat] GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "Service non configuré", debug: "GEMINI_API_KEY missing" },
        { status: 500 }
      );
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de messages. Veuillez patienter une minute." },
        { status: 429 }
      );
    }

    // Parser le body
    const body = await req.json().catch(() => null);
    const message = body?.message;
    const requestAgent = body?.requestAgent === true;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Limiter la longueur du message
    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message trop long (max 1000 caractères)" },
        { status: 400 }
      );
    }

    // Récupérer la session utilisateur
    const session = await getServerSession(authOptions);

    // Vérifier si l'utilisateur a une conversation active avec un agent
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (user) {
        // Chercher une conversation active avec un agent
        const activeConversation = await prisma.supportConversation.findFirst({
          where: {
            userId: user.id,
            status: { in: ["WAITING_AGENT", "WITH_AGENT"] },
          },
        });

        // Si une conversation avec agent existe, ajouter le message directement
        if (activeConversation) {
          await prisma.supportMessage.create({
            data: {
              conversationId: activeConversation.id,
              senderId: user.id,
              content: message,
              type: "USER",
            },
          });

          // Mettre à jour le timestamp de la conversation
          await prisma.supportConversation.update({
            where: { id: activeConversation.id },
            data: { updatedAt: new Date() },
          });

          return NextResponse.json({
            response: null, // Pas de réponse auto, l'agent répondra
            timestamp: new Date().toISOString(),
            messageSent: true,
            conversationId: activeConversation.id,
          });
        }
      }
    }

    // Vérifier si c'est une demande critique ou une demande explicite d'agent
    const isCritical = isCriticalMessage(message);

    // Si l'utilisateur demande explicitement un agent ou si c'est critique
    if (requestAgent || isCritical) {
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });

        if (user) {
          // Créer ou récupérer la conversation support
          let conversation = await prisma.supportConversation.findFirst({
            where: {
              userId: user.id,
              status: { notIn: ["CLOSED", "RESOLVED"] },
            },
          });

          if (!conversation) {
            conversation = await prisma.supportConversation.create({
              data: {
                userId: user.id,
                subject: message.substring(0, 100),
                status: "WAITING_AGENT",
                priority: 2,
                initialEmailSentAt: new Date(), // Marquer l'email comme envoyé
              },
            });

            // Notifier les admins SEULEMENT pour une nouvelle conversation
            await notifyAdmins(conversation.id, user.id, message.substring(0, 100));
          } else if (conversation.status === "WITH_AI") {
            // Escalade d'une conversation existante
            const shouldSendEmail = !conversation.initialEmailSentAt;

            await prisma.supportConversation.update({
              where: { id: conversation.id },
              data: {
                status: "WAITING_AGENT",
                initialEmailSentAt: conversation.initialEmailSentAt || new Date(),
              },
            });

            // Notifier les admins SEULEMENT si pas déjà notifié
            if (shouldSendEmail) {
              await notifyAdmins(conversation.id, user.id, message.substring(0, 100));
            }
          }
          // Si déjà en WAITING_AGENT ou WITH_AGENT, on n'envoie PAS d'email

          // Ajouter le message de l'utilisateur
          await prisma.supportMessage.create({
            data: {
              conversationId: conversation.id,
              senderId: user.id,
              content: message,
              type: "USER",
            },
          });

          // Ajouter un message système
          await prisma.supportMessage.create({
            data: {
              conversationId: conversation.id,
              content: "Veuillez patienter, nous vous mettons en relation avec un agent. Un membre de notre équipe va vous répondre sous peu.",
              type: "SYSTEM",
            },
          });

          return NextResponse.json({
            response: "Je comprends que votre demande nécessite l'intervention d'un membre de notre équipe. Veuillez patienter, nous vous mettons en relation avec un agent. Un membre de notre équipe va vous répondre sous peu.\n\nVous recevrez une notification dès qu'un agent prendra en charge votre demande.",
            timestamp: new Date().toISOString(),
            escalatedToAgent: true,
            conversationId: conversation.id,
          });
        }
      }

      // Si pas connecté, proposer de se connecter
      return NextResponse.json({
        response: "Pour vous mettre en relation avec un agent, veuillez vous connecter à votre compte Lok'Room. Cela nous permettra de mieux vous aider et de suivre votre demande.",
        timestamp: new Date().toISOString(),
        requiresLogin: true,
      });
    }

    // Obtenir la réponse de Gemini
    const response = await getGeminiResponse(message.trim());

    // Ajouter une suggestion de parler à un agent si la réponse semble insuffisante
    const enhancedResponse = response + "\n\n---\n💬 Si vous avez besoin d'une aide personnalisée, vous pouvez demander à parler à un agent en cliquant sur le bouton ci-dessous.";

    return NextResponse.json({
      response: enhancedResponse,
      timestamp: new Date().toISOString(),
      suggestAgent: true,
    });
  } catch (error) {
    logger.error("[Support Chat] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur", debug: String(error) },
      { status: 500 }
    );
  }
}

// Fonction pour notifier les admins (email uniquement, pas de notification dans le système classique)
async function notifyAdmins(conversationId: string, userId: string, subject: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    // Envoyer email à chaque admin si Resend est configuré
    if (process.env.RESEND_API_KEY) {
      for (const admin of admins) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const baseUrl = process.env.NEXTAUTH_URL || "https://lokroom.com";

          await resend.emails.send({
            from: "Lok'Room Support <support@lokroom.com>",
            to: admin.email,
            subject: `🆘 Nouvelle demande de support : ${subject}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Nouvelle demande de support</h2>
                <p>Bonjour ${admin.name || "Admin"},</p>
                <p><strong>${user?.name || user?.email || "Un utilisateur"}</strong> a besoin d'aide sur Lok'Room.</p>
                <p><strong>Sujet :</strong> ${subject}</p>
                <p style="margin-top: 20px;">
                  <a href="${baseUrl}/admin/support/${conversationId}"
                     style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Prendre en charge
                  </a>
                </p>
              </div>
            `,
          });
        } catch (emailError) {
          logger.error("[Support Chat] Email error:", emailError);
        }
      }
    }
  } catch (error) {
    logger.error("[Support Chat] Notify admins error:", error);
  }
}
