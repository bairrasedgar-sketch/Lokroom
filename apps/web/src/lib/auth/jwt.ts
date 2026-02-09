// apps/web/src/lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-key"
);

export interface MobileAuthPayload {
  userId: string;
  email: string;
  role: string;
  type: "mobile-auth";
}

/**
 * Génère un JWT pour l'authentification mobile
 * Valable 30 jours
 */
export async function generateMobileAuthToken(
  userId: string,
  email: string,
  role: string
): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    role,
    type: "mobile-auth",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Vérifie et décode un JWT mobile
 */
export async function verifyMobileAuthToken(
  token: string
): Promise<MobileAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== "mobile-auth") {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      type: "mobile-auth",
    };
  } catch (error) {
    console.error("[JWT] Verification failed:", error);
    return null;
  }
}

/**
 * Extrait le token du header Authorization
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
