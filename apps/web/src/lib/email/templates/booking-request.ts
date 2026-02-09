// apps/web/src/lib/email/templates/booking-request.ts
/**
 * Email de nouvelle demande de réservation (pour l'hôte)
 */

import { baseTemplate, emailButton, infoBox, detailRow, formatDate, formatAmount } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function bookingRequestTemplate(data: {
  hostName: string;
  guestName: string;
  listingTitle: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  currency: string;
  message?: string;
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const bookingUrl = `${APP_URL}/host/bookings/${data.bookingId}`;

  const content = `
    <div style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#3b82f6;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:32px;">📅</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Nouvelle réservation !
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.hostName}, vous avez une nouvelle réservation pour <strong>${data.listingTitle}</strong>.
      </p>

      ${infoBox(`
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          Détails de la réservation
        </h2>

        ${detailRow("Voyageur", data.guestName)}
        ${detailRow("Arrivée", formatDate(data.checkIn))}
        ${detailRow("Départ", formatDate(data.checkOut))}
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e5e5e5;">
          ${detailRow("Vous recevrez", formatAmount(data.totalPrice, data.currency), true)}
        </div>
      `)}

      ${data.message ? `
        <div style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:#1e40af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
            Message du voyageur
          </p>
          <p style="margin:0;font-size:15px;color:#1e3a8a;line-height:1.6;font-style:italic;">
            "${data.message}"
          </p>
        </div>
      ` : ""}

      ${emailButton("Voir les détails", bookingUrl)}

      <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:32px 0;">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
          <strong>À faire maintenant :</strong><br>
          • Vérifiez les dates et confirmez votre disponibilité<br>
          • Contactez ${data.guestName} pour lui souhaiter la bienvenue<br>
          • Préparez votre espace pour l'arrivée
        </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Le paiement sera transféré sur votre compte 24h après l'arrivée du voyageur.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Nouvelle réservation !

${data.hostName}, vous avez une nouvelle réservation pour ${data.listingTitle}.

Détails de la réservation :
Voyageur : ${data.guestName}
Arrivée : ${formatDate(data.checkIn)}
Départ : ${formatDate(data.checkOut)}
Vous recevrez : ${formatAmount(data.totalPrice, data.currency)}

${data.message ? `Message du voyageur :\n"${data.message}"\n\n` : ""}

Voir les détails : ${bookingUrl}

À faire maintenant :
• Vérifiez les dates et confirmez votre disponibilité
• Contactez ${data.guestName} pour lui souhaiter la bienvenue
• Préparez votre espace pour l'arrivée

Le paiement sera transféré sur votre compte 24h après l'arrivée du voyageur.
  `.trim();

  return {
    html,
    text,
    subject: `Nouvelle réservation de ${data.guestName} !`,
  };
}
