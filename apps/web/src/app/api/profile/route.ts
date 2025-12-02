// apps/web/src/app/api/profile/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// PATCH /api/profile → met à jour le profil (user + user.profile)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    name,
    country,
    role,
    firstName,
    lastName,
    phone,
    addressLine1,
    addressLine2,
    city,
    postalCode,
    profileCountry,
    province,
  } = body as {
    name?: string;
    country?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    profileCountry?: string;
    province?: string;
  };

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name,
      country,
      role: role as any,
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
            country: profileCountry ?? "",
            province: province ?? "",
          },
          update: {
            firstName: firstName ?? undefined,
            lastName: lastName ?? undefined,
            phone: phone ?? undefined,
            addressLine1: addressLine1 ?? undefined,
            addressLine2: addressLine2 ?? undefined,
            city: city ?? undefined,
            postalCode: postalCode ?? undefined,
            country: profileCountry ?? undefined,
            province: province ?? undefined,
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
