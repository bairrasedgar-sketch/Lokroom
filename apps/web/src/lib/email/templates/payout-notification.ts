// apps/web/src/lib/email/templates/payout-notification.ts
/**
 * Email de notification de paiement reçu (pour l'hôte)
 */

import { baseTemplate, emailButton, infoBox, detailRow, successIcon, formatDate, formatAmount } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function payoutNotificationTemplate(data: {
  hostName: string;
  amount: number;
  currency: string;
  payoutDate: Date;
  bookingId: string;
  listingTitle: string;
}): { html: string; text: string; subject: string } {
  const bookingUrl = `${APP_URL}/host/bookings/${data.bookingId}`;

  const content = `
    <div style="padding:40px 32px;">
      ${successIcon()}

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Paiement reçu !
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.hostName}, vous avez reçu un paiement pour votre annonce.
      </p>

      ${infoBox(`
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          Détails du paiement
        </h2>

        ${detailRow("Annonce", data.listingTitle)}
        ${detailRow("Date", formatDate(data.payoutDate))}
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e5e5e5;">
          ${detailRow("Montant reçu", formatAmount(data.amount, data.currency), true)}
        </div>
      `)}

      <div style="background:#d1fae5;border-radius:12px;padding:24px;margin:32px 0;">
        <p style="margin:0;font-size:15px;color:#065f46;line-height:1.6;">
          <strong>Transfert en cours</strong><br>
          Le montant sera transféré sur votre compte bancaire sous 2-3 jours ouvrés. Vous recevrez une notification une fois le transfert effectué.
        </p>
      </div>

      ${emailButton("Voir les détails", bookingUrl)}

      <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin:32px 0;">
        <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
          <strong>Rappel :</strong><br>
          • Les frais de service Lok'Room ont été déduits<br>
          • Un reçu détaillé est disponible dans votre compte<br>
          • Consultez votre historique de paiements pour plus d'informations
        </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Des questions sur ce paiement ? Contactez notre équipe support.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Paiement reçu !

${data.hostName}, vous avez reçu un paiement pour votre annonce.

Détails du paiement :
Annonce : ${data.listingTitle}
Date : ${formatDate(data.payoutDate)}
Montant reçu : ${formatAmount(data.amount, data.currency)}

Transfert en cours
Le montant sera transféré sur votre compte bancaire sous 2-3 jours ouvrés. Vous recevrez une notification une fois le transfert effectué.

Voir les détails : ${bookingUrl}

Rappel :
• Les frais de service Lok'Room ont été déduits
• Un reçu détaillé est disponible dans votre compte
• Consultez votre historique de paiements pour plus d'informations

Des questions sur ce paiement ? Contactez notre équipe support.
  `.trim();

  return {
    html,
    text,
    subject: `Paiement reçu – ${formatAmount(data.amount, data.currency)}`,
  };
}
