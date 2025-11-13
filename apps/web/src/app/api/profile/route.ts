import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// PATCH /api/profile → met à jour le profil
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, country, role } = await req.json();

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name, country, role },
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
