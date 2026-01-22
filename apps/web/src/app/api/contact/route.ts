/**
 * API pour le formulaire de contact de la page maintenance
 * POST /api/contact
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validation
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email et message requis" },
        { status: 400 }
      );
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // Chercher si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let conversationId: string | null = null;

    // Si l'utilisateur existe, créer une conversation de support
    if (existingUser) {
      const conversation = await prisma.supportConversation.create({
        data: {
          userId: existingUser.id,
          status: "WAITING_AGENT",
          subject: `Contact maintenance - ${name || email}`,
          messages: {
            create: {
              content: `**Nom:** ${name || "Non renseigné"}\n**Email:** ${email}\n\n${message}`,
              type: "USER",
              senderId: existingUser.id,
            },
          },
        },
      });
      conversationId = conversation.id;
    }

    // Envoyer un email de notification aux admins
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPPORT"] },
      },
      select: { email: true, name: true },
    });

    const adminLink = conversationId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${conversationId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/admin/support`;

    // Envoyer l'email à chaque admin
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `[Lok'Room] Nouveau message de contact - ${name || email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Nouveau message de contact</h2>
            <p style="color: #6b7280;">Un visiteur a envoyé un message depuis la page de maintenance.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nom:</strong> ${name || "Non renseigné"}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Utilisateur enregistré:</strong> ${existingUser ? "Oui" : "Non"}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <a href="${adminLink}"
               style="display: inline-block; background: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Voir dans l'admin
            </a>

            ${!existingUser ? `<p style="color: #6b7280; margin-top: 20px; font-size: 14px;">
              Note: Cet utilisateur n'a pas de compte. Répondez directement à son email: <a href="mailto:${email}">${email}</a>
            </p>` : ""}
          </div>
        `,
      });
    }

    // Envoyer un email de confirmation à l'utilisateur
    await sendEmail({
      to: email,
      subject: `[Lok'Room] Nous avons bien reçu votre message`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Merci de nous avoir contacté !</h2>
          <p style="color: #6b7280;">Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Votre message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p style="color: #6b7280;">L'équipe Lok'Room</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API contact:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
