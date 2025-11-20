// apps/web/src/lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Récupère la session courante ou `null`.
 * À utiliser dans les Server Components (RSC) ou routes.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Helper pour exiger qu'un utilisateur soit connecté.
 * À utiliser dans des routes si tu veux factoriser un peu.
 *
 * Exemple :
 *   const { session } = await requireAuth();
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }
  return { session };
}

/**
 * Helper pour exiger un hôte (host) :
 * - role HOST ou BOTH
 * - ou isHost = true (payoutsEnabled / hostProfile ok)
 */
export async function requireHost() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED");
  }

  const { role, isHost } = session.user as any;

  const isHostRole = role === "HOST" || role === "BOTH";
  if (!isHostRole && !isHost) {
    throw new Error("FORBIDDEN_HOST_ONLY");
  }

  return { session };
}
