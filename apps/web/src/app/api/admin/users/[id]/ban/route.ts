/**
 * API Admin - Bannir un utilisateur
 * POST /api/admin/users/[id]/ban
 * DELETE /api/admin/users/[id]/ban - Débannir
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:ban");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    // Validation Zod du body
    const { adminBanUserSchema, validateRequestBody } = await import("@/lib/validations/api");
    const validation = await validateRequestBody(request, adminBanUserSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { reason, expiresAt } = validation.data;

    // Vérifier que l'utilisateur existe et n'est pas admin
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Impossible de bannir un administrateur" },
        { status: 403 }
      );
    }

    // Créer le ban
    const ban = await prisma.userBan.create({
      data: {
        id: `ban_${Date.now()}`,
        userId: id,
        bannedById: auth.session.user.id,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "USER_BANNED",
      targetType: "User",
      targetId: id,
      details: {
        reason,
        expiresAt,
        userEmail: user.email,
      },
      request,
    });

    return NextResponse.json({ success: true, ban });
  } catch (error) {
    console.error("Erreur bannissement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("users:ban");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    // Désactiver tous les bans actifs
    await prisma.userBan.updateMany({
      where: {
        userId: id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "USER_UNBANNED",
      targetType: "User",
      targetId: id,
      details: {},
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur débannissement:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
