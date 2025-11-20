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
     * Toujours exposer dans `session.user` :
     * - id
     * - role (HOST / GUEST / BOTH)
     * - isHost (booléen pratique côté front)
     *
     * Comme on est en `strategy: "database"`, on lit systématiquement
     * l'utilisateur en BDD à partir de l'email.
     */
    async session({ session }) {
      if (!session.user?.email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          role: true,
          hostProfile: {
            select: {
              payoutsEnabled: true,
            },
          },
        },
      });

      if (!dbUser) return session;

      (session.user as any).id = dbUser.id;
      (session.user as any).role = dbUser.role;
      (session.user as any).isHost =
        dbUser.role === "HOST" ||
        dbUser.role === "BOTH" ||
        !!dbUser.hostProfile?.payoutsEnabled;

      return session;
    },
  },
};
