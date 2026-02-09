/**
 * Système de permissions admin Lok'Room
 *
 * Rôles disponibles :
 * - ADMIN      : Super admin - accès complet à tout
 * - MODERATOR  : Modération annonces/users (pas config système)
 * - SUPPORT    : Litiges/messages (pas ban users)
 * - FINANCE    : Stats financières (lecture seule)
 */

// Types de rôles admin
export type AdminRole = "ADMIN" | "MODERATOR" | "SUPPORT" | "FINANCE";

// Toutes les permissions possibles
export type Permission =
  // Dashboard
  | "dashboard:view"
  // Analytics
  | "analytics:view"
  // Utilisateurs
  | "users:view"
  | "users:edit"
  | "users:ban"
  | "users:verify"
  | "users:notify"
  // Annonces
  | "listings:view"
  | "listings:edit"
  | "listings:delete"
  | "listings:approve"
  // Réservations
  | "bookings:view"
  | "bookings:cancel"
  | "bookings:refund"
  // Paiements
  | "payments:view"
  | "payments:refund"
  // Litiges
  | "disputes:view"
  | "disputes:assign"
  | "disputes:resolve"
  | "disputes:message"
  | "disputes:manage"
  // Messages
  | "messages:view"
  // Codes promo
  | "promos:view"
  | "promos:create"
  | "promos:edit"
  | "promos:delete"
  // Logs
  | "logs:view"
  // Configuration
  | "config:view"
  | "config:edit"
  // Backups
  | "backups:view"
  | "backups:create"
  | "backups:download"
  | "backups:restore"
  | "backups:delete";

// Permissions par rôle
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  // Super admin - accès à tout
  ADMIN: [
    "dashboard:view",
    "analytics:view",
    "users:view", "users:edit", "users:ban", "users:verify", "users:notify",
    "listings:view", "listings:edit", "listings:delete", "listings:approve",
    "bookings:view", "bookings:cancel", "bookings:refund",
    "payments:view", "payments:refund",
    "disputes:view", "disputes:assign", "disputes:resolve", "disputes:message", "disputes:manage",
    "messages:view",
    "promos:view", "promos:create", "promos:edit", "promos:delete",
    "logs:view",
    "config:view", "config:edit",
    "backups:view", "backups:create", "backups:download", "backups:restore", "backups:delete",
  ],

  // Modérateur - gère users et annonces
  MODERATOR: [
    "dashboard:view",
    "analytics:view",
    "users:view", "users:edit", "users:ban", "users:verify",
    "listings:view", "listings:edit", "listings:delete", "listings:approve",
    "bookings:view",
    "payments:view",
    "disputes:view", "disputes:message",
    "messages:view",
    "promos:view",
    "logs:view",
  ],

  // Support - gère litiges et messages
  SUPPORT: [
    "dashboard:view",
    "users:view", "users:notify",
    "listings:view",
    "bookings:view", "bookings:cancel",
    "payments:view",
    "disputes:view", "disputes:assign", "disputes:resolve", "disputes:message", "disputes:manage",
    "messages:view",
  ],

  // Finance - lecture seule des stats + paiements
  FINANCE: [
    "dashboard:view",
    "analytics:view",
    "users:view",
    "listings:view",
    "bookings:view",
    "payments:view", "payments:refund",
    "disputes:view",
    "promos:view", "promos:create", "promos:edit",
  ],
};

// Rôles qui peuvent accéder à l'admin
export const ADMIN_ROLES: AdminRole[] = ["ADMIN", "MODERATOR", "SUPPORT", "FINANCE"];

/**
 * Vérifie si un rôle est un rôle admin
 */
export function isAdminRole(role: string | undefined | null): role is AdminRole {
  return !!role && ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role || !isAdminRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Récupère toutes les permissions d'un rôle
 */
export function getPermissions(role: string | undefined | null): Permission[] {
  if (!role || !isAdminRole(role)) return [];
  return ROLE_PERMISSIONS[role];
}

/**
 * Labels des rôles pour l'affichage
 */
export const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Super Admin",
  MODERATOR: "Modérateur",
  SUPPORT: "Support",
  FINANCE: "Finance",
};

/**
 * Descriptions des rôles
 */
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  ADMIN: "Accès complet à toutes les fonctionnalités",
  MODERATOR: "Modération des annonces et utilisateurs",
  SUPPORT: "Gestion des litiges et messages",
  FINANCE: "Consultation des statistiques financières",
};

/**
 * Couleurs des badges par rôle
 */
export const ROLE_COLORS: Record<AdminRole, string> = {
  ADMIN: "bg-red-100 text-red-800",
  MODERATOR: "bg-blue-100 text-blue-800",
  SUPPORT: "bg-green-100 text-green-800",
  FINANCE: "bg-purple-100 text-purple-800",
};

/**
 * Pages accessibles par rôle
 */
export const ROLE_PAGES: Record<AdminRole, string[]> = {
  ADMIN: ["/admin", "/admin/analytics", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/payments", "/admin/disputes", "/admin/messages", "/admin/promos", "/admin/logs", "/admin/settings"],
  MODERATOR: ["/admin", "/admin/analytics", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/payments", "/admin/disputes", "/admin/messages", "/admin/promos", "/admin/logs"],
  SUPPORT: ["/admin", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/payments", "/admin/disputes", "/admin/messages"],
  FINANCE: ["/admin", "/admin/analytics", "/admin/users", "/admin/listings", "/admin/bookings", "/admin/payments", "/admin/disputes", "/admin/promos"],
};

/**
 * Vérifie si un rôle peut accéder à une page
 */
export function canAccessPage(role: string | undefined | null, pathname: string): boolean {
  if (!role || !isAdminRole(role)) return false;

  // Normaliser le pathname (enlever les trailing slashes)
  const normalizedPath = pathname.replace(/\/$/, "") || "/admin";

  // Vérifier l'accès exact ou le préfixe
  return ROLE_PAGES[role].some(page =>
    normalizedPath === page || normalizedPath.startsWith(page + "/")
  );
}
