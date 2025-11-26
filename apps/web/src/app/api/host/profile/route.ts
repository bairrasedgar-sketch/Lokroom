// apps/web/src/app/api/host/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

// GET /api/host/profile
// ⛏️ _req était défini mais jamais utilisé → on l'enlève
export async function GET() {
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
}

// PUT /api/host/profile
export async function PUT(req: NextRequest) {
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

  const bodyRaw = (await req.json().catch(() => null)) as
    | HostProfileUpdateBody
    | null;

  if (!bodyRaw) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400 },
    );
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
}
