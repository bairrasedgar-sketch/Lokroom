// apps/web/src/lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export async function getCurrentSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Exige simplement que l'utilisateur soit connecté.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }
  return { session };
}

/**
 * Exige un hôte :
 * - role HOST ou BOTH
 * - ou isHost = true (Stripe / hostProfile OK)
 */
export async function requireHost() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }

  const user = session.user as any;
  const role = user.role as string | undefined;
  const isHost = Boolean(user.isHost);

  const isHostRole = role === "HOST" || role === "BOTH";
  if (!isHostRole && !isHost) {
    throw new Error("FORBIDDEN_HOST_ONLY");
  }

  return { session };
}

/**
 * Exige un admin (pour plus tard si tu fais un /admin).
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }

  const user = session.user as any;
  const role = user.role as string | undefined;

  if (role !== "ADMIN") {
    throw new Error("FORBIDDEN_ADMIN_ONLY");
  }

  return { session };
}
