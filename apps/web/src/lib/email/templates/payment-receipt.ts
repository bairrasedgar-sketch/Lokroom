// apps/web/src/lib/email/templates/payment-receipt.ts
/**
 * Email de reçu de paiement
 */

import { baseTemplate, emailButton, infoBox, detailRow, successIcon, formatDate, formatAmount } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function paymentReceiptTemplate(data: {
  userName: string;
  listingTitle: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentId: string;
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const bookingUrl = `${APP_URL}/bookings/${data.bookingId}`;

  const content = `
    <div style="padding:40px 32px;">
      ${successIcon()}

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Paiement confirmé
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.userName}, votre paiement a été traité avec succès.
      </p>

      ${infoBox(`
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          Reçu de paiement
        </h2>

        ${detailRow("Annonce", data.listingTitle)}
        ${detailRow("Date", formatDate(data.paymentDate))}
        ${detailRow("ID de transaction", data.paymentId)}
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e5e5e5;">
          ${detailRow("Montant payé", formatAmount(data.amount, data.currency), true)}
        </div>
      `)}

      ${emailButton("Voir ma réservation", bookingUrl)}

      <div style="background:#f0f9ff;border-radius:12px;padding:20px;margin:32px 0;">
        <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
          <strong>Informations importantes :</strong><br>
          • Ce reçu fait office de justificatif de paiement<br>
          • Conservez-le pour vos dossiers<br>
          • Une facture détaillée est disponible dans votre compte
        </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Des questions sur ce paiement ? Contactez notre équipe support.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Paiement confirmé

${data.userName}, votre paiement a été traité avec succès.

Reçu de paiement :
Annonce : ${data.listingTitle}
Date : ${formatDate(data.paymentDate)}
ID de transaction : ${data.paymentId}
Montant payé : ${formatAmount(data.amount, data.currency)}

Voir ma réservation : ${bookingUrl}

Informations importantes :
• Ce reçu fait office de justificatif de paiement
• Conservez-le pour vos dossiers
• Une facture détaillée est disponible dans votre compte

Des questions sur ce paiement ? Contactez notre équipe support.
  `.trim();

  return {
    html,
    text,
    subject: `Reçu de paiement – ${data.listingTitle}`,
  };
}
