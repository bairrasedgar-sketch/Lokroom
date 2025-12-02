// apps/web/src/app/api/account/onboarding/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Prénom et nom sont obligatoires." },
      { status: 400 }
    );
  }

  const fullName = `${firstName} ${lastName}`.trim();

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name: fullName,
    },
  });

  return NextResponse.json({ ok: true });
}
