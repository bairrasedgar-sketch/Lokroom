// apps/web/src/lib/email.ts
/**
 * Service d'email centralisé Lok'Room
 * Utilise Resend pour tous les envois d'emails
 *
 * Configuration requise :
 * 1. Créer un compte sur https://resend.com (gratuit, 3000 emails/mois)
 * 2. Ajouter ton domaine et configurer les DNS (DKIM/SPF)
 * 3. Créer une API key et l'ajouter dans .env : RESEND_API_KEY=re_xxxxx
 */

import { Resend } from "resend";

// Client Resend (lazy initialization pour éviter les erreurs au build)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Expéditeur par défaut
const DEFAULT_FROM =
  process.env.EMAIL_FROM || "Lok'Room <no-reply@lokroom.com>";

// URL de base de l'application
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ============================================================================
// TYPES
// ============================================================================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// TEMPLATES HTML - Style Airbnb/Lok'Room
// ============================================================================

/**
 * Layout de base pour tous les emails
 */
function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lok'Room</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="background:#f5f5f5;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      ${content}
    </div>
    <p style="margin:24px auto 0;max-width:520px;text-align:center;font-size:12px;color:#999999;">
      © ${new Date().getFullYear()} Lok'Room · Tous droits réservés
    </p>
    <p style="margin:8px auto 0;max-width:520px;text-align:center;">
      <a href="${APP_URL}/legal/privacy" style="font-size:11px;color:#999999;text-decoration:none;margin:0 8px;">Confidentialité</a>
      <a href="${APP_URL}/legal/terms" style="font-size:11px;color:#999999;text-decoration:none;margin:0 8px;">Conditions</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Header avec logo Lok'Room
 */
function emailHeader(): string {
  return `
    <div style="background:#111111;padding:24px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <div style="width:36px;height:36px;border-radius:999px;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#111111;font-weight:700;font-size:18px;">L</span>
        </div>
        <span style="color:#ffffff;font-size:20px;font-weight:600;">Lok'Room</span>
      </div>
    </div>
  `;
}

/**
 * Bouton CTA stylé
 */
function emailButton(text: string, url: string): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}"
         style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:600;">
        ${text}
      </a>
    </div>
  `;
}

// ============================================================================
// TEMPLATES D'EMAILS
// ============================================================================

/**
 * Email de connexion (magic link)
 */
export function magicLinkEmail(url: string): { html: string; text: string } {
  const html = emailLayout(`
    ${emailHeader()}
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111111;">
        Connecte-toi à Lok'Room
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#444444;">
        Clique sur le bouton ci-dessous pour te connecter et accéder à ton compte Lok'Room.
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:#888888;">
        Ce lien est valable pendant 10 minutes.
      </p>
      ${emailButton("Se connecter", url)}
      <div style="border-top:1px solid #eeeeee;padding-top:20px;margin-top:20px;">
        <p style="margin:0 0 8px;font-size:12px;color:#888888;">
          Si le bouton ne fonctionne pas, copie-colle ce lien :
        </p>
        <p style="margin:0;font-size:11px;color:#aaaaaa;word-break:break-all;">
          ${url}
        </p>
      </div>
      <p style="margin-top:24px;font-size:11px;color:#999999;">
        Si tu n'as pas demandé cette connexion, tu peux ignorer cet e-mail.
        Ton compte reste sécurisé.
      </p>
    </div>
  `);

  const text = `Connecte-toi à Lok'Room\n\nClique sur ce lien pour te connecter : ${url}\n\nCe lien est valable pendant 10 minutes.\n\nSi tu n'as pas demandé cette connexion, ignore cet e-mail.`;

  return { html, text };
}

/**
 * Email de bienvenue après inscription
 */
export function welcomeEmail(firstName: string): { html: string; text: string; subject: string } {
  const html = emailLayout(`
    ${emailHeader()}
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111111;">
        Bienvenue sur Lok'Room, ${firstName} !
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444444;">
        Ton compte a été créé avec succès. Tu fais maintenant partie de notre communauté
        de voyageurs et d'hôtes.
      </p>

      <div style="background:#f9f9f9;border-radius:16px;padding:20px;margin:24px 0;">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111111;">
          Prochaines étapes
        </h2>
        <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#555555;">
          <li>Explore les espaces disponibles près de chez toi</li>
          <li>Complète ton profil pour rassurer les hôtes</li>
          <li>Deviens hôte et partage ton espace</li>
        </ul>
      </div>

      ${emailButton("Découvrir Lok'Room", APP_URL)}

      <p style="margin-top:24px;font-size:13px;color:#666666;">
        Des questions ? Réponds directement à cet e-mail, notre équipe est là pour t'aider.
      </p>
    </div>
  `);

  const text = `Bienvenue sur Lok'Room, ${firstName} !\n\nTon compte a été créé avec succès. Tu fais maintenant partie de notre communauté.\n\nProchaines étapes :\n- Explore les espaces disponibles\n- Complète ton profil\n- Deviens hôte\n\nDécouvre Lok'Room : ${APP_URL}`;

  return {
    html,
    text,
    subject: `Bienvenue sur Lok'Room, ${firstName} !`,
  };
}

