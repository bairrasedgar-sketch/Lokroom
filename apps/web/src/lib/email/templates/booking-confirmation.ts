// apps/web/src/lib/email/templates/booking-confirmation.ts
/**
 * Email de confirmation de réservation (pour le voyageur)
 */

import { baseTemplate, emailButton, infoBox, detailRow, successIcon, formatDate, formatAmount } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function bookingConfirmationTemplate(data: {
  guestName: string;
  listingTitle: string;
  hostName: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  currency: string;
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const bookingUrl = `${APP_URL}/bookings/${data.bookingId}`;

  const content = `
    <div style="padding:40px 32px;">
      ${successIcon()}

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Réservation confirmée !
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        Merci ${data.guestName}, votre réservation a été confirmée.
      </p>

      ${infoBox(`
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          ${data.listingTitle}
        </h2>

        ${detailRow("Hôte", data.hostName)}
        ${detailRow("Arrivée", formatDate(data.checkIn))}
        ${detailRow("Départ", formatDate(data.checkOut))}
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e5e5e5;">
          ${detailRow("Total payé", formatAmount(data.totalPrice, data.currency), true)}
        </div>
      `)}

      ${emailButton("Voir ma réservation", bookingUrl)}

      <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:32px 0;">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
          <strong>Prochaines étapes :</strong><br>
          • Vous recevrez les détails de l'adresse exacte 48h avant votre arrivée<br>
          • N'hésitez pas à contacter ${data.hostName} pour toute question<br>
          • Consultez les règles de la maison avant votre séjour
        </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Des questions ? Contactez-nous à tout moment via le centre d'aide.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Réservation confirmée !

Merci ${data.guestName}, votre réservation a été confirmée.

${data.listingTitle}
Hôte : ${data.hostName}
Arrivée : ${formatDate(data.checkIn)}
Départ : ${formatDate(data.checkOut)}
Total payé : ${formatAmount(data.totalPrice, data.currency)}

Voir ma réservation : ${bookingUrl}

Prochaines étapes :
• Vous recevrez les détails de l'adresse exacte 48h avant votre arrivée
• N'hésitez pas à contacter ${data.hostName} pour toute question
• Consultez les règles de la maison avant votre séjour

Des questions ? Contactez-nous à tout moment via le centre d'aide.
  `.trim();

  return {
    html,
    text,
    subject: `Réservation confirmée – ${data.listingTitle}`,
  };
}
