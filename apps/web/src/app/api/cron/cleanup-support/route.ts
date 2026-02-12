// apps/web/src/app/api/cron/cleanup-support/route.ts
// Supprime les conversations support fermées de plus de 7 jours
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Vérifier l'autorisation
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Supprimer les messages des conversations fermées de plus de 7 jours
    const deletedMessages = await prisma.supportMessage.deleteMany({
      where: {
        conversation: {
          status: { in: ["CLOSED", "RESOLVED"] },
          closedAt: { lte: sevenDaysAgo },
        },
      },
    });

    // Supprimer les conversations fermées de plus de 7 jours
    const deletedConversations = await prisma.supportConversation.deleteMany({
      where: {
        status: { in: ["CLOSED", "RESOLVED"] },
        closedAt: { lte: sevenDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      deletedMessages: deletedMessages.count,
      deletedConversations: deletedConversations.count,
    });
  } catch (error) {
    logger.error("Error cleaning up support conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
