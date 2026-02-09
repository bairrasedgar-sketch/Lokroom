// apps/web/src/lib/email/templates/base.ts
/**
 * Template de base pour tous les emails Lok'Room
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Layout HTML de base pour tous les emails
 */
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lok'Room</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="background:#f5f5f5;padding:32px 16px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      ${emailHeader()}
      ${content}
      ${emailFooter()}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Header avec logo Lok'Room
 */
function emailHeader(): string {
  return `
    <div style="background:#111111;padding:32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:#111111;font-weight:700;font-size:20px;">L</span>
        </div>
        <span style="color:#ffffff;font-size:24px;font-weight:600;letter-spacing:-0.5px;">Lok'Room</span>
      </div>
    </div>
  `;
}

/**
 * Footer avec liens légaux
 */
function emailFooter(): string {
  return `
    <div style="background:#f9f9f9;padding:32px;text-align:center;border-top:1px solid #eeeeee;">
      <p style="margin:0 0 16px;font-size:14px;color:#666666;">
        © ${new Date().getFullYear()} Lok'Room. Tous droits réservés.
      </p>
      <p style="margin:0;">
        <a href="${APP_URL}/legal/privacy" style="font-size:13px;color:#888888;text-decoration:none;margin:0 12px;">Confidentialité</a>
        <a href="${APP_URL}/legal/terms" style="font-size:13px;color:#888888;text-decoration:none;margin:0 12px;">Conditions</a>
        <a href="${APP_URL}/help" style="font-size:13px;color:#888888;text-decoration:none;margin:0 12px;">Aide</a>
      </p>
    </div>
  `;
}

/**
 * Bouton CTA stylé
 */
export function emailButton(text: string, url: string, style: "primary" | "secondary" = "primary"): string {
  const bgColor = style === "primary" ? "#111111" : "#ffffff";
  const textColor = style === "primary" ? "#ffffff" : "#111111";
  const border = style === "secondary" ? "border:2px solid #111111;" : "";

  return `
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}"
         style="display:inline-block;background:${bgColor};color:${textColor};text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;${border}">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Section d'information avec fond gris
 */
export function infoBox(content: string): string {
  return `
    <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:24px 0;">
      ${content}
    </div>
  `;
}

/**
 * Ligne de détail (label + valeur)
 */
export function detailRow(label: string, value: string, bold = false): string {
  const fontWeight = bold ? "600" : "400";
  const color = bold ? "#111111" : "#444444";

  return `
    <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eeeeee;">
      <span style="color:#888888;font-size:15px;">${label}</span>
      <span style="color:${color};font-size:15px;font-weight:${fontWeight};">${value}</span>
    </div>
  `;
}

/**
 * Icône de succès (checkmark vert)
 */
export function successIcon(): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#10b981;align-items:center;justify-content:center;">
        <span style="color:#ffffff;font-size:32px;font-weight:700;">✓</span>
      </div>
    </div>
  `;
}

/**
 * Icône d'alerte (warning orange)
 */
export function warningIcon(): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-flex;width:64px;height:64px;border-radius:50%;background:#f59e0b;align-items:center;justify-content:center;">
        <span style="color:#ffffff;font-size:32px;font-weight:700;">!</span>
      </div>
    </div>
  `;
}

/**
 * Formatte une date en français
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Formatte un montant avec devise
 */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}
