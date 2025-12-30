/**
 * Utilitaires d'authentification admin Lok'Room
 * Vérifie les permissions et log les actions admin
 */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  type AdminRole,
  type Permission,
  isAdminRole,
  hasPermission,
} from "@/lib/permissions";
import type { AuditAction } from "@prisma/client";

export type AdminSession = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: AdminRole;
  };
};

/**
 * Vérifie que l'utilisateur est un admin et a la permission requise
 * Retourne la session si OK, ou une réponse d'erreur sinon
 */
export async function requireAdminPermission(
  permission: Permission
): Promise<{ session: AdminSession } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      ),
    };
  }

  const user = session.user as { id?: string; email?: string; name?: string | null; role?: string };
  const role = user.role;

  if (!isAdminRole(role)) {
    return {
      error: NextResponse.json(
        { error: "Accès refusé - Rôle admin requis" },
        { status: 403 }
      ),
    };
  }

  if (!hasPermission(role, permission)) {
    return {
      error: NextResponse.json(
        { error: `Accès refusé - Permission "${permission}" requise` },
        { status: 403 }
      ),
    };
  }

  return {
    session: {
      user: {
        id: user.id as string,
        email: user.email as string,
        name: user.name || null,
        role: role as AdminRole,
      },
    },
  };
}

/**
 * Log une action admin dans l'audit trail
 * Note: AuditLog schema uses entityType/entityId, not targetType/targetId
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  details,
  request,
}: {
  adminId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  request?: Request;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType: targetType,
        entityId: targetId,
        details: details as object | undefined,
        ipAddress: request?.headers.get("x-forwarded-for") || undefined,
        userAgent: request?.headers.get("user-agent") || undefined,
      },
    });
  } catch (error) {
    console.error("Erreur lors du log audit:", error);
  }
}
