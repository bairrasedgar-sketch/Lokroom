import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
