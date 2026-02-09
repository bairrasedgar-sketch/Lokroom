// apps/web/src/lib/email/templates/booking-cancelled.ts
/**
 * Email d'annulation de réservation
 */

import { baseTemplate, emailButton, infoBox, detailRow, warningIcon, formatDate, formatAmount } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function bookingCancelledTemplate(data: {
  recipientName: string;
  listingTitle: string;
  checkIn: Date;
  checkOut: Date;
  refundAmount?: number;
  currency?: string;
  cancelledBy: "guest" | "host";
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const isRefund = data.refundAmount !== undefined && data.currency;

  const content = `
    <div style="padding:40px 32px;">
      ${warningIcon()}

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Réservation annulée
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.recipientName}, la réservation pour <strong>${data.listingTitle}</strong> a été annulée${data.cancelledBy === "guest" ? " par le voyageur" : " par l'hôte"}.
      </p>

      ${infoBox(`
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          Détails de la réservation
        </h2>

        ${detailRow("Annonce", data.listingTitle)}
        ${detailRow("Arrivée prévue", formatDate(data.checkIn))}
        ${detailRow("Départ prévu", formatDate(data.checkOut))}
        ${isRefund ? `
          <div style="margin-top:16px;padding-top:16px;border-top:2px solid #e5e5e5;">
            ${detailRow("Remboursement", formatAmount(data.refundAmount!, data.currency!), true)}
          </div>
        ` : ""}
      `)}

      ${isRefund ? `
        <div style="background:#d1fae5;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0;font-size:14px;color:#065f46;line-height:1.6;">
            <strong>Remboursement en cours</strong><br>
            Le montant de ${formatAmount(data.refundAmount!, data.currency!)} sera remboursé sur votre moyen de paiement d'origine sous 5-10 jours ouvrés.
          </p>
        </div>
      ` : ""}

      ${emailButton("Trouver un autre espace", APP_URL)}

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Des questions sur cette annulation ? Contactez notre équipe support.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Réservation annulée

${data.recipientName}, la réservation pour ${data.listingTitle} a été annulée${data.cancelledBy === "guest" ? " par le voyageur" : " par l'hôte"}.

Détails de la réservation :
Annonce : ${data.listingTitle}
Arrivée prévue : ${formatDate(data.checkIn)}
Départ prévu : ${formatDate(data.checkOut)}
${isRefund ? `Remboursement : ${formatAmount(data.refundAmount!, data.currency!)}` : ""}

${isRefund ? `Le montant de ${formatAmount(data.refundAmount!, data.currency!)} sera remboursé sur votre moyen de paiement d'origine sous 5-10 jours ouvrés.\n\n` : ""}

Trouver un autre espace : ${APP_URL}

Des questions sur cette annulation ? Contactez notre équipe support.
  `.trim();

  return {
    html,
    text,
    subject: `Réservation annulée – ${data.listingTitle}`,
  };
}
