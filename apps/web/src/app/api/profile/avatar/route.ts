import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      profile: {
        upsert: {
          create: { avatarUrl: url },
          update: { avatarUrl: url },
        },
      },
    },
    include: { profile: true },
  });

  return NextResponse.json({ user });
}
