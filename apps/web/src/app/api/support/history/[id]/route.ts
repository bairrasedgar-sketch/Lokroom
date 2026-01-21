// apps/web/src/app/api/support/history/[id]/route.ts
// Récupère une conversation support spécifique de l'historique
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/support/history/[id] → récupère une conversation spécifique
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  // Récupérer la conversation
  const conversation = await prisma.supportConversation.findFirst({
    where: {
      id,
      userId: user.id, // S'assurer que c'est bien la conversation de l'utilisateur
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      assignedAdmin: {
        select: { id: true, name: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}
