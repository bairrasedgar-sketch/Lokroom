// apps/web/src/lib/require-auth.ts
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * À utiliser dans les PAGES (server components) et dans certaines API routes.
 * - Si l'utilisateur n'est pas connecté → redirect("/login")
 * - Si connecté → retourne la session NextAuth
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return session;
}
