// apps/web/src/lib/email/templates/password-reset.ts
/**
 * Email de réinitialisation de mot de passe
 */

import { baseTemplate, emailButton } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function passwordResetTemplate(data: {
  userName: string;
  resetToken: string;
}): { html: string; text: string; subject: string } {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${data.resetToken}`;

  const content = `
    <div style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#ef4444;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:32px;">🔒</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Réinitialisation de mot de passe
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.userName}, vous avez demandé à réinitialiser votre mot de passe.
      </p>

      <div style="background:#fef2f2;border-radius:12px;padding:24px;margin:32px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#991b1b;line-height:1.6;">
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable pendant <strong>1 heure</strong>.
        </p>
        <p style="margin:0;font-size:14px;color:#b91c1c;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte reste sécurisé.
        </p>
      </div>

      ${emailButton("Réinitialiser mon mot de passe", resetUrl)}

      <div style="border-top:1px solid #eeeeee;padding-top:24px;margin-top:32px;">
        <p style="margin:0 0 8px;font-size:13px;color:#888888;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
        </p>
        <p style="margin:0;font-size:12px;color:#aaaaaa;word-break:break-all;background:#f9f9f9;padding:12px;border-radius:8px;">
          ${resetUrl}
        </p>
      </div>

      <div style="background:#fef3c7;border-radius:12px;padding:20px;margin:32px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          <strong>Conseils de sécurité :</strong><br>
          • Choisissez un mot de passe fort (12+ caractères)<br>
          • Utilisez une combinaison de lettres, chiffres et symboles<br>
          • Ne partagez jamais votre mot de passe
        </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Des questions ? Contactez notre équipe support.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Réinitialisation de mot de passe

${data.userName}, vous avez demandé à réinitialiser votre mot de passe.

Cliquez sur ce lien pour créer un nouveau mot de passe (valable 1 heure) :
${resetUrl}

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte reste sécurisé.

Conseils de sécurité :
• Choisissez un mot de passe fort (12+ caractères)
• Utilisez une combinaison de lettres, chiffres et symboles
• Ne partagez jamais votre mot de passe

Des questions ? Contactez notre équipe support.
  `.trim();

  return {
    html,
    text,
    subject: "Réinitialisation de votre mot de passe Lok'Room",
  };
}
