// apps/web/src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      hostProfile: {
        select: {
          payoutsEnabled: true,
          kycStatus: true,
        },
      },
      wallet: {
        select: {
          balanceCents: true,
        },
      },
    },
  });

  return NextResponse.json({ user });
}
