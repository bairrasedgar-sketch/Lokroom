// apps/web/src/app/api/profile/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { updateProfileSchema, validateRequestBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

// PATCH /api/profile → met à jour le profil (user + user.profile)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validation Zod du body
  const validation = await validateRequestBody(req, updateProfileSchema);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const {
    name,
    firstName,
    lastName,
    phone,
    addressLine1,
    addressLine2,
    city,
    postalCode,
    country,
    province,
  } = validation.data;

  // SÉCURITÉ: On ne permet JAMAIS de modifier le role via cette route
  // Le changement de role se fait uniquement via des routes spécifiques (become-host, etc.)

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      // Mise à jour du nom sur User si fourni
      ...(name ? { name } : {}),
      profile: {
        upsert: {
          create: {
            firstName: firstName ?? "",
            lastName: lastName ?? "",
            phone: phone ?? "",
            addressLine1: addressLine1 ?? "",
            addressLine2: addressLine2 ?? "",
            city: city ?? "",
            postalCode: postalCode ?? "",
            country: country ?? "",
            province: province ?? "",
          },
          update: {
            ...(firstName !== undefined ? { firstName } : {}),
            ...(lastName !== undefined ? { lastName } : {}),
            ...(phone !== undefined ? { phone } : {}),
            ...(addressLine1 !== undefined ? { addressLine1 } : {}),
            ...(addressLine2 !== undefined ? { addressLine2 } : {}),
            ...(city !== undefined ? { city } : {}),
            ...(postalCode !== undefined ? { postalCode } : {}),
            ...(country !== undefined ? { country } : {}),
            ...(province !== undefined ? { province } : {}),
          },
        },
      },
    },
    include: { profile: true },
  });

  return NextResponse.json({ user });
}

// GET /api/profile → retourne le profil utilisateur
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  return NextResponse.json({ user });
}
