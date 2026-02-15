// apps/web/src/app/api/host/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const RESPONSE_TIME_VALUES = [
  "moins_une_heure",
  "quelques_heures",
  "un_jour",
] as const;

type ResponseTimeCategory = (typeof RESPONSE_TIME_VALUES)[number];

type HostProfileUpdateBody = {
  bio?: string;
  avatarUrl?: string;
  languages?: string[];
  responseTimeCategory?: ResponseTimeCategory | null;
  instagram?: string;
  website?: string;
  experienceYears?: number | null;
};

function sanitizeLanguages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0)
    .slice(0, 10);
}

async function computeHostStats(userId: string) {
  const [userProfile, bookingGroups] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: {
        listing: {
          ownerId: userId,
        },
      },
    }),
  ]);

  const totalHosted = bookingGroups.reduce(
    (acc, g) => acc + g._count._all,
    0,
  );
  const cancelled =
    bookingGroups.find((g) => g.status === "CANCELLED")?._count._all ?? 0;

  const cancelRate = totalHosted > 0 ? cancelled / totalHosted : 0;

  const ratingAvg = userProfile?.ratingAvg ?? 0;
  const ratingCount = userProfile?.ratingCount ?? 0;

  // 💫 Règles superhost (simple pour le moment)
  const superhost =
    ratingCount >= 10 && ratingAvg >= 4.5 && cancelRate <= 0.1;

  return {
    ratingAvg,
    ratingCount,
    totalHosted,
    cancelRate,
    superhost,
  };
}

// 🔒 VALIDATION: Schéma Zod pour la mise à jour du profil
const hostProfileUpdateSchema = z.object({
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  languages: z.array(z.string()).max(10).optional(),
  responseTimeCategory: z.enum(["moins_une_heure", "quelques_heures", "un_jour"]).nullable().optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional(),
  experienceYears: z.number().int().min(0).max(60).nullable().optional(),
});

// GET /api/host/profile
export async function GET(req: Request) {
  try {
    // 🔒 RATE LIMITING: 30 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`host-profile-get:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

  // On s'assure que le HostProfile existe
  const profile = await prisma.hostProfile.upsert({
    where: { userId: me.id },
    create: { userId: me.id },
    update: {},
  });

  const stats = await computeHostStats(me.id);

  // On garde superhost à jour en DB
  if (profile.superhost !== stats.superhost) {
    await prisma.hostProfile.update({
      where: { userId: me.id },
      data: { superhost: stats.superhost, verifiedEmail: !!me.emailVerified },
    });
  }

  const freshProfile = await prisma.hostProfile.findUnique({
    where: { userId: me.id },
  });

    return NextResponse.json({
      profile: freshProfile,
      stats: {
        ...stats,
        verifiedEmail: !!me.emailVerified,
      },
    });
  } catch (error) {
    logger.error("GET /api/host/profile error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/host/profile
export async function PUT(req: NextRequest) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour les mises à jour
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`host-profile-update:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!me) {
    return NextResponse.json({ error: "User_not_found" }, { status: 404 });
  }

    // 🔒 VALIDATION: Valider les inputs avec Zod
    let bodyRaw: z.infer<typeof hostProfileUpdateSchema>;
    try {
      bodyRaw = hostProfileUpdateSchema.parse(await req.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

  const languages = sanitizeLanguages(bodyRaw.languages ?? []);

  let responseTimeCategory: ResponseTimeCategory | null = null;
  if (
    bodyRaw.responseTimeCategory &&
    RESPONSE_TIME_VALUES.includes(bodyRaw.responseTimeCategory)
  ) {
    responseTimeCategory = bodyRaw.responseTimeCategory;
  }

  const experienceYears =
    typeof bodyRaw.experienceYears === "number"
      ? Math.min(Math.max(Math.round(bodyRaw.experienceYears), 0), 60)
      : null;

  const bio =
    typeof bodyRaw.bio === "string" && bodyRaw.bio.trim().length > 0
      ? bodyRaw.bio.trim().slice(0, 2000)
      : null;

  const avatarUrl =
    typeof bodyRaw.avatarUrl === "string" &&
    bodyRaw.avatarUrl.trim().length > 0
      ? bodyRaw.avatarUrl.trim()
      : null;

  const instagram =
    typeof bodyRaw.instagram === "string" &&
    bodyRaw.instagram.trim().length > 0
      ? bodyRaw.instagram.trim()
      : null;

  const website =
    typeof bodyRaw.website === "string" &&
    bodyRaw.website.trim().length > 0
      ? bodyRaw.website.trim()
      : null;

  // On met à jour le profil host
  // ⛏️ 'updated' était assigné mais jamais utilisé → on enlève la variable
  await prisma.hostProfile.upsert({
    where: { userId: me.id },
    create: {
      userId: me.id,
      bio,
      avatarUrl,
      languages,
      responseTimeCategory,
      instagram,
      website,
      experienceYears,
      verifiedEmail: !!me.emailVerified,
    },
    update: {
      bio,
      avatarUrl,
      languages,
      responseTimeCategory,
      instagram,
      website,
      experienceYears,
      verifiedEmail: !!me.emailVerified,
    },
  });

  const stats = await computeHostStats(me.id);

  // On synchronise superhost
  const finalProfile = await prisma.hostProfile.update({
    where: { userId: me.id },
    data: {
      superhost: stats.superhost,
      verifiedEmail: !!me.emailVerified,
    },
  });

    return NextResponse.json({
      profile: finalProfile,
      stats: {
        ...stats,
        verifiedEmail: !!me.emailVerified,
      },
    });
  } catch (error) {
    logger.error("PUT /api/host/profile error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
