// POST /api/auth/2fa/check - Verifier si l'utilisateur a le 2FA active
// Cette route est appelee apres la verification du mot de passe
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { generateTwoFactorPendingToken } from "@/lib/2fa-token";

export async function POST(req: NextRequest) {
  try {
    // Parser le body
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`2fa-check:${email}`, 10, 60000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans une minute." },
        { status: 429 }
      );
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        twoFactorSecret: {
          select: { enabled: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      // Ne pas reveler si l'utilisateur existe
      return NextResponse.json({ requires2FA: false });
    }

    // Verifier le mot de passe
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ requires2FA: false });
    }

    // Verifier si 2FA est active
    if (user.twoFactorSecret?.enabled) {
      // Generer un token temporaire pour la verification 2FA
      const twoFactorToken = await generateTwoFactorPendingToken(user.id, user.email);

      return NextResponse.json({
        requires2FA: true,
        twoFactorToken,
      });
    }

    return NextResponse.json({ requires2FA: false });
  } catch (error) {
    console.error("[2FA Check] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la verification" },
      { status: 500 }
    );
  }
}
