/**
 * API Admin - Conversations entre utilisateurs
 * GET /api/admin/conversations - Liste toutes les conversations
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { parsePageParam, parseLimitParam } from "@/lib/validation/params";
import { logger } from "@/lib/logger";


export async function GET(request: Request) {
  const auth = await requireAdminPermission("users:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  // 🔒 SÉCURITÉ : Validation sécurisée des paramètres de pagination
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), 20, 100);
  const search = searchParams.get("search") || "";
  const userId = searchParams.get("userId") || "";

  try {
    const skip = (page - 1) * limit;

    // Construire le filtre
    const where: Record<string, unknown> = {};

    if (userId) {
      where.OR = [{ hostId: userId }, { guestId: userId }];
    }

    if (search) {
      where.OR = [
        { host: { name: { contains: search, mode: "insensitive" } } },
        { host: { email: { contains: search, mode: "insensitive" } } },
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { guest: { email: { contains: search, mode: "insensitive" } } },
        { listing: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { avatarUrl: true } },
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        host: conv.host,
        guest: conv.guest,
        listing: conv.listing,
        lastMessage: conv.messages[0] || null,
        messageCount: conv._count.messages,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error("Erreur API admin conversations:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
