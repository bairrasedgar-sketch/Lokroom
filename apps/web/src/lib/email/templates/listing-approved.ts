// apps/web/src/lib/email/templates/listing-approved.ts
/**
 * Email d'approbation d'annonce
 */

import { baseTemplate, emailButton, successIcon } from "./base";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function listingApprovedTemplate(data: {
  hostName: string;
  listingTitle: string;
  listingId: string;
}): { html: string; text: string; subject: string } {
  const listingUrl = `${APP_URL}/listings/${data.listingId}`;

  const content = `
    <div style="padding:40px 32px;">
      ${successIcon()}

      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111111;text-align:center;">
        Votre annonce est en ligne !
      </h1>

      <p style="margin:0 0 32px;font-size:16px;color:#666666;text-align:center;">
        Félicitations ${data.hostName}, votre annonce <strong>${data.listingTitle}</strong> a été approuvée.
      </p>

      <div style="background:#d1fae5;border-radius:12px;padding:24px;margin:32px 0;">
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#065f46;">
          Votre annonce est maintenant visible
        </h2>
        <p style="margin:0;font-size:15px;color:#047857;line-height:1.6;">
          Les voyageurs peuvent désormais découvrir et réserver votre espace. Assurez-vous que votre calendrier est à jour et que vous êtes prêt à accueillir vos premiers invités !
        </p>
      </div>

      ${emailButton("Voir mon annonce", listingUrl)}

      <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:32px 0;">
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#111111;">
          Conseils pour réussir
        </h2>
        <div style="margin:0;">
          <div style="margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111111;">📸 Photos de qualité</p>
            <p style="margin:0;font-size:14px;color:#666666;">Les annonces avec de belles photos reçoivent 3x plus de réservations</p>
          </div>
          <div style="margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111111;">⚡ Réponse rapide</p>
            <p style="margin:0;font-size:14px;color:#666666;">Répondez aux messages dans les 24h pour augmenter vos chances</p>
          </div>
          <div>
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#111111;">⭐ Avis positifs</p>
            <p style="margin:0;font-size:14px;color:#666666;">Offrez une expérience exceptionnelle pour obtenir 5 étoiles</p>
          </div>
        </div>
      </div>

      <p style="margin:32px 0 0;font-size:13px;color:#888888;text-align:center;">
        Besoin d'aide ? Consultez notre guide pour les hôtes ou contactez le support.
      </p>
    </div>
  `;

  const html = baseTemplate(content);

  const text = `
Votre annonce est en ligne !

Félicitations ${data.hostName}, votre annonce ${data.listingTitle} a été approuvée.

Votre annonce est maintenant visible
Les voyageurs peuvent désormais découvrir et réserver votre espace. Assurez-vous que votre calendrier est à jour et que vous êtes prêt à accueillir vos premiers invités !

Voir mon annonce : ${listingUrl}

Conseils pour réussir :

📸 Photos de qualité
Les annonces avec de belles photos reçoivent 3x plus de réservations

⚡ Réponse rapide
Répondez aux messages dans les 24h pour augmenter vos chances

⭐ Avis positifs
Offrez une expérience exceptionnelle pour obtenir 5 étoiles

Besoin d'aide ? Consultez notre guide pour les hôtes ou contactez le support.
  `.trim();

  return {
    html,
    text,
    subject: `Votre annonce "${data.listingTitle}" est en ligne !`,
  };
}
