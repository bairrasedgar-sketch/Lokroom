// apps/web/src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
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
        identityStatus: true,
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
  } catch (error) {
    logger.error("Failed to fetch user profile", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "PROFILE_FETCH_FAILED",
        message: "Failed to fetch user profile. Please try again."
      },
      { status: 500 }
    );
  }
}
