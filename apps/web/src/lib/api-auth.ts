// apps/web/src/lib/api-auth.ts
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "./auth";
import { prisma } from "./db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

/**
 * Récupère l'utilisateur courant à partir de la session NextAuth.
 * Retourne null si non connecté ou user introuvable.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
}
