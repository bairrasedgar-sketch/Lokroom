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

  // On force un typage large pour éviter les erreurs de select
  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    // TS peut hurler ici → on cast en any
    select: {
      email: true,
      identityStatus: true,
      identityLastVerifiedAt: true,
    } as any,
  })) as
    | {
        email: string;
        identityStatus: string;
        identityLastVerifiedAt: Date | null;
      }
    | null;

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
