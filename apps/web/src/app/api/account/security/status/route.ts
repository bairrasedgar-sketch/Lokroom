// apps/web/src/app/api/account/security/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // On récupère les infos de sécurité de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      identityStatus: true,
      identityLastVerifiedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
