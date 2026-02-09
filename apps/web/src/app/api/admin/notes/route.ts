/**
 * API Admin - Gestion des notes admin
 * POST /api/admin/notes - Créer une note
 * DELETE /api/admin/notes/[id] - Supprimer une note
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  try {
    // Validation Zod du body
    const { createAdminNoteSchema, validateRequestBody } = await import("@/lib/validations/api");
    const validation = await validateRequestBody(request, createAdminNoteSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { targetType, targetId, content, isImportant } = validation.data;

    const note = await prisma.adminNote.create({
      data: {
        targetType,
        targetId,
        content,
        isPinned: isImportant || false,
        authorId: auth.session.user.id,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Erreur création note:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    const where: Record<string, string> = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    const notes = await prisma.adminNote.findMany({
      where,
      include: {
        author: { select: { name: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Erreur récupération notes:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
