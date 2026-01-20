/**
 * Système de logging de sécurité centralisé
 *
 * Ce module centralise tous les événements de sécurité pour faciliter
 * la détection d'attaques et l'analyse des incidents.
 */

type SecurityEventType =
  | 'auth_login_failed'
  | 'auth_login_success'
  | 'auth_logout'
  | 'auth_2fa_failed'
  | 'rate_limit_exceeded'
  | 'payment_validation_failed'
  | 'payment_amount_mismatch'
  | 'webhook_invalid_signature'
  | 'webhook_rate_limit'
  | 'xss_attempt_blocked'
  | 'csrf_attempt_blocked'
  | 'unauthorized_access'
  | 'admin_access_denied'
  | 'suspicious_activity';

type SecurityEventSeverity = 'info' | 'warn' | 'error' | 'critical';

interface SecurityEvent {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  timestamp: string;
  ip?: string;
  userId?: string;
  email?: string;
  path?: string;
  details?: Record<string, unknown>;
}

// Mapping des types d'événements vers leur sévérité par défaut
const severityMap: Record<SecurityEventType, SecurityEventSeverity> = {
  auth_login_failed: 'warn',
  auth_login_success: 'info',
  auth_logout: 'info',
  auth_2fa_failed: 'warn',
  rate_limit_exceeded: 'warn',
  payment_validation_failed: 'error',
  payment_amount_mismatch: 'critical',
  webhook_invalid_signature: 'error',
  webhook_rate_limit: 'warn',
  xss_attempt_blocked: 'warn',
  csrf_attempt_blocked: 'warn',
  unauthorized_access: 'warn',
  admin_access_denied: 'error',
  suspicious_activity: 'critical',
};

/**
 * Log un événement de sécurité
 */
export function logSecurityEvent(
  type: SecurityEventType,
  options?: {
    ip?: string;
    userId?: string;
    email?: string;
    path?: string;
    details?: Record<string, unknown>;
    severity?: SecurityEventSeverity;
  }
): void {
  const event: SecurityEvent = {
    type,
    severity: options?.severity || severityMap[type],
    timestamp: new Date().toISOString(),
    ip: options?.ip,
    userId: options?.userId,
    email: options?.email,
    path: options?.path,
    details: options?.details,
  };

  // Format du log pour faciliter la recherche
  const logMessage = `[SECURITY] [${event.severity.toUpperCase()}] ${event.type}`;
  const logData = {
    ...event,
    // Masquer partiellement l'email pour la confidentialité
    email: event.email ? maskEmail(event.email) : undefined,
  };

  // Log selon la sévérité
  switch (event.severity) {
    case 'critical':
      console.error(logMessage, JSON.stringify(logData));
      // TODO: Envoyer une alerte (email, Slack, etc.)
      break;
    case 'error':
      console.error(logMessage, JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(logMessage, JSON.stringify(logData));
      break;
    case 'info':
    default:
      console.log(logMessage, JSON.stringify(logData));
      break;
  }

  // TODO: En production, envoyer à un service de monitoring (Sentry, Datadog, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoringService(event);
  // }
}

/**
 * Masque partiellement un email pour les logs
 * exemple: "user@domain.com" -> "u***@domain.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Helpers pour les événements courants
 */
export const securityLogger = {
  // Authentification
  loginFailed: (ip: string, email?: string, details?: Record<string, unknown>) =>
    logSecurityEvent('auth_login_failed', { ip, email, details }),

  loginSuccess: (ip: string, userId: string, email?: string) =>
    logSecurityEvent('auth_login_success', { ip, userId, email }),

  logout: (userId: string) =>
    logSecurityEvent('auth_logout', { userId }),

  twoFactorFailed: (ip: string, userId: string) =>
    logSecurityEvent('auth_2fa_failed', { ip, userId }),

  // Rate limiting
  rateLimitExceeded: (ip: string, path: string) =>
    logSecurityEvent('rate_limit_exceeded', { ip, path }),

  // Paiements
  paymentValidationFailed: (userId: string, details: Record<string, unknown>) =>
    logSecurityEvent('payment_validation_failed', { userId, details }),

  paymentAmountMismatch: (userId: string, bookingId: string, expected: number, received: number) =>
    logSecurityEvent('payment_amount_mismatch', {
      userId,
      details: { bookingId, expected, received },
      severity: 'critical',
    }),

  // Webhooks
  webhookInvalidSignature: (ip: string, path: string) =>
    logSecurityEvent('webhook_invalid_signature', { ip, path }),

  webhookRateLimit: (ip: string, path: string) =>
    logSecurityEvent('webhook_rate_limit', { ip, path }),

  // XSS/CSRF
  xssBlocked: (ip: string, path: string, details?: Record<string, unknown>) =>
    logSecurityEvent('xss_attempt_blocked', { ip, path, details }),

  csrfBlocked: (ip: string, path: string) =>
    logSecurityEvent('csrf_attempt_blocked', { ip, path }),

  // Accès non autorisé
  unauthorizedAccess: (ip: string, path: string, userId?: string) =>
    logSecurityEvent('unauthorized_access', { ip, path, userId }),

  adminAccessDenied: (ip: string, userId: string, path: string) =>
    logSecurityEvent('admin_access_denied', { ip, userId, path }),

  // Activité suspecte
  suspiciousActivity: (ip: string, details: Record<string, unknown>) =>
    logSecurityEvent('suspicious_activity', { ip, details, severity: 'critical' }),
};

export default securityLogger;
