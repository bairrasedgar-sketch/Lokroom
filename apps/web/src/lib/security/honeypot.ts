/**
 * Lok'Room - Honeypot pour détecter les bots et attaquants
 * Endpoints et champs invisibles pour piéger les bots
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

// ============================================
// DÉTECTION ET BANNISSEMENT
// ============================================

/**
 * Enregistre une tentative d'accès au honeypot
 */
async function logHoneypotAccess(req: NextRequest, type: string) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const url = req.url;

  logger.warn("[HONEYPOT] Bot/Attacker detected", {
    type,
    ip,
    userAgent,
    url,
    method: req.method,
  });

  // Enregistrer dans les logs de sécurité
  // Note: AuditLog nécessite un adminId, on utilise donc le logger uniquement
  // TODO: Créer une table SecurityLog dédiée pour les événements de sécurité
  logger.warn("[HONEYPOT] Access logged", {
    type,
    ip,
    userAgent,
    url,
    method: req.method,
  });

  // TODO: Ajouter l'IP à une liste noire (Redis)
  // await banIpAddress(ip, "honeypot_triggered");
}

/**
 * Vérifie si un champ honeypot a été rempli
 */
export function checkHoneypotField(fieldValue: unknown): boolean {
  // Si le champ honeypot est rempli, c'est un bot
  return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
}

// ============================================
// ENDPOINTS HONEYPOT
// ============================================

/**
 * Endpoint honeypot: /api/admin-secret
 * Piège pour les bots qui scannent les endpoints admin
 */
export async function honeypotAdminSecret(req: NextRequest) {
  await logHoneypotAccess(req, "admin_secret_endpoint");

  // Retourner une fausse réponse pour ne pas éveiller les soupçons
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

/**
 * Endpoint honeypot: /api/wp-admin
 * Piège pour les bots qui cherchent WordPress
 */
export async function honeypotWordPress(req: NextRequest) {
  await logHoneypotAccess(req, "wordpress_scan");

  return NextResponse.json(
    { error: "Not Found" },
    { status: 404 }
  );
}

/**
 * Endpoint honeypot: /api/.env
 * Piège pour les bots qui cherchent les fichiers .env
 */
export async function honeypotEnvFile(req: NextRequest) {
  await logHoneypotAccess(req, "env_file_scan");

  return NextResponse.json(
    { error: "Not Found" },
    { status: 404 }
  );
}

/**
 * Endpoint honeypot: /api/phpmyadmin
 * Piège pour les bots qui cherchent phpMyAdmin
 */
export async function honeypotPhpMyAdmin(req: NextRequest) {
  await logHoneypotAccess(req, "phpmyadmin_scan");

  return NextResponse.json(
    { error: "Not Found" },
    { status: 404 }
  );
}

// ============================================
// COMPOSANT REACT HONEYPOT
// ============================================

/**
 * Champ honeypot invisible pour les formulaires
 * À ajouter dans les formulaires sensibles (signup, login, etc.)
 *
 * Usage:
 * <input
 *   type="text"
 *   name="website"
 *   tabIndex={-1}
 *   autoComplete="off"
 *   style={{ position: 'absolute', left: '-9999px' }}
 * />
 */
export const HONEYPOT_FIELD_NAME = "website";

/**
 * Styles pour cacher le champ honeypot
 */
export const HONEYPOT_STYLES = {
  position: 'absolute' as const,
  left: '-9999px',
  width: '1px',
  height: '1px',
  opacity: 0,
  pointerEvents: 'none' as const,
};