/**
 * Email de confirmation de réservation (pour le guest)
 */
export function bookingConfirmationEmail(data: {
  guestName: string;
  listingTitle: string;
  hostName: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  currency: string;
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const bookingUrl = `${APP_URL}/bookings/${data.bookingId}`;

  const html = emailLayout(`
    ${emailHeader()}
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:56px;height:56px;border-radius:999px;background:#10b981;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:28px;">✓</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111111;text-align:center;">
        Réservation confirmée !
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#666666;text-align:center;">
        Merci ${data.guestName}, ta réservation a été confirmée.
      </p>

      <div style="background:#f9f9f9;border-radius:16px;padding:20px;margin:24px 0;">
        <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111111;">
          ${data.listingTitle}
        </h2>
        <table style="width:100%;font-size:14px;color:#444444;">
          <tr>
            <td style="padding:8px 0;color:#888888;">Hôte</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${data.hostName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Arrivée</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${data.startDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Départ</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${data.endDate}</td>
          </tr>
          <tr style="border-top:1px solid #eeeeee;">
            <td style="padding:12px 0 0;font-weight:600;color:#111111;">Total payé</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:600;color:#111111;">${data.totalPrice} ${data.currency}</td>
          </tr>
        </table>
      </div>

      ${emailButton("Voir ma réservation", bookingUrl)}

      <p style="margin-top:24px;font-size:13px;color:#666666;text-align:center;">
        Tu recevras les détails de l'adresse exacte après confirmation.
      </p>
    </div>
  `);

  const text = `Réservation confirmée !\n\n${data.listingTitle}\nHôte : ${data.hostName}\nArrivée : ${data.startDate}\nDépart : ${data.endDate}\nTotal : ${data.totalPrice} ${data.currency}\n\nVoir la réservation : ${bookingUrl}`;

  return {
    html,
    text,
    subject: `Réservation confirmée – ${data.listingTitle}`,
  };
}

/**
 * Email de nouvelle réservation (pour l'hôte)
 */
export function newBookingHostEmail(data: {
  hostName: string;
  guestName: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  currency: string;
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const bookingUrl = `${APP_URL}/host/bookings`;

  const html = emailLayout(`
    ${emailHeader()}
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111111;">
        Nouvelle réservation !
      </h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444444;">
        ${data.hostName}, tu as une nouvelle réservation pour <strong>${data.listingTitle}</strong>.
      </p>

      <div style="background:#f9f9f9;border-radius:16px;padding:20px;margin:24px 0;">
        <table style="width:100%;font-size:14px;color:#444444;">
          <tr>
            <td style="padding:8px 0;color:#888888;">Voyageur</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${data.guestName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Arrivée</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${data.startDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888888;">Départ</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;">${data.endDate}</td>
          </tr>
          <tr style="border-top:1px solid #eeeeee;">
            <td style="padding:12px 0 0;font-weight:600;color:#111111;">Tu recevras</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:600;color:#10b981;">${data.totalPrice} ${data.currency}</td>
          </tr>
        </table>
      </div>

      ${emailButton("Voir les détails", bookingUrl)}

      <p style="margin-top:24px;font-size:13px;color:#666666;">
        N'oublie pas de contacter ton voyageur pour lui donner les informations pratiques.
      </p>
    </div>
  `);

  const text = `Nouvelle réservation !\n\n${data.listingTitle}\nVoyageur : ${data.guestName}\nArrivée : ${data.startDate}\nDépart : ${data.endDate}\nTu recevras : ${data.totalPrice} ${data.currency}\n\nVoir les détails : ${bookingUrl}`;

  return {
    html,
    text,
    subject: `Nouvelle réservation de ${data.guestName} !`,
  };
}

/**
 * Email d'annulation de réservation
 */
export function bookingCancelledEmail(data: {
  recipientName: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  refundAmount?: string;
  currency?: string;
  cancelledBy: "guest" | "host";
}): { html: string; text: string; subject: string } {
  const isRefund = data.refundAmount && data.currency;

  const html = emailLayout(`
    ${emailHeader()}
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111111;">
        Réservation annulée
      </h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444444;">
        ${data.recipientName}, la réservation pour <strong>${data.listingTitle}</strong>
        a été annulée${data.cancelledBy === "guest" ? " par le voyageur" : " par l'hôte"}.
      </p>

      <div style="background:#fef2f2;border-radius:16px;padding:20px;margin:24px 0;">
        <table style="width:100%;font-size:14px;color:#444444;">
          <tr>
            <td style="padding:8px 0;color:#888888;">Dates</td>
            <td style="padding:8px 0;text-align:right;">${data.startDate} - ${data.endDate}</td>
          </tr>
          ${
            isRefund
              ? `
          <tr style="border-top:1px solid #fecaca;">
            <td style="padding:12px 0 0;font-weight:600;color:#111111;">Remboursement</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:600;color:#10b981;">${data.refundAmount} ${data.currency}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      ${emailButton("Trouver un autre espace", APP_URL)}
    </div>
  `);

  const text = `Réservation annulée\n\n${data.listingTitle}\nDates : ${data.startDate} - ${data.endDate}${isRefund ? `\nRemboursement : ${data.refundAmount} ${data.currency}` : ""}`;

  return {
    html,
    text,
    subject: `Réservation annulée – ${data.listingTitle}`,
  };
}

/**
 * Email de nouveau message
 */
export function newMessageEmail(data: {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}): { html: string; text: string; subject: string } {
  const html = emailLayout(`
    ${emailHeader()}
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111111;">
        Nouveau message de ${data.senderName}
      </h1>

      <div style="background:#f9f9f9;border-radius:16px;padding:20px;margin:24px 0;">
        <p style="margin:0;font-size:15px;line-height:1.6;color:#444444;font-style:italic;">
          "${data.messagePreview}"
        </p>
      </div>

      ${emailButton("Répondre", data.conversationUrl)}
    </div>
  `);

  const text = `Nouveau message de ${data.senderName}\n\n"${data.messagePreview}"\n\nRépondre : ${data.conversationUrl}`;

  return {
    html,
    text,
    subject: `Message de ${data.senderName}`,
  };
}

// ============================================================================
// FONCTION D'ENVOI PRINCIPALE
// ============================================================================

/**
 * Envoie un email via Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo } = options;

  // Vérifier que la clé API est configurée
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY non configurée");
    return {
      success: false,
      error: "RESEND_API_KEY non configurée. Ajoute ta clé API Resend dans .env",
    };
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("[Email] Resend exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES PRÊTES À L'EMPLOI
// ============================================================================

/**
 * Envoie un email de bienvenue après l'onboarding
 */
export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<EmailResult> {
  const { html, text, subject } = welcomeEmail(firstName);
  return sendEmail({ to, subject, html, text, replyTo: "support@lokroom.com" });
}

/**
 * Envoie un email de confirmation de réservation au guest
 */
export async function sendBookingConfirmation(
  to: string,
  data: Parameters<typeof bookingConfirmationEmail>[0]
): Promise<EmailResult> {
  const { html, text, subject } = bookingConfirmationEmail(data);
  return sendEmail({ to, subject, html, text });
}

/**
 * Envoie un email de nouvelle réservation à l'hôte
 */
export async function sendNewBookingToHost(
  to: string,
  data: Parameters<typeof newBookingHostEmail>[0]
): Promise<EmailResult> {
  const { html, text, subject } = newBookingHostEmail(data);
  return sendEmail({ to, subject, html, text });
}

/**
 * Envoie un email d'annulation
 */
export async function sendBookingCancellation(
  to: string,
  data: Parameters<typeof bookingCancelledEmail>[0]
): Promise<EmailResult> {
  const { html, text, subject } = bookingCancelledEmail(data);
  return sendEmail({ to, subject, html, text });
}

/**
 * Envoie une notification de nouveau message
 */
export async function sendNewMessageNotification(
  to: string,
  data: Parameters<typeof newMessageEmail>[0]
): Promise<EmailResult> {
  const { html, text, subject } = newMessageEmail(data);
  return sendEmail({ to, subject, html, text });
}
