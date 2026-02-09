// apps/web/src/lib/email/templates/welcome-email.ts
/**
 * Email de bienvenue après inscription
 */

import { baseTemplate, emailButton } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function welcomeEmailTemplate(data: {
  userName: string;
}): { html: string; text: string; subject: string } {
  const content = `
    <div style="padding:40px 32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#10b981;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:32px;">🎉</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Bienvenue sur Lok'Room !
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        ${data.userName}, votre compte a été créé avec succès. Vous faites maintenant partie de notre communauté.
      </p>

      <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:32px 0;">
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          Prochaines étapes
        </h2>
        <div style="margin:0;">
          <div style="display:flex;align-items:start;margin-bottom:16px;">
            <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#10b981;color:#ffffff;text-align:center;line-height:32px;font-weight:600;margin-right:16px;flex-shrink:0;">1</span>
            <div>
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111111;">Complétez votre profil</p>
              <p style="margin:0;font-size:14px;color:#666666;">Ajoutez une photo et une description pour rassurer les hôtes</p>
            </div>
          </div>
          <div style="display:flex;align-items:start;margin-bottom:16px;">
            <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#10b981;color:#ffffff;text-align:center;line-height:32px;font-weight:600;margin-right:16px;flex-shrink:0;">2</span>
            <div>
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111111;">Explorez les espaces</p>
              <p style="margin:0;font-size:14px;color:#666666;">Découvrez des milliers d'espaces uniques près de chez vous</p>
            </div>
          </div>
          <div style="display:flex;align-items:start;">
            <span style="display:inline-block;width:32px;height:32px;border-radius:50%;background:#10b981;color:#ffffff;text-align:center;line-height:32px;font-weight:600;margin-right:16px;flex-shrink:0;">3</span>
            <div>
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111111;">Devenez hôte</p>
              <p style="margin:0;font-size:14px;color:#666666;">Partagez votre espace et gagnez un revenu complémentaire</p>
            </div>
          </div>
        </div>
      </div>

      ${emailButton("Découvrir Lok'Room", APP_URL)}

      <div style="background:#f0f9ff;border-radius:12px;padding:20px;margin:32px 0;">
        <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
          <strong>Besoin d'aide ?</strong><br>
          Notre équipe support est disponible 7j/7 pour répondre à toutes vos questions. N'hésitez pas à nous contacter !
        </p>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Merci de nous faire confiance pour vos réservations d'espaces.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Bienvenue sur Lok'Room !

${data.userName}, votre compte a été créé avec succès. Vous faites maintenant partie de notre communauté.

Prochaines étapes :

1. Complétez votre profil
   Ajoutez une photo et une description pour rassurer les hôtes

2. Explorez les espaces
   Découvrez des milliers d'espaces uniques près de chez vous

3. Devenez hôte
   Partagez votre espace et gagnez un revenu complémentaire

Découvrir Lok'Room : ${APP_URL}

Besoin d'aide ?
Notre équipe support est disponible 7j/7 pour répondre à toutes vos questions. N'hésitez pas à nous contacter !

Merci de nous faire confiance pour vos réservations d'espaces.
  `.trim();

  return {
    html,
    text,
    subject: `Bienvenue sur Lok'Room, ${data.userName} !`,
  };
}
