/**
 * Service d'email pour les notifications d'export de données
 */

import { sendEmail } from "@/lib/email";

interface ExportReadyEmailParams {
  to: string;
  userName: string;
  format: string;
  fileSize: number;
  downloadUrl: string;
  expiresAt: Date;
}

/**
 * Email de notification quand l'export est prêt
 */
export async function sendExportReadyEmail({
  to,
  userName,
  format,
  fileSize,
  downloadUrl,
  expiresAt,
}: ExportReadyEmailParams) {
  const formatLabels: Record<string, string> = {
    json: "JSON",
    csv: "CSV (ZIP)",
    pdf: "PDF",
    zip: "ZIP (avec photos)",
    "zip-no-photos": "ZIP (sans photos)",
  };

  const formatLabel = formatLabels[format] || format.toUpperCase();
  const fileSizeFormatted = formatFileSize(fileSize);
  const expiresAtFormatted = expiresAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre export de données est prêt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📦 Export de données prêt
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Bonjour ${userName || ""},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Votre export de données personnelles est prêt à être téléchargé.
              </p>

              <!-- Export Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #1f2937;">Format:</strong>
                    <span style="color: #6b7280; margin-left: 10px;">${formatLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #1f2937;">Taille:</strong>
                    <span style="color: #6b7280; margin-left: 10px;">${fileSizeFormatted}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #1f2937;">Expire le:</strong>
                    <span style="color: #6b7280; margin-left: 10px;">${expiresAtFormatted}</span>
                  </td>
                </tr>
              </table>

              <!-- Download Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Télécharger mes données
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> Ce lien expire dans 7 jours pour des raisons de sécurité. Téléchargez votre export dès maintenant.
                </p>
              </div>

              <!-- GDPR Info -->
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #1e40af; font-size: 14px; font-weight: 600;">
                  Conformité RGPD - Article 20
                </p>
                <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
                  Cet export contient toutes vos données personnelles: profil, annonces, réservations, avis, messages, favoris, notifications, paiements et consentements.
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si vous n'avez pas demandé cet export, veuillez ignorer cet email ou contacter notre support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Lok'Room - Plateforme de location d'espaces
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Votre export de données est prêt

Bonjour ${userName || ""},

Votre export de données personnelles est prêt à être téléchargé.

Détails de l'export:
- Format: ${formatLabel}
- Taille: ${fileSizeFormatted}
- Expire le: ${expiresAtFormatted}

Télécharger: ${downloadUrl}

IMPORTANT: Ce lien expire dans 7 jours pour des raisons de sécurité.

Conformité RGPD - Article 20
Cet export contient toutes vos données personnelles: profil, annonces, réservations, avis, messages, favoris, notifications, paiements et consentements.

Si vous n'avez pas demandé cet export, veuillez ignorer cet email ou contacter notre support.

---
Lok'Room - Plateforme de location d'espaces
  `;

  return sendEmail({
    to,
    subject: "📦 Votre export de données est prêt",
    html,
    text,
  });
}

/**
 * Formater la taille du fichier
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
