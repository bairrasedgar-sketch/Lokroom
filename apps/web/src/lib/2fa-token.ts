// apps/web/src/lib/2fa-token.ts
// Utilitaires pour les tokens temporaires 2FA

import { SignJWT, jwtVerify } from "jose";

// 🔒 SÉCURITÉ : Clé pour les tokens temporaires 2FA
// CRITICAL: Fail fast si la variable d'environnement n'est pas définie
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET is required. Please set it in your .env file."
  );
}

const TWO_FACTOR_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET
);

// Duree de validite du token temporaire (5 minutes)
const TOKEN_EXPIRY = "5m";

export type TwoFactorTokenPayload = {
  userId: string;
  email: string;
  type: "2fa-pending";
  exp?: number;
};

/**
 * Genere un token temporaire pour la verification 2FA
 */
export async function generateTwoFactorPendingToken(
  userId: string,
  email: string
): Promise<string> {
  const token = await new SignJWT({ userId, email, type: "2fa-pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(TWO_FACTOR_SECRET);

  return token;
}

/**
 * Verifie un token temporaire 2FA
 */
export async function verifyTwoFactorPendingToken(
  token: string
): Promise<TwoFactorTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, TWO_FACTOR_SECRET);

    if (payload.type !== "2fa-pending") {
      return null;
    }

    return payload as TwoFactorTokenPayload;
  } catch {
    return null;
  }
}
