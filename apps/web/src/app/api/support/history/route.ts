// apps/web/src/app/api/support/history/route.ts
// Récupère l'historique des conversations support (fermées) de l'utilisateur
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/support/history → récupère l'historique des conversations fermées
export async function GET() {
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

  // Calculer la date limite (7 jours)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Récupérer les conversations fermées des 7 derniers jours
  const conversations = await prisma.supportConversation.findMany({
    where: {
      userId: user.id,
      status: { in: ["CLOSED", "RESOLVED"] },
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1, // Juste le premier message pour l'aperçu
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ conversations });
}
