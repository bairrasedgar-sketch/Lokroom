// apps/web/src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/db";

/**
 * Options NextAuth partagées (exportées) pour:
 * - l’endpoint /api/auth/[...nextauth]
 * - les appels getServerSession(authOptions) dans tes API routes/pages
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  /**
   * On garde "database" (tu as déjà les tables Session/Account en place).
   * Les callbacks ci-dessous ajoutent quand même user.id dans session.user.id.
   */
  session: { strategy: "database" },

  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /**
     * Avec "database", le callback `jwt` est peu utile,
     * mais on laisse ce garde-fou si NextAuth fournit `user`.
     */
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },

    /**
     * Toujours exposer l'id dans session.user.id.
     * - Si token.sub existe (sessions JWT ou 1er cycle), on l’utilise.
     * - Sinon on récupère via l’email → user.id (sessions Database).
     */
    async session({ session, token }) {
      if (session.user) {
        if (token?.sub) {
          (session.user as any).id = token.sub;
        } else if (session.user.email) {
          const u = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          });
          if (u?.id) (session.user as any).id = u.id;
        }
      }
      return session;
    },
  },
};
