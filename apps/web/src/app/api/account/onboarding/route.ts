// apps/web/src/app/api/account/onboarding/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

// Schéma de validation Zod pour l'onboarding
const onboardingSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  role: z.enum(["guest", "host"]).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  addressLine1: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().max(2).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour onboarding
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`onboarding:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

  // Validation Zod
  const validation = onboardingSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || "Données invalides" },
      { status: 400 }
    );
  }

  const {
    firstName,
    lastName,
    role,
    birthDate,
    phone,
    addressLine1,
    city,
    postalCode,
    country,
  } = validation.data;

  const fullName = `${firstName} ${lastName}`.trim();

  // Convertir le rôle frontend en enum Prisma
  const prismaRole = role === "host" ? "HOST" : role === "guest" ? "GUEST" : undefined;

  // Parse birthDate si fournie
  let parsedBirthDate: Date | null = null;
  if (birthDate) {
    const date = new Date(birthDate);
    if (!isNaN(date.getTime())) {
      parsedBirthDate = date;
    }
  }

  // Mise à jour utilisateur + profil dans une transaction
  // On check si c'est un nouvel utilisateur (pas encore de profil)
  const existingProfile = await prisma.userProfile.findFirst({
    where: { user: { email: session.user!.email! } },
    select: { id: true },
  });

  const isNewUser = !existingProfile;

  await prisma.$transaction(async (tx) => {
    // Mise à jour User
    await tx.user.update({
      where: { email: session.user!.email! },
      data: {
        name: fullName,
        country: country || undefined,
        role: prismaRole || undefined,
      },
    });

    // Upsert UserProfile avec les infos complètes
    const user = await tx.user.findUnique({
      where: { email: session.user!.email! },
      select: { id: true },
    });

    if (user) {
      await tx.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          firstName,
          lastName,
          birthDate: parsedBirthDate,
          phone: phone || null,
          addressLine1: addressLine1 || null,
          city: city || null,
          postalCode: postalCode || null,
          country: country || null,
        },
        update: {
          firstName,
          lastName,
          birthDate: parsedBirthDate,
          phone: phone || undefined,
          addressLine1: addressLine1 || undefined,
          city: city || undefined,
          postalCode: postalCode || undefined,
          country: country || undefined,
        },
      });
    }
  });

    // Envoyer l'email de bienvenue seulement pour les nouveaux utilisateurs
    if (isNewUser && session.user.email) {
      // Fire and forget - on ne bloque pas la réponse
      sendWelcomeEmail(session.user.email, firstName).catch((error) => {
        logger.error("[Onboarding] Erreur envoi email bienvenue:", error);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("POST /api/account/onboarding error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
