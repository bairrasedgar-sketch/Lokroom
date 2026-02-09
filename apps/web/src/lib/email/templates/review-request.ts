// apps/web/src/lib/email/templates/review-request.ts
/**
 * Email de demande d'avis après un séjour
 */

import { baseTemplate, emailButton } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function reviewRequestTemplate(data: {
  guestName: string;
  listingTitle: string;
  hostName: string;
  bookingId: string;
}): { html: string; text: string; subject: string } {
  const reviewUrl = `${APP_URL}/bookings/${data.bookingId}/review`;

  const content = `
    <div style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#f59e0b;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:32px;">⭐</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Comment s'est passé votre séjour ?
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.guestName}, partagez votre expérience chez <strong>${data.hostName}</strong>.
      </p>

      <div style="background:#fef3c7;border-radius:12px;padding:24px;margin:32px 0;">
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#92400e;">
          ${data.listingTitle}
        </h2>
        <p style="margin:0;font-size:15px;color:#78350f;line-height:1.6;">
          Votre avis aide les autres voyageurs à faire leur choix et permet à ${data.hostName} d'améliorer son service.
        </p>
      </div>

      ${emailButton("Laisser un avis", reviewUrl)}

      <div style="text-align:center;margin:32px 0;">
        <p style="margin:0 0 12px;font-size:14px;color:#666666;">
          Notez votre expérience en quelques clics :
        </p>
        <div style="display:inline-flex;gap:8px;">
          <span style="font-size:32px;">⭐</span>
          <span style="font-size:32px;">⭐</span>
          <span style="font-size:32px;">⭐</span>
          <span style="font-size:32px;">⭐</span>
          <span style="font-size:32px;">⭐</span>
        </div>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Vous avez 14 jours pour laisser un avis après votre séjour.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Comment s'est passé votre séjour ?

${data.guestName}, partagez votre expérience chez ${data.hostName}.

${data.listingTitle}

Votre avis aide les autres voyageurs à faire leur choix et permet à ${data.hostName} d'améliorer son service.

Laisser un avis : ${reviewUrl}

Vous avez 14 jours pour laisser un avis après votre séjour.
  `.trim();

  return {
    html,
    text,
    subject: `Laissez un avis sur votre séjour chez ${data.hostName}`,
  };
}
