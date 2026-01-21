/**
 * API Admin - Alertes
 * GET /api/admin/alerts
 *
 * Retourne les alertes urgentes et les stats pour la barre de navigation
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdminPermission("dashboard:view");
  if ("error" in auth) return auth.error;

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Stats rapides
    const [pendingListings, openDisputes, todayBookings, pendingSupport] = await Promise.all([
      prisma.listingModeration.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.dispute.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW", "AWAITING_HOST", "AWAITING_GUEST"] } },
      }),
      prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.supportConversation.count({ where: { status: "WAITING_AGENT" } }),
    ]);

    // Alertes prioritaires
    type Alert = {
      id: string;
      type: "dispute" | "listing" | "user" | "booking" | "support";
      title: string;
      message: string;
      priority: "high" | "medium" | "low";
      createdAt: string;
      actionUrl?: string;
    };
    const alerts: Alert[] = [];

    // Demandes de support en attente (priorité haute)
    const pendingSupportConversations = await prisma.supportConversation.findMany({
      where: { status: "WAITING_AGENT" },
      select: {
        id: true,
        subject: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    pendingSupportConversations.forEach((s) => {
      alerts.push({
        id: `support-${s.id}`,
        type: "support" as const,
        title: `Demande de support`,
        message: `${s.user.name || s.user.email} : ${s.subject || "Besoin d'aide"}`,
        priority: "high" as const,
        createdAt: s.createdAt.toISOString(),
        actionUrl: `/admin/support/${s.id}`,
      });
    });

    // Litiges haute priorité
    const highPriorityDisputes = await prisma.dispute.findMany({
      where: {
        status: { in: ["OPEN", "UNDER_REVIEW"] },
        priority: { lte: 2 },
      },
      select: {
        id: true,
        reason: true,
        createdAt: true,
        openedBy: { select: { name: true } },
      },
      orderBy: { priority: "asc" },
      take: 3,
    });

    highPriorityDisputes.forEach((d) => {
      alerts.push({
        id: `dispute-${d.id}`,
        type: "dispute" as const,
        title: `Litige urgent`,
        message: `${d.reason.replace(/_/g, " ")} - ${d.openedBy.name || "Utilisateur"}`,
        priority: "high" as const,
        createdAt: d.createdAt.toISOString(),
        actionUrl: `/admin/disputes/${d.id}`,
      });
    });

    // Annonces en attente depuis longtemps (> 24h)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oldPendingListings = await prisma.listing.findMany({
      where: {
        ListingModeration: { status: "PENDING_REVIEW" },
        createdAt: { lt: dayAgo },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      take: 3,
    });

    oldPendingListings.forEach((l) => {
      alerts.push({
        id: `listing-${l.id}`,
        type: "listing" as const,
        title: `Annonce en attente`,
        message: `"${l.title}" attend depuis +24h`,
        priority: "medium" as const,
        createdAt: l.createdAt.toISOString(),
        actionUrl: `/admin/listings/${l.id}`,
      });
    });

    // Trier par priorité
    alerts.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

    return NextResponse.json({
      alerts,
      stats: {
        pendingListings,
        openDisputes,
        todayBookings,
        pendingSupport,
      },
    });
  } catch (error) {
    console.error("Erreur API admin alerts:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
