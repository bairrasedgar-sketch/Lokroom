import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendWaitlistConfirmation } from "@/lib/email";

const waitlistSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = waitlistSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà inscrite sur la liste d'attente" },
        { status: 409 }
      );
    }

    // Create waitlist entry
    await prisma.waitlist.create({
      data: {
        email,
        source: "mobile_app",
      },
    });

    // Send confirmation email
    try {
      await sendWaitlistConfirmation(email);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      { success: true, message: "Inscription réussie" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all waitlist entries (admin only - add auth check in production)
    const entries = await prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
    });

    const total = entries.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = entries.filter(
      (entry) => entry.createdAt >= today
    ).length;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekCount = entries.filter(
      (entry) => entry.createdAt >= lastWeek
    ).length;

    return NextResponse.json({
      entries,
      stats: {
        total,
        today: todayCount,
        week: weekCount,
      },
    });
  } catch (error) {
    console.error("Waitlist GET error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
