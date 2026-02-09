// apps/web/src/lib/email/templates/message-notification.ts
/**
 * Email de notification de nouveau message
 */

import { baseTemplate, emailButton } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function messageNotificationTemplate(data: {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationId: string;
}): { html: string; text: string; subject: string } {
  const conversationUrl = `${APP_URL}/messages/${data.conversationId}`;

  const content = `
    <div style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#8b5cf6;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:32px;">💬</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Nouveau message
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.recipientName}, vous avez reçu un message de <strong>${data.senderName}</strong>.
      </p>

      <div style="background:#f9f9f9;border-left:4px solid #8b5cf6;border-radius:8px;padding:24px;margin:32px 0;">
        <p style="margin:0;font-size:16px;color:#333333;line-height:1.6;font-style:italic;">
          "${data.messagePreview}"
        </p>
      </div>

      ${emailButton("Répondre au message", conversationUrl)}

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Répondez rapidement pour maintenir une bonne communication avec vos voyageurs/hôtes.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Nouveau message

${data.recipientName}, vous avez reçu un message de ${data.senderName}.

"${data.messagePreview}"

Répondre au message : ${conversationUrl}

Répondez rapidement pour maintenir une bonne communication avec vos voyageurs/hôtes.
  `.trim();

  return {
    html,
    text,
    subject: `Message de ${data.senderName}`,
  };
}
